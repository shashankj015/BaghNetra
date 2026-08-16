"""
BaghNetra - Model Export Utility
Exports PyTorch weights to TorchScript / ONNX format for CPU optimized field deployment.
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.utils.config import BLANK_MODEL_PATH, TIGER_IDENTIFIER_PATH, MODELS_DIR
from app.utils.logger import logger

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

def export_all():
    logger.info("Exporting models for local CPU field execution...")
    if not HAS_TORCH:
        logger.warning("PyTorch not installed. Skipping export.")
        return
        
    try:
        from app.models.blank_classifier import BlankClassifierNN
        if BLANK_MODEL_PATH.exists():
            model = BlankClassifierNN(num_classes=2, pretrained=False)
            model.load_state_dict(torch.load(BLANK_MODEL_PATH, weights_only=True))
            model.eval()
            
            dummy_input = torch.randn(1, 3, 224, 224)
            traced_blank = torch.jit.trace(model, dummy_input)
            out_path = MODELS_DIR / "blank_detector" / "model.torchscript"
            traced_blank.save(str(out_path))
            logger.info(f"[OK] Exported Blank Detector TorchScript to {out_path}")
    except Exception as e:
        logger.error(f"Error exporting blank detector: {e}")

if __name__ == "__main__":
    export_all()
