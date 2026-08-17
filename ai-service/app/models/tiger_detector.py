import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False

from app.utils.logger import logger

class TigerDetector:
    """
    Object detection wrapper for camera trap wildlife & human detection.
    Classes:
      0: tiger
      1: other_animal (chital, sambar, leopard, dhole)
      2: human (forest staff, tourists - with privacy masking)
    """
    
    CLASS_NAMES = {
        0: "tiger",
        1: "other_animal",
        2: "human"
    }

    def __init__(self, model_path: Optional[Path] = None, device: str = "cpu"):
        self.device = device
        self.model = None
        self.is_loaded = False
        self.model_path = model_path
        
        if HAS_YOLO:
            try:
                if model_path and Path(model_path).exists():
                    self.model = YOLO(str(model_path))
                    logger.info(f"Loaded custom YOLO Tiger Detector from {model_path}")
                else:
                    raise FileNotFoundError(f"Custom tiger detector weights not found: {model_path}")
                self.is_loaded = True
            except Exception as e:
                logger.warning(f"YOLO initialization notice: {e}")
                self.is_loaded = False

    def detect(self, image: Image.Image, confidence_threshold: float = 0.35) -> Dict[str, Any]:
        """
        Runs object detection on the input image.
        Returns:
            detected: bool
            class: str ("tiger" | "other_animal" | "human" | "none")
            confidence: float
            bbox: [x1, y1, x2, y2] in pixels
            all_detections: List[Dict]
            has_human: bool (for privacy compliance)
        """
        w, h = image.size
        
        if not self.is_loaded or not HAS_YOLO:
            return self._unavailable_result(image, "YOLO model is unavailable")
            
        try:
            results = self.model.predict(
                source=image,
                conf=confidence_threshold,
                device=self.device,
                verbose=False
            )
            
            detections = []
            tiger_found = False
            best_tiger_det = None
            has_human = False
            
            for result in results:
                boxes = result.boxes
                if boxes is None or len(boxes) == 0:
                    continue
                    
                # Determine if model is custom 3-class model ({0: 'tiger', 1: 'other_animal', 2: 'human'})
                is_custom_model = (
                    hasattr(self.model, "names") and
                    isinstance(self.model.names, dict) and
                    self.model.names.get(0) == "tiger"
                )
                
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].cpu().numpy().tolist()
                    
                    if is_custom_model:
                        # Custom 3-Class Pench Detector: 0=tiger, 1=other_animal, 2=human
                        if cls_id == 0:
                            class_name = "tiger"
                        elif cls_id == 2:
                            class_name = "human"
                            has_human = True
                        else:
                            class_name = "other_animal"
                    else:
                        # Do not reinterpret a generic COCO model as a tiger model.
                        return self._unavailable_result(image, "Loaded weights are not the required 3-class tiger detector")
                        
                    det = {
                        "class": class_name,
                        "confidence": round(conf, 4),
                        "bbox": [round(coord, 2) for coord in xyxy]
                    }
                    detections.append(det)
                    
                    if class_name == "tiger":
                        if best_tiger_det is None or conf > best_tiger_det["confidence"]:
                            best_tiger_det = det
                            tiger_found = True
                            
            if tiger_found and best_tiger_det:
                return {
                    "detected": True,
                    "class": "tiger",
                    "confidence": best_tiger_det["confidence"],
                    "bbox": best_tiger_det["bbox"],
                    "all_detections": detections,
                    "has_human": has_human,
                    "model": "YOLOv8-Tiger",
                    "version": "1.0.0"
                }
            elif len(detections) > 0:
                top_det = max(detections, key=lambda d: d["confidence"])
                return {
                    "detected": True,
                    "class": top_det["class"],
                    "confidence": top_det["confidence"],
                    "bbox": top_det["bbox"],
                    "all_detections": detections,
                    "has_human": has_human,
                    "model": "YOLOv8-Tiger",
                    "version": "1.0.0"
                }
            else:
                return {
                    "detected": False,
                    "class": "none",
                    "confidence": 0.0,
                    "bbox": [0, 0, w, h],
                    "all_detections": [],
                    "has_human": False,
                    "model": "YOLOv8-Tiger",
                    "version": "1.0.0"
                }
        except Exception as e:
            logger.error(f"YOLO detection exception: {e}")
            return self._unavailable_result(image, f"YOLO inference failed: {e}")

    def _unavailable_result(self, image: Image.Image, reason: str) -> Dict[str, Any]:
        """Fail closed: never fabricate a wildlife prediction when the model is unavailable."""
        w, h = image.size
        return {
            "detected": False,
            "class": "none",
            "confidence": 0.0,
            "bbox": [0, 0, w, h],
            "all_detections": [],
            "has_human": False,
            "model": "MODEL_UNAVAILABLE",
            "version": "2.0.0",
            "error": reason,
            "needs_review": True
        }

    def apply_human_privacy_mask(self, image: Image.Image, bbox: List[float]) -> Image.Image:
        """Applies Gaussian blur to human bounding box for forest department privacy compliance."""
        w, h = image.size
        x1, y1, x2, y2 = [int(coord) for coord in bbox]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        if x2 > x1 and y2 > y1:
            masked = image.copy()
            human_crop = masked.crop((x1, y1, x2, y2))
            blurred_crop = human_crop.filter(ImageFilter.GaussianBlur(radius=15))
            masked.paste(blurred_crop, (x1, y1))
            return masked
        return image
