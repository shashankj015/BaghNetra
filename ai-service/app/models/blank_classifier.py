import os
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
from PIL import Image

try:
    import torch
    import torch.nn as nn
    import torchvision.models as models
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from app.preprocessing.image_ops import preprocess_for_classification
from app.utils.logger import logger

class BlankClassifierNN(nn.Module if HAS_TORCH else object):
    """
    MobileNetV3-Small transfer learning architecture for blank camera trap classification.
    """
    def __init__(self, num_classes: int = 2, pretrained: bool = False):
        if not HAS_TORCH:
            return
        super().__init__()
        self.network = models.mobilenet_v3_small(weights=None)
        in_features = self.network.classifier[0].in_features
        self.network.classifier = nn.Sequential(
            nn.Linear(in_features, 256),
            nn.Hardswish(),
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.network(x)


class BlankClassifier:
    """
    MobileNetV3-Small binary classifier to identify empty/false-trigger camera trap images.
    Output:
      Class 0: BLANK (Empty vegetation, false trigger, blur)
      Class 1: NON_BLANK (Wildlife or human present)
    """

    def __init__(self, model_path: Optional[Path] = None, device: str = "cpu"):
        self.device = device
        self.model = None
        self.is_loaded = False
        self.model_path = model_path
        
        if HAS_TORCH:
            try:
                self.model = BlankClassifierNN(num_classes=2, pretrained=False)
                
                if model_path and Path(model_path).exists():
                    state_dict = torch.load(model_path, map_location=device, weights_only=True)
                    self.model.load_state_dict(state_dict, strict=True)
                    logger.info(f"Loaded Blank Detector MobileNetV3 weights from {model_path}")
                else:
                    logger.info("Initialized MobileNetV3 Blank Classifier architecture")
                    
                self.model.to(device)
                self.model.eval()
                self.is_loaded = True
            except Exception as e:
                logger.warning(f"Blank detector initialization notice: {e}")
                self.is_loaded = False

    def predict(self, image: Image.Image, blank_threshold: float = 0.85) -> Dict[str, Any]:
        """
        Classifies image as BLANK or NON_BLANK.
        Returns:
            is_blank (bool)
            confidence (float)
            class_label (str)
            raw_scores (dict)
        """
        if not self.is_loaded or not HAS_TORCH:
            return self._heuristic_predict(image, blank_threshold)
            
        try:
            tensor_data = preprocess_for_classification(image)
            tensor = torch.from_numpy(tensor_data).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                logits = self.model(tensor)
                probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()
                
            blank_prob = float(probs[0])
            non_blank_prob = float(probs[1])
            
            # Use high-confidence blank threshold to avoid false negatives on field images
            is_blank = blank_prob >= blank_threshold
            
            return {
                "blank": is_blank,
                "blank_confidence": round(blank_prob, 4),
                "non_blank_confidence": round(non_blank_prob, 4),
                "class": "BLANK" if is_blank else "NON_BLANK",
                "model": "MobileNetV3-Small",
                "version": "1.0.0",
                "quarantine_recommended": is_blank
            }
        except Exception as e:
            logger.error(f"Blank classification error: {e}")
            return self._heuristic_predict(image, blank_threshold)

    def _heuristic_predict(self, image: Image.Image, blank_threshold: float) -> Dict[str, Any]:
        """Field-safe heuristic analysis based on pixel gradient energy & contrast distribution."""
        gray = image.convert("L").resize((128, 128))
        arr = np.array(gray, dtype=np.float32)
        std_dev = np.std(arr)
        
        # Low spatial variance often indicates empty darkness / uniform fog / flat blur
        grad_y, grad_x = np.gradient(arr)
        edge_energy = np.mean(np.abs(grad_x) + np.abs(grad_y))
        
        blank_score = 0.1
        if std_dev < 15.0 or edge_energy < 4.0:
            blank_score = 0.90
        elif std_dev < 25.0:
            blank_score = 0.65
            
        is_blank = blank_score >= blank_threshold
        return {
            "blank": is_blank,
            "blank_confidence": round(blank_score, 4),
            "non_blank_confidence": round(1.0 - blank_score, 4),
            "class": "BLANK" if is_blank else "NON_BLANK",
            "model": "MobileNetV3-Heuristic",
            "version": "1.0.0",
            "quarantine_recommended": is_blank
        }
