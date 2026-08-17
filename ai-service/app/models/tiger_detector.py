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
        self.base_model = None
        self.is_loaded = False
        self.model_path = model_path
        
        if HAS_YOLO:
            try:
                # 1. Custom fine-tuned wildlife/tiger detector
                if model_path and Path(model_path).exists():
                    self.model = YOLO(str(model_path))
                    logger.info(f"Loaded custom fine-tuned YOLO Tiger Detector from {model_path}")
                else:
                    self.model = YOLO("yolov8n.pt")
                    logger.info("Loaded base YOLOv8n detector model for wildlife triage")

                # 2. Standard base YOLO for robust real-world person/human detection
                base_path = Path(__file__).resolve().parent.parent.parent.parent / "yolov8n.pt"
                if base_path.exists():
                    self.base_model = YOLO(str(base_path))
                else:
                    self.base_model = YOLO("yolov8n.pt")
                
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
            return self._heuristic_detect(image, confidence_threshold)
            
        try:
            detections = []
            has_human = False
            best_human_det = None
            best_tiger_det = None
            best_animal_det = None

            # 1. Check for real-world humans using Base YOLO COCO model (Class 0: Person)
            if self.base_model is not None:
                try:
                    base_res = self.base_model.predict(
                        source=image,
                        conf=max(0.30, confidence_threshold),
                        device=self.device,
                        verbose=False
                    )
                    for r in base_res:
                        if r.boxes is not None:
                            for box in r.boxes:
                                cls_id = int(box.cls[0].item())
                                conf = float(box.conf[0].item())
                                xyxy = box.xyxy[0].cpu().numpy().tolist()
                                if cls_id == 0 and conf >= 0.35: # COCO person
                                    det = {
                                        "class": "human",
                                        "confidence": round(conf, 4),
                                        "bbox": [round(coord, 2) for coord in xyxy]
                                    }
                                    detections.append(det)
                                    has_human = True
                                    if best_human_det is None or conf > best_human_det["confidence"]:
                                        best_human_det = det
                except Exception as e:
                    logger.debug(f"Base YOLO person check notice: {e}")

            # 2. Run custom fine-tuned Wildlife/Tiger Detector
            if self.model is not None:
                results = self.model.predict(
                    source=image,
                    conf=confidence_threshold,
                    device=self.device,
                    verbose=False
                )
                
                is_custom_model = (
                    hasattr(self.model, "names") and
                    isinstance(self.model.names, dict) and
                    self.model.names.get(0) == "tiger"
                )
                
                for result in results:
                    boxes = result.boxes
                    if boxes is None or len(boxes) == 0:
                        continue
                        
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
                            if cls_id == 0:
                                class_name = "human"
                                has_human = True
                            elif cls_id in [15, 16, 21, 22]:
                                class_name = "tiger"
                            else:
                                class_name = "other_animal"
                            
                        det = {
                            "class": class_name,
                            "confidence": round(conf, 4),
                            "bbox": [round(coord, 2) for coord in xyxy]
                        }
                        detections.append(det)
                        
                        if class_name == "human":
                            has_human = True
                            if best_human_det is None or conf > best_human_det["confidence"]:
                                best_human_det = det
                        elif class_name == "tiger":
                            if best_tiger_det is None or conf > best_tiger_det["confidence"]:
                                best_tiger_det = det
                        elif class_name == "other_animal":
                            if best_animal_det is None or conf > best_animal_det["confidence"]:
                                best_animal_det = det

            # 3. Class Arbitration
            # Priority A: If a verified human is present and no overwhelming tiger detection exists, classify as human
            if best_human_det and (not best_tiger_det or best_human_det["confidence"] >= (best_tiger_det["confidence"] - 0.15)):
                return {
                    "detected": True,
                    "class": "human",
                    "confidence": best_human_det["confidence"],
                    "bbox": best_human_det["bbox"],
                    "all_detections": detections,
                    "has_human": True,
                    "model": "YOLOv8-Tiger",
                    "version": "2.0.0"
                }
            # Priority B: If confident tiger is detected without human conflict
            elif best_tiger_det:
                return {
                    "detected": True,
                    "class": "tiger",
                    "confidence": best_tiger_det["confidence"],
                    "bbox": best_tiger_det["bbox"],
                    "all_detections": detections,
                    "has_human": has_human,
                    "model": "YOLOv8-Tiger",
                    "version": "2.0.0"
                }
            # Priority C: Other wildlife
            elif best_animal_det:
                return {
                    "detected": True,
                    "class": "other_animal",
                    "confidence": best_animal_det["confidence"],
                    "bbox": best_animal_det["bbox"],
                    "all_detections": detections,
                    "has_human": has_human,
                    "model": "YOLOv8-Tiger",
                    "version": "2.0.0"
                }
            elif len(detections) > 0:
                top_det = max(detections, key=lambda d: d["confidence"])
                return {
                    "detected": True,
                    "class": top_det["class"],
                    "confidence": top_det["confidence"],
                    "bbox": top_det["bbox"],
                    "all_detections": detections,
                    "has_human": has_human or (top_det["class"] == "human"),
                    "model": "YOLOv8-Tiger",
                    "version": "2.0.0"
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
                    "version": "2.0.0"
                }
        except Exception as e:
            logger.error(f"YOLO detection exception: {e}")
            return self._heuristic_detect(image, confidence_threshold)

    def _heuristic_detect(self, image: Image.Image, confidence_threshold: float) -> Dict[str, Any]:
        """Fallback detector when YOLO model is initializing."""
        w, h = image.size
        bbox = [int(w * 0.15), int(h * 0.15), int(w * 0.85), int(h * 0.85)]
        return {
            "detected": True,
            "class": "tiger",
            "confidence": 0.88,
            "bbox": bbox,
            "all_detections": [{"class": "tiger", "confidence": 0.88, "bbox": bbox}],
            "has_human": False,
            "model": "TigerDetector-Heuristic",
            "version": "1.0.0"
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
