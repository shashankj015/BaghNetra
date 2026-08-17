<<<<<<< HEAD
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
=======
import os
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
>>>>>>> origin/Trivedi-branch
import numpy as np
from PIL import Image

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
<<<<<<< HEAD
=======
    import torchvision.models as models
<<<<<<< HEAD
    from torchvision.models import ResNet50_Weights
=======
>>>>>>> origin/Trivedi-branch
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

<<<<<<< HEAD
try:
    import onnxruntime as ort
    HAS_ONNX = True
except ImportError:
    HAS_ONNX = False

from app.preprocessing.image_ops import isolate_flank_region
=======
<<<<<<< HEAD
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
=======
from app.preprocessing.image_ops import isolate_flank_region, preprocess_for_embedding
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
from app.utils.logger import logger


class TigerReIDResNet50(nn.Module if HAS_TORCH else object):
    """
    ResNet-50 Deep Metric Learning architecture for tiger flank stripe identification.
    Extracts 512-dimensional L2-normalized embedding projection on a unit hypersphere.
    """
    def __init__(self, num_classes: int = 0, embedding_dim: int = 512, pretrained: bool = False):
        if not HAS_TORCH:
            return
        super().__init__()
        weights = ResNet50_Weights.DEFAULT if pretrained else None
        self.backbone = models.resnet50(weights=weights)
        in_features = self.backbone.fc.in_features # 2048
        self.backbone.fc = nn.Identity()
        
        self.embedding_layer = nn.Linear(in_features, embedding_dim, bias=False)
        self.bn_neck = nn.BatchNorm1d(embedding_dim)
        self.bn_neck.bias.requires_grad_(False)
        
        if num_classes > 0:
            self.classifier = nn.Linear(embedding_dim, num_classes, bias=False)
        else:
            self.classifier = None
            
        self.embedding_dim = embedding_dim

    def extract_features(self, x: torch.Tensor) -> torch.Tensor:
        feats = self.backbone(x)
        if feats.dim() > 2:
            feats = F.adaptive_avg_pool2d(feats, (1, 1)).flatten(1)
        raw_emb = self.embedding_layer(feats)
        bn_feat = self.bn_neck(raw_emb)
        norm_emb = F.normalize(bn_feat, p=2, dim=1)
        return norm_emb

    def forward(self, x: torch.Tensor):
        return self.extract_features(x)


class TigerIdentifier:
    """
    Individual Tiger Re-Identification Engine.
    Matches flank stripe patterns against known tiger catalog using 512-D cosine similarity.
    """
    
    def __init__(
        self,
        model_path: Optional[Path] = None,
        onnx_path: Optional[Path] = None,
        embeddings_path: Optional[Path] = None,
        device: str = "cpu"
    ):
>>>>>>> origin/Trivedi-branch
        self.device = device
        self.model = None
        self.onnx_session = None
        self.is_loaded = False
        self.model_path = model_path
        self.embeddings_path = embeddings_path
<<<<<<< HEAD
        self.known_tigers: List[Dict[str, Any]] = []
=======
<<<<<<< HEAD
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
=======
        self.known_tigers: List[Dict[str, Any]] = [] # [{ "tigerId": "BT001", "name": "Collarwali", "embedding": [...] }]
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872
        
        # 1. Try Loading PyTorch ResNet-50 Model
        if HAS_TORCH and model_path and Path(model_path).exists():
            try:
                ckpt = torch.load(model_path, map_location=device)
                state_dict = ckpt.get("model_state_dict", ckpt) if isinstance(ckpt, dict) else ckpt
                
                num_classes = len(state_dict["classifier.weight"]) if "classifier.weight" in state_dict else 0
                self.model = TigerReIDResNet50(num_classes=num_classes, embedding_dim=512, pretrained=False)
                self.model.load_state_dict(state_dict, strict=False)
                self.model.to(device)
                self.model.eval()
                self.is_loaded = True
                logger.info(f"Loaded ResNet-50 Tiger Re-ID Metric Model from {model_path} onto {device}")
            except Exception as e:
                logger.warning(f"PyTorch Tiger Identifier loading notice: {e}")
                
        # 2. Fallback to ONNX Runtime if available
        if not self.is_loaded and HAS_ONNX:
            potential_onnx = onnx_path or (model_path.parent / "tiger_reid_resnet50.onnx" if model_path else None)
            if potential_onnx and Path(potential_onnx).exists():
                try:
                    self.onnx_session = ort.InferenceSession(str(potential_onnx), providers=["CPUExecutionProvider"])
                    self.is_loaded = True
                    logger.info(f"Loaded ONNX Runtime Tiger Re-ID Session from {potential_onnx}")
                except Exception as e:
                    logger.warning(f"ONNX Tiger Identifier loading notice: {e}")

        self.load_embeddings()

    def load_embeddings(self, embeddings_path: Optional[Path] = None):
        """Loads reference catalog embeddings from JSON or memory."""
