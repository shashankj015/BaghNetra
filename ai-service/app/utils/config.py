import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = BASE_DIR.parent / "models"
UPLOADS_DIR = BASE_DIR.parent / "uploads"
QUARANTINE_DIR = BASE_DIR.parent / "quarantine"
DATASETS_DIR = BASE_DIR.parent / "datasets"

# Model paths
BLANK_MODEL_PATH = MODELS_DIR / "blank_detector" / "best_model.pt"
BLANK_METRICS_PATH = MODELS_DIR / "blank_detector" / "metrics.json"

TIGER_DETECTOR_PATH = MODELS_DIR / "tiger_detector" / "best_model.pt"
TIGER_DETECTOR_METRICS_PATH = MODELS_DIR / "tiger_detector" / "metrics.json"

TIGER_IDENTIFIER_PATH = MODELS_DIR / "tiger_identifier" / "best_model.pt"
TIGER_IDENTIFIER_ONNX_PATH = MODELS_DIR / "tiger_identifier" / "tiger_reid_resnet50.onnx"
TIGER_EMBEDDINGS_PATH = MODELS_DIR / "tiger_identifier" / "embeddings.json"
TIGER_IDENTIFIER_METRICS_PATH = MODELS_DIR / "tiger_identifier" / "metrics.json"

<<<<<<< HEAD
# AI Pipeline Thresholds (Calibrated from ATRW Re-ID Benchmark)
BLANK_CONFIDENCE_THRESHOLD = float(os.getenv("AI_BLANK_THRESHOLD", "0.95"))
BLANK_REVIEW_THRESHOLD = float(os.getenv("AI_BLANK_REVIEW_THRESHOLD", "0.50"))
TIGER_CONFIDENCE_THRESHOLD = float(os.getenv("AI_TIGER_THRESHOLD", "0.35"))
HIGH_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_HIGH_THRESHOLD", "0.525")) # Calibrated for FAR <= 1%
LOW_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_LOW_THRESHOLD", "0.350"))  # Review / Ambiguous band
=======
# AI Pipeline Thresholds
<<<<<<< HEAD
BLANK_CONFIDENCE_THRESHOLD = float(os.getenv("AI_BLANK_THRESHOLD", "0.98"))
BLANK_REVIEW_THRESHOLD = float(os.getenv("AI_BLANK_REVIEW_THRESHOLD", "0.50"))
TIGER_CONFIDENCE_THRESHOLD = float(os.getenv("AI_TIGER_THRESHOLD", "0.35"))
# Prefer the threshold calibrated by the held-out Re-ID validation set.
_threshold_file = TIGER_IDENTIFIER_PATH.parent / "thresholds.json"
_calibrated_high = None
try:
    import json
    if _threshold_file.exists():
        with open(_threshold_file, "r", encoding="utf-8") as _f:
            _calibrated_high = float(json.load(_f).get("high_threshold"))
except Exception:
    _calibrated_high = None
HIGH_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_HIGH_THRESHOLD", str(_calibrated_high if _calibrated_high is not None else 0.82)))
LOW_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_LOW_THRESHOLD", str(max(0.55, HIGH_IDENTIFICATION_THRESHOLD - 0.12))))
=======
BLANK_CONFIDENCE_THRESHOLD = float(os.getenv("AI_BLANK_THRESHOLD", "0.95"))
BLANK_REVIEW_THRESHOLD = float(os.getenv("AI_BLANK_REVIEW_THRESHOLD", "0.50"))
TIGER_CONFIDENCE_THRESHOLD = float(os.getenv("AI_TIGER_THRESHOLD", "0.35"))
HIGH_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_HIGH_THRESHOLD", "0.82"))
LOW_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_LOW_THRESHOLD", "0.65"))
>>>>>>> origin/Trivedi-branch
>>>>>>> 0989a0d4ec7d9d53e4bede838848da01e6fec872

# Device configuration (Auto-detect MPS / CUDA / CPU)
DEVICE = "mps" if os.getenv("USE_MPS", "true").lower() == "true" else ("cuda" if os.getenv("USE_CUDA", "false").lower() == "true" else "cpu")

# Image preprocessing
IMG_SIZE_BLANK = (224, 224)
IMG_SIZE_IDENTIFIER = (224, 224)
EMBEDDING_DIM = 512

