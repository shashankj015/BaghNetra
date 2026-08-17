import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from app.preprocessing.image_ops import isolate_flank_region, preprocess_for_embedding, extract_flank_views
from app.utils.logger import logger


class StripeEmbeddingNet(nn.Module if HAS_TORCH else object):
    """Compact spatial metric-learning network for tiger stripe re-identification.

    Unlike the old network, this version keeps a 4x4 spatial feature map before
    projection, so stripe placement is not discarded by global 1x1 pooling.
    A small identity classifier is included during training; inference uses only
    the normalized embedding.
    """
    def __init__(self, embedding_dim: int = 512, num_classes: int = 6, pretrained: bool = False):
        if not HAS_TORCH:
            return
        super().__init__()
        self.embedding_dim = embedding_dim
        self.num_classes = num_classes
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, 3, stride=2, padding=1), nn.BatchNorm2d(16), nn.ReLU(inplace=True),
            nn.Conv2d(16, 32, 3, stride=2, padding=1), nn.BatchNorm2d(32), nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, 3, stride=2, padding=1), nn.BatchNorm2d(64), nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, 3, stride=2, padding=1), nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, stride=1, padding=1), nn.BatchNorm2d(128), nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((2, 2)),
        )
        self.projector = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4, 512), nn.ReLU(inplace=True), nn.Dropout(0.2),
            nn.Linear(512, embedding_dim)
        )
        self.classifier = nn.Linear(embedding_dim, num_classes)

    def forward(self, x, return_logits: bool = False):
        feat = self.features(x)
        embed = F.normalize(self.projector(feat), p=2, dim=1)
        if return_logits:
            return embed, self.classifier(embed)
        return embed


class TigerIdentifier:
    """Individual tiger re-identification using multi-view stripe embeddings."""
    def __init__(self, model_path: Optional[Path] = None, embeddings_path: Optional[Path] = None, device: str = "cpu"):
        self.device = device
        self.model = None
        self.is_loaded = False
        self.model_path = model_path
        self.embeddings_path = embeddings_path
        self.known_tigers: List[Dict[str, Any]] = []
        if HAS_TORCH:
            try:
                self.model = StripeEmbeddingNet(embedding_dim=512, num_classes=6)
                if model_path and Path(model_path).exists():
                    state_dict = torch.load(model_path, map_location=device, weights_only=True)
                    self.model.load_state_dict(state_dict, strict=True)
                    logger.info(f"Loaded Tiger Identifier V2 weights from {model_path}")
                else:
                    logger.warning("Tiger Identifier weights are unavailable; model is not loaded.")
                    self.model = None
                if self.model is not None:
                    self.model.to(device)
                    self.model.eval()
                    self.is_loaded = True
            except Exception as e:
                logger.warning(f"Tiger Identifier initialization failed: {e}")
                self.model = None
                self.is_loaded = False
        self.load_embeddings()

    def load_embeddings(self, embeddings_path: Optional[Path] = None):
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
        self.known_tigers = tiger_records

    def extract_embedding(self, flank_image: Image.Image) -> np.ndarray:
        """Average embeddings from robust flank/body views; fail closed if model is unavailable."""
        if not self.is_loaded or not HAS_TORCH:
            raise RuntimeError("Tiger identifier model is unavailable")
        try:
            views = extract_flank_views(flank_image)
            batch = torch.stack([torch.from_numpy(preprocess_for_embedding(v)) for v in views]).to(self.device)
            with torch.no_grad():
                embeds = self.model(batch).cpu().numpy()
            mean_embed = np.mean(embeds, axis=0)
            return mean_embed / (np.linalg.norm(mean_embed) + 1e-8)
        except Exception as e:
            logger.error(f"Embedding extraction error: {e}")
            raise RuntimeError(f"Embedding extraction failed: {e}") from e

    def identify(self, tiger_crop: Image.Image, high_threshold: float = 0.82, low_threshold: float = 0.65, top_k: int = 5) -> Dict[str, Any]:
        if not self.is_loaded:
            return {
                "individual": None, "identification_confidence": 0.0, "needs_review": True,
                "status": "MODEL_UNAVAILABLE", "candidates": [], "embedding": [],
                "message": "Tiger re-identification model is unavailable; manual review required."
            }
        flank_crop = isolate_flank_region(tiger_crop)
        try:
            query_embedding = self.extract_embedding(flank_crop)
        except RuntimeError as exc:
            return {"individual": None, "identification_confidence": 0.0, "needs_review": True,
                    "status": "MODEL_UNAVAILABLE", "candidates": [], "embedding": [], "message": str(exc)}

        if not self.known_tigers:
            return {"individual": None, "identification_confidence": 0.0, "needs_review": True,
                    "status": "UNKNOWN_CANDIDATE", "candidates": [],
                    "embedding": [round(float(v), 6) for v in query_embedding],
                    "message": "No reference tiger catalogue is available."}

        candidate_scores = []
        for tiger in self.known_tigers:
            tiger_id = tiger.get("tigerId") or tiger.get("id")
            ref_emb = np.asarray(tiger.get("embedding", []), dtype=np.float32)
            if ref_emb.shape != query_embedding.shape:
                continue
            ref_emb /= (np.linalg.norm(ref_emb) + 1e-8)
            sim = float(np.dot(query_embedding, ref_emb))
            candidate_scores.append({"tigerId": tiger_id, "name": tiger.get("name", tiger_id), "similarity": round(float(np.clip(sim, 0, 1)), 4)})

        candidate_scores.sort(key=lambda x: x["similarity"], reverse=True)
        top_candidates = candidate_scores[:top_k]
        best = top_candidates[0] if top_candidates else None
        score = best["similarity"] if best else 0.0
        if best and score >= high_threshold:
            status, individual, review = "CONFIRMED_MATCH", best["tigerId"], False
        elif best and score >= low_threshold:
            status, individual, review = "AMBIGUOUS_MATCH", None, True
        else:
            status, individual, review = "UNKNOWN_CANDIDATE", None, True
        return {
            "individual": individual,
            "suggested_tiger": best["tigerId"] if status == "AMBIGUOUS_MATCH" else None,
            "tiger_name": best.get("name") if individual else None,
            "identification_confidence": score,
            "needs_review": review,
            "status": status,
            "candidates": top_candidates,
            "embedding": [round(float(v), 6) for v in query_embedding]
        }
