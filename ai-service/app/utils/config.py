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
TIGER_EMBEDDINGS_PATH = MODELS_DIR / "tiger_identifier" / "embeddings.json"
TIGER_IDENTIFIER_METRICS_PATH = MODELS_DIR / "tiger_identifier" / "metrics.json"

# AI Pipeline Thresholds
BLANK_CONFIDENCE_THRESHOLD = float(os.getenv("AI_BLANK_THRESHOLD", "0.85"))
TIGER_CONFIDENCE_THRESHOLD = float(os.getenv("AI_TIGER_THRESHOLD", "0.35"))
HIGH_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_HIGH_THRESHOLD", "0.82"))
LOW_IDENTIFICATION_THRESHOLD = float(os.getenv("AI_LOW_THRESHOLD", "0.65"))

# Device configuration (CPU first for field laptops, GPU if available)
DEVICE = "cuda" if os.getenv("USE_CUDA", "false").lower() == "true" else "cpu"

# Image preprocessing
IMG_SIZE_BLANK = (224, 224)
IMG_SIZE_IDENTIFIER = (224, 224)
EMBEDDING_DIM = 512
