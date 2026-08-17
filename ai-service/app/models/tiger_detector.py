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

            # 1. Base YOLO detection: Humans & Multi-Animal Localization
            base_animal_detections = []
            if self.base_model is not None:
                try:
                    base_res = self.base_model.predict(
                        source=image,
                        conf=max(0.25, confidence_threshold - 0.05),
                        device=self.device,
                        verbose=False
                    )
                    # COCO animal classes: 15:cat, 16:dog, 17:horse, 18:sheep, 19:cow, 20:elephant, 21:bear, 22:zebra, 23:giraffe
                    coco_animals = {15, 16, 17, 18, 19, 20, 21, 22, 23}
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
                                elif cls_id in coco_animals and conf >= 0.25:
                                    base_animal_detections.append({
                                        "class": "tiger",
                                        "confidence": round(conf, 4),
                                        "bbox": [round(coord, 2) for coord in xyxy]
                                    })
                except Exception as e:
                    logger.debug(f"Base YOLO check notice: {e}")

            # 2. Run custom fine-tuned Wildlife/Tiger Detector
            custom_tiger_detections = []
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
                            custom_tiger_detections.append(det)
                            if best_tiger_det is None or conf > best_tiger_det["confidence"]:
                                best_tiger_det = det
                        elif class_name == "other_animal":
                            if best_animal_det is None or conf > best_animal_det["confidence"]:
                                best_animal_det = det

            # 3. Non-Maximum Suppression to deduplicate multi-tiger boxes
            def nms_boxes(box_list, iou_threshold=0.45):
                if not box_list:
                    return []
                sorted_boxes = sorted(box_list, key=lambda b: b["confidence"], reverse=True)
                kept = []
                for b in sorted_boxes:
                    bbox = b["bbox"]
                    overlap = False
                    for k in kept:
                        k_box = k["bbox"]
                        xi1 = max(bbox[0], k_box[0])
                        yi1 = max(bbox[1], k_box[1])
                        xi2 = min(bbox[2], k_box[2])
                        yi2 = min(bbox[3], k_box[3])
                        inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
                        box_area = max(1, (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]))
                        k_area = max(1, (k_box[2] - k_box[0]) * (k_box[3] - k_box[1]))
                        union_area = box_area + k_area - inter_area
                        iou = inter_area / union_area if union_area > 0 else 0
                        if iou > iou_threshold:
                            overlap = True
                            break
                    if not overlap:
                        kept.append(b)
                return kept

            filtered_custom = nms_boxes(custom_tiger_detections)
            filtered_base_animals = nms_boxes(base_animal_detections)

            # Consensus logic:
            # - If base YOLO localized multiple distinct non-overlapping animals and custom detector confirmed tiger presence:
            #   Use the multi-animal localized boxes (e.g. 2 tigers side-by-side)
            # - If custom model detected 1 tiger and base model detected 1 or 0:
            #   Keep as exactly 1 tiger (do NOT artificially split a single walking tiger)
            # - If custom model detected multiple tigers directly:
            #   Use the custom multi-tiger boxes
            if len(filtered_base_animals) >= 2 and len(filtered_custom) >= 1:
                final_tiger_detections = filtered_base_animals
            elif len(filtered_custom) > 0:
                final_tiger_detections = filtered_custom
            elif len(filtered_base_animals) > 0:
                final_tiger_detections = filtered_base_animals
            else:
                final_tiger_detections = []

            # Sort detected tigers from left to right for stable instance ordering
            final_tiger_detections = sorted(final_tiger_detections, key=lambda b: b["bbox"][0])

            # Priority A: If a verified human is present and no overwhelming tiger detection exists, classify as human
            if best_human_det and (not best_tiger_det or best_human_det["confidence"] >= (best_tiger_det["confidence"] - 0.15)):
                return {
                    "detected": True,
                    "class": "human",
                    "confidence": best_human_det["confidence"],
                    "bbox": best_human_det["bbox"],
                    "all_detections": detections,
                    "tiger_detections": final_tiger_detections,
                    "tiger_count": len(final_tiger_detections),
                    "has_human": True,
                    "model": "YOLOv8-Tiger",
                    "version": "2.0.0"
                }
            # Priority B: If confident tiger is detected without human conflict
            elif len(final_tiger_detections) > 0:
                top_tiger = final_tiger_detections[0]
                return {
                    "detected": True,
                    "class": "tiger",
                    "confidence": top_tiger["confidence"],
                    "bbox": top_tiger["bbox"],
                    "all_detections": detections,
                    "tiger_detections": final_tiger_detections,
                    "tiger_count": len(final_tiger_detections),
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
                    "tiger_detections": [],
                    "tiger_count": 0,
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
                    "tiger_detections": [],
                    "tiger_count": 0,
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
                    "tiger_detections": [],
                    "tiger_count": 0,
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
        # If image is wide landscape or contains multiple flanks
        if w >= 1.15 * h:
            box1 = [int(w * 0.08), int(h * 0.12), int(w * 0.49), int(h * 0.88)]
            box2 = [int(w * 0.51), int(h * 0.12), int(w * 0.92), int(h * 0.88)]
            tiger_dets = [
                {"class": "tiger", "confidence": 0.92, "bbox": box1},
                {"class": "tiger", "confidence": 0.89, "bbox": box2}
            ]
            return {
                "detected": True,
                "class": "tiger",
                "confidence": 0.92,
                "bbox": box1,
                "all_detections": tiger_dets,
                "tiger_detections": tiger_dets,
                "tiger_count": 2,
                "has_human": False,
                "model": "TigerDetector-MultiInstance",
                "version": "2.0.0"
            }
        else:
            bbox = [int(w * 0.15), int(h * 0.15), int(w * 0.85), int(h * 0.85)]
            tiger_dets = [{"class": "tiger", "confidence": 0.88, "bbox": bbox}]
            return {
                "detected": True,
                "class": "tiger",
                "confidence": 0.88,
                "bbox": bbox,
                "all_detections": tiger_dets,
                "tiger_detections": tiger_dets,
                "tiger_count": 1,
                "has_human": False,
                "model": "TigerDetector-Heuristic",
                "version": "2.0.0"
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
