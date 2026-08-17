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

# AI Pipeline Thresholds (Calibrated from ATRW Re-ID Benchmark)
BLANK_CONFIDENCE_THRESHOLD = float(os.getenv("AI_BLANK_THRESHOLD", "0.95"))
BLANK_REVIEW_THRESHOLD = float(os.getenv("AI_BLANK_REVIEW_THRESHOLD", "0.50"))
TIGER_CONFIDENCE_THRESHOLD = float(os.getenv("AI_TIGER_THRESHOLD", "0.35"))
HIGH_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_HIGH_THRESHOLD", "0.525")) # Calibrated for FAR <= 1%
LOW_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_LOW_THRESHOLD", "0.350"))  # Review / Ambiguous band

# Device configuration (Auto-detect MPS / CUDA / CPU)
DEVICE = "mps" if os.getenv("USE_MPS", "true").lower() == "true" else ("cuda" if os.getenv("USE_CUDA", "false").lower() == "true" else "cpu")

# Image preprocessing
IMG_SIZE_BLANK = (224, 224)
IMG_SIZE_IDENTIFIER = (224, 224)
EMBEDDING_DIM = 512
