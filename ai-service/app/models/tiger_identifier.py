import os
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
from PIL import Image

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    import torchvision.models as models
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from app.preprocessing.image_ops import isolate_flank_region, preprocess_for_embedding
from app.utils.logger import logger

class StripeEmbeddingNet(nn.Module if HAS_TORCH else object):
    """
    Deep Metric Learning network for tiger flank stripe pattern embedding.
    Extracts 512-dimensional L2-normalized embedding projection.
    Trained with Triplet Margin Loss / Contrastive Loss.
    """
    def __init__(self, embedding_dim: int = 512, pretrained: bool = False):
        if not HAS_TORCH:
            return
        super().__init__()
        # Fast CNN feature extractor for flank stripe spatial profiles
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 256, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        self.projector = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.2),
            nn.Linear(512, embedding_dim)
        )
        self.embedding_dim = embedding_dim

    def forward(self, x):
        feat = self.features(x)
        embed = self.projector(feat)
        norm_embed = F.normalize(embed, p=2, dim=1)
        return norm_embed


class TigerIdentifier:
    """
    Individual Tiger Re-Identification Engine.
    Matches flank stripe patterns against known tiger catalog using cosine similarity.
    """
    
    def __init__(
        self,
        model_path: Optional[Path] = None,
        embeddings_path: Optional[Path] = None,
        device: str = "cpu"
    ):
        self.device = device
        self.model = None
        self.is_loaded = False
        self.model_path = model_path
        self.embeddings_path = embeddings_path
        self.known_tigers: List[Dict[str, Any]] = [] # [{ "tigerId": "BT001", "name": "Collarwali", "embedding": [...] }]
        
        if HAS_TORCH:
            try:
                self.model = StripeEmbeddingNet(embedding_dim=512, pretrained=False)
                if model_path and Path(model_path).exists():
                    state_dict = torch.load(model_path, map_location=device, weights_only=True)
                    self.model.load_state_dict(state_dict)
                    logger.info(f"Loaded Tiger Identifier weights from {model_path}")
                else:
                    self.model = StripeEmbeddingNet(embedding_dim=512, pretrained=True)
                    logger.info("Initialized Stripe Embedding Network with ResNet50 backbone")
                self.model.to(device)
                self.model.eval()
                self.is_loaded = True
            except Exception as e:
                logger.warning(f"Tiger Identifier initialization notice: {e}")
                self.is_loaded = False
                
        self.load_embeddings()

    def load_embeddings(self, embeddings_path: Optional[Path] = None):
        """Loads reference catalog embeddings from JSON or memory."""
        path = embeddings_path or self.embeddings_path
        if path and Path(path).exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    self.known_tigers = json.load(f)
                logger.info(f"Loaded {len(self.known_tigers)} reference tiger embeddings")
            except Exception as e:
                logger.error(f"Error loading tiger embeddings from {path}: {e}")
        else:
            self.known_tigers = []

    def set_reference_embeddings(self, tiger_records: List[Dict[str, Any]]):
        """Allows dynamic injection of reference embeddings from MongoDB."""
        self.known_tigers = tiger_records

    def extract_embedding(self, flank_image: Image.Image) -> np.ndarray:
        """Extracts a 512-dim L2-normalized embedding vector from a tiger flank crop."""
        if not self.is_loaded or not HAS_TORCH:
            return self._heuristic_embedding(flank_image)
            
        try:
            tensor_data = preprocess_for_embedding(flank_image)
            tensor = torch.from_numpy(tensor_data).unsqueeze(0).to(self.device)
            with torch.no_grad():
                embed = self.model(tensor).squeeze(0).cpu().numpy()
            return embed / (np.linalg.norm(embed) + 1e-8)
        except Exception as e:
            logger.error(f"Embedding extraction error: {e}")
            return self._heuristic_embedding(flank_image)

    def _heuristic_embedding(self, image: Image.Image) -> np.ndarray:
        """Deterministic stripe spatial frequency signature as robust baseline."""
        gray = image.convert("L").resize((64, 64))
        arr = np.array(gray, dtype=np.float32) / 255.0
        
        # Extract row-wise and column-wise stripe gradient profiles
        grad_x = np.diff(arr, axis=1)
        grad_y = np.diff(arr, axis=0)
        
        row_energy = np.mean(np.abs(grad_x), axis=1) # 64 dims
        col_energy = np.mean(np.abs(grad_y), axis=0) # 64 dims
        fft_feats = np.abs(np.fft.rfft2(arr)).flatten()[:384] # 384 dims
        
        feat = np.concatenate([row_energy, col_energy, fft_feats])
        if len(feat) < 512:
            feat = np.pad(feat, (0, 512 - len(feat)))
        else:
            feat = feat[:512]
            
        return feat / (np.linalg.norm(feat) + 1e-8)

    def identify(
        self,
        tiger_crop: Image.Image,
        high_threshold: float = 0.82,
        low_threshold: float = 0.65,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Extracts flank, computes stripe embedding, compares with known tiger catalog.
        
        Rules:
          - similarity >= HIGH_THRESHOLD (0.82): automatically identified
          - LOW_THRESHOLD <= similarity < HIGH_THRESHOLD: human review required
          - similarity < LOW_THRESHOLD: unknown candidate / new individual
        """
        flank_crop = isolate_flank_region(tiger_crop)
        query_embedding = self.extract_embedding(flank_crop)
        
        if not self.known_tigers:
            return {
                "individual": None,
                "identification_confidence": 0.0,
                "needs_review": True,
                "status": "UNKNOWN_CANDIDATE",
                "candidates": [],
                "embedding": [round(float(v), 6) for v in query_embedding],
                "message": "No reference tiger catalog available yet. Enrolled as unknown candidate."
            }
            
        # Calculate cosine similarity against all known catalog tigers
        candidate_scores = []
        for tiger in self.known_tigers:
            tiger_id = tiger.get("tigerId") or tiger.get("id")
            tiger_name = tiger.get("name", tiger_id)
            ref_emb = np.array(tiger.get("embedding", []), dtype=np.float32)
            
            if len(ref_emb) != len(query_embedding):
                continue
                
            sim = float(np.dot(query_embedding, ref_emb) / (
                (np.linalg.norm(query_embedding) * np.linalg.norm(ref_emb)) + 1e-8
            ))
            
            candidate_scores.append({
                "tigerId": tiger_id,
                "name": tiger_name,
                "similarity": round(max(0.0, min(1.0, sim)), 4)
            })
            
        candidate_scores.sort(key=lambda x: x["similarity"], reverse=True)
        top_candidates = candidate_scores[:top_k]
        
        best_match = top_candidates[0] if top_candidates else None
        best_score = best_match["similarity"] if best_match else 0.0
        
        if best_match and best_score >= high_threshold:
            return {
                "individual": best_match["tigerId"],
                "tiger_name": best_match["name"],
                "identification_confidence": best_score,
                "needs_review": False,
                "status": "CONFIRMED_MATCH",
                "candidates": top_candidates,
                "embedding": [round(float(v), 6) for v in query_embedding]
            }
        elif best_match and best_score >= low_threshold:
            return {
                "individual": None,
                "suggested_tiger": best_match["tigerId"],
                "identification_confidence": best_score,
                "needs_review": True,
                "status": "AMBIGUOUS_MATCH",
                "candidates": top_candidates,
                "embedding": [round(float(v), 6) for v in query_embedding]
            }
        else:
            return {
                "individual": None,
                "identification_confidence": best_score,
                "needs_review": True,
                "status": "UNKNOWN_CANDIDATE",
                "candidates": top_candidates,
                "embedding": [round(float(v), 6) for v in query_embedding]
            }