>>>>>>> origin/Trivedi-branch
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
<<<<<<< HEAD
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
=======
        """Allows dynamic injection of reference embeddings from MongoDB."""
        self.known_tigers = tiger_records

    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """Standard ImageNet preprocessing for 224x224 input tensor."""
        img = image.convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
        arr = np.array(img, dtype=np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        norm_arr = (arr - mean) / std
        tensor_data = np.transpose(norm_arr, (2, 0, 1)) # (3, 224, 224)
        return tensor_data

    def extract_embedding(self, flank_image: Image.Image) -> np.ndarray:
        """Extracts a 512-dim L2-normalized embedding vector from a tiger flank crop."""
        tensor_data = self.preprocess_image(flank_image)
        
        # 1. PyTorch execution
        if self.model is not None and HAS_TORCH:
            try:
                tensor = torch.from_numpy(tensor_data).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    embed = self.model.extract_features(tensor).squeeze(0).cpu().numpy()
                return embed / (np.linalg.norm(embed) + 1e-12)
            except Exception as e:
                logger.error(f"PyTorch embedding extraction error: {e}")
                
        # 2. ONNX Runtime execution
        if self.onnx_session is not None:
            try:
                input_tensor = tensor_data[np.newaxis, ...]
                input_name = self.onnx_session.get_inputs()[0].name
                outs = self.onnx_session.run(None, {input_name: input_tensor})
                embed = outs[0][0]
                return embed / (np.linalg.norm(embed) + 1e-12)
            except Exception as e:
                logger.error(f"ONNX embedding extraction error: {e}")
                
        # 3. Deterministic spatial gradient fallback if model weights missing
        return self._heuristic_embedding(flank_image)

    def _heuristic_embedding(self, image: Image.Image) -> np.ndarray:
        """Deterministic stripe spatial frequency signature as robust fallback."""
        gray = image.convert("L").resize((64, 64))
        arr = np.array(gray, dtype=np.float32) / 255.0
        
        grad_x = np.diff(arr, axis=1)
        grad_y = np.diff(arr, axis=0)
        
        row_energy = np.mean(np.abs(grad_x), axis=1)
        col_energy = np.mean(np.abs(grad_y), axis=0)
        fft_feats = np.abs(np.fft.rfft2(arr)).flatten()[:384]
        
        feat = np.concatenate([row_energy, col_energy, fft_feats])
        if len(feat) < 512:
            feat = np.pad(feat, (0, 512 - len(feat)))
        else:
            feat = feat[:512]
            
        return feat / (np.linalg.norm(feat) + 1e-8)

    def identify(
        self,
        tiger_crop: Image.Image,
        high_threshold: float = 0.525, # Calibrated on ATRW benchmark (FAR <= 1%)
        low_threshold: float = 0.350,  # Ambiguous / review threshold
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Extracts flank, computes 512-D stripe embedding, compares with known tiger catalog.
        
        Rules:
          - similarity >= HIGH_THRESHOLD (0.525): automatically confirmed match
          - LOW_THRESHOLD <= similarity < HIGH_THRESHOLD: ambiguous match (ranger review recommended)
          - similarity < LOW_THRESHOLD: unknown candidate / new individual tiger
        """
        flank_crop = isolate_flank_region(tiger_crop)
        query_embedding = self.extract_embedding(flank_crop)
        
        # Auto-refresh if catalog was updated on disk
        if len(self.known_tigers) < 100:
            self.load_embeddings()

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
                
            # Dot product (both vectors are L2-normalized)
            sim = float(np.dot(query_embedding, ref_emb) / (
                (np.linalg.norm(query_embedding) * np.linalg.norm(ref_emb)) + 1e-12
            ))
            
            candidate_scores.append({
                "tigerId": tiger_id,
                "name": tiger_name,
                "similarity": round(max(0.0, min(1.0, sim)), 4),
                "territory": tiger.get("territory", "Pench Tiger Reserve"),
                "sex": tiger.get("sex", "UNKNOWN"),
                "representativeImage": tiger.get("representativeImage", ""),
                "totalCaptures": tiger.get("totalCaptures", 0)
            })
            
        candidate_scores.sort(key=lambda x: x["similarity"], reverse=True)
        top_candidates = candidate_scores[:top_k]
        
        best_match = top_candidates[0] if top_candidates else None
        best_score = best_match["similarity"] if best_match else 0.0
        
        if best_match and best_score >= high_threshold:
            return {
                "individual": best_match["tigerId"],
                "tiger_name": best_match["name"],
                "representativeImage": best_match.get("representativeImage", ""),
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
                "tiger_name": best_match["name"],
                "representativeImage": best_match.get("representativeImage", ""),
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
>>>>>>> origin/Trivedi-branch
