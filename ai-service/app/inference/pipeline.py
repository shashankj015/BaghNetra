import io
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from PIL import Image

from app.models.blank_classifier import BlankClassifier
from app.models.tiger_detector import TigerDetector
from app.models.tiger_identifier import TigerIdentifier
from app.preprocessing.image_ops import extract_exif_metadata, crop_bounding_box, isolate_flank_region
from app.utils.config import (
    BLANK_MODEL_PATH,
    TIGER_DETECTOR_PATH,
    TIGER_IDENTIFIER_PATH,
    TIGER_IDENTIFIER_ONNX_PATH,
    TIGER_EMBEDDINGS_PATH,
    BLANK_CONFIDENCE_THRESHOLD,
    BLANK_REVIEW_THRESHOLD,
    TIGER_CONFIDENCE_THRESHOLD,
    HIGH_IDENTIFICATION_THRESHOLD,
    LOW_IDENTIFICATION_THRESHOLD,
    DEVICE,
    UPLOADS_DIR,
    QUARANTINE_DIR
)
from app.utils.logger import logger

class BaghNetraAIPipeline:
    """
    Unified Camera Trap Triage & Tiger Re-Identification Pipeline.
    1. EXIF & Metadata Extraction
    2. Blank vs Non-Blank Classification
    3. Wildlife / Human Object Detection & Privacy Masking
    4. Tiger Flank Crop & Stripe Feature Extraction
    5. Metric-Learning Re-Identification & Candidate Ranking
    """
    
    def __init__(self):
        logger.info(f"Initializing BaghNetra AI Engine on device: {DEVICE}")
        self.blank_detector = BlankClassifier(
            model_path=BLANK_MODEL_PATH if BLANK_MODEL_PATH.exists() else None,
            device=DEVICE
        )
        self.tiger_detector = TigerDetector(
            model_path=TIGER_DETECTOR_PATH if TIGER_DETECTOR_PATH.exists() else None,
            device=DEVICE
        )
        self.tiger_identifier = TigerIdentifier(
            model_path=TIGER_IDENTIFIER_PATH if TIGER_IDENTIFIER_PATH.exists() else None,
            onnx_path=TIGER_IDENTIFIER_ONNX_PATH if TIGER_IDENTIFIER_ONNX_PATH.exists() else None,
            embeddings_path=TIGER_EMBEDDINGS_PATH if TIGER_EMBEDDINGS_PATH.exists() else None,
            device=DEVICE
        )
        logger.info("BaghNetra AI Pipeline loaded successfully.")

    def set_reference_embeddings(self, tigers: List[Dict[str, Any]]):
        """Allows backend to refresh reference tiger embeddings in memory."""
        self.tiger_identifier.set_reference_embeddings(tigers)

    def process_image(
        self,
        image_input: Any, # PIL Image, bytes, or file path
        filename: str = "frame.jpg",
        blank_threshold: Optional[float] = None,
        high_id_threshold: Optional[float] = None,
        low_id_threshold: Optional[float] = None,
        save_crops: bool = True
    ) -> Dict[str, Any]:
        """
        Executes complete camera trap frame triage.
        """
        start_time = time.time()
        
        # Load image
        if isinstance(image_input, (str, Path)):
            img = Image.open(image_input)
        elif isinstance(image_input, bytes):
            img = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            img = image_input
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")
            
        img = img.convert("RGB")
        w, h = img.size
        
        # 1. Extract EXIF metadata
        exif = extract_exif_metadata(img)
        
        # Threshold overrides
        b_thresh = blank_threshold if blank_threshold is not None else BLANK_CONFIDENCE_THRESHOLD
        h_id_thresh = high_id_threshold if high_id_threshold is not None else HIGH_IDENTIFICATION_THRESHOLD
        l_id_thresh = low_id_threshold if low_id_threshold is not None else LOW_IDENTIFICATION_THRESHOLD
        
        # 2. Blank Image Classification
        blank_res = self.blank_detector.predict(img, blank_threshold=b_thresh)
        blank_conf = blank_res["blank_confidence"]
        
        # High confidence blank -> Auto quarantine
        if blank_conf >= b_thresh:
            elapsed = time.time() - start_time
            return {
                "fileName": filename,
                "blank": True,
                "blank_confidence": blank_conf,
                "non_blank_confidence": blank_res["non_blank_confidence"],
                "tiger_detected": False,
                "tiger_confidence": 0.0,
                "detected_class": "blank",
                "bbox": [0, 0, w, h],
                "individual": None,
                "tiger_name": None,
                "identification_confidence": 0.0,
                "needs_review": False,
                "status": "QUARANTINE_BLANK",
                "candidates": [],
                "has_human": False,
                "exif": exif,
                "processing_time_ms": round(elapsed * 1000, 2),
                "model_version": "BlankClassifier-v1.0"
            }
        # Medium confidence blank -> Safe triage: Route to Human Review Station
        elif blank_conf >= BLANK_REVIEW_THRESHOLD:
            elapsed = time.time() - start_time
            return {
                "fileName": filename,
                "blank": True,
                "blank_confidence": blank_conf,
                "non_blank_confidence": blank_res["non_blank_confidence"],
                "tiger_detected": False,
                "tiger_confidence": 0.0,
                "detected_class": "blank",
                "bbox": [0, 0, w, h],
                "individual": None,
                "tiger_name": None,
                "identification_confidence": 0.0,
                "needs_review": True,
                "status": "BLANK_NEEDS_REVIEW",
                "candidates": [],
                "has_human": False,
                "exif": exif,
                "processing_time_ms": round(elapsed * 1000, 2),
                "model_version": "BlankClassifier-v1.0"
            }
            
        # 3. Object Detection (Tiger / Other Animal / Human)
        det_res = self.tiger_detector.detect(img, confidence_threshold=TIGER_CONFIDENCE_THRESHOLD)
        bbox = det_res.get("bbox", [0, 0, w, h])
        has_human = det_res.get("has_human", False)
        detected_class = det_res.get("class", "none")
        
        # 4. Triage according to detected class
        individual = None
        tiger_name = None
        id_confidence = 0.0
        needs_review = False
        tiger_detected = False
        status = "NON_TIGER_ANIMAL"
        candidates = []
        embedding = []
        detected_individuals = []
        
        tiger_detections = det_res.get("tiger_detections", [])
        if not tiger_detections and detected_class == "tiger":
            tiger_detections = [{"class": "tiger", "confidence": det_res.get("confidence", 0.88), "bbox": bbox}]

        if detected_class == "human":
            # Human Detection (Forest patrol, field staff, tourists) -> Privacy Compliance Triage
            tiger_detected = False
            status = "DETECTED_HUMAN"
            needs_review = False
            has_human = True
        elif len(tiger_detections) > 0:
            tiger_detected = True
            
            for idx, t_det in enumerate(tiger_detections):
                t_bbox = t_det["bbox"]
                t_conf = t_det["confidence"]
                
                # Compute exact tiger pixel coordinates
                bx1, by1, bx2, by2 = t_bbox
                if max(bx1, by1, bx2, by2) <= 1.0:
                    bx1, bx2 = bx1 * w, bx2 * w
                    by1, by2 = by1 * h, by2 * h

                bw = max(10, bx2 - bx1)
                bh = max(10, by2 - by1)
                
                # Point directly at the flank stripe pattern region (center ribcage zone)
                stripe_x1 = round(max(0, bx1 + bw * 0.18), 1)
                stripe_y1 = round(max(0, by1 + bh * 0.15), 1)
                stripe_x2 = round(min(w, bx1 + bw * 0.82), 1)
                stripe_y2 = round(min(h, by1 + bh * 0.85), 1)

                stripe_bbox = [stripe_x1, stripe_y1, stripe_x2, stripe_y2]
                norm_stripe_bbox = [
                    round(stripe_x1 / w, 4),
                    round(stripe_y1 / h, 4),
                    round(stripe_x2 / w, 4),
                    round(stripe_y2 / h, 4)
                ]

                tiger_crop = crop_bounding_box(img, [bx1, by1, bx2, by2])
                flank_crop = isolate_flank_region(tiger_crop)
                
                # 5. Stripe Re-Identification for this individual
                id_res = self.tiger_identifier.identify(
                    tiger_crop=tiger_crop,
                    high_threshold=h_id_thresh,
                    low_threshold=l_id_thresh
                )
                
                ind_info = {
                    "instanceId": idx + 1,
                    "boundingBox": stripe_bbox,
                    "stripeBoundingBox": stripe_bbox,
                    "bodyBoundingBox": [round(bx1, 1), round(by1, 1), round(bx2, 1), round(by2, 1)],
                    "normalizedBoundingBox": norm_stripe_bbox,
                    "detectionConfidence": round(float(t_conf), 3),
                    "individual": id_res.get("individual"),
                    "tigerName": id_res.get("tiger_name") or id_res.get("individual") or f"Tiger #{idx + 1}",
                    "identificationConfidence": round(float(id_res.get("identification_confidence", 0.0)), 3),
                    "status": id_res.get("status", "CONFIRMED_MATCH"),
                    "needsReview": id_res.get("needs_review", False),
                    "candidates": id_res.get("candidates", []),
                    "embedding": id_res.get("embedding", [])
                }
                detected_individuals.append(ind_info)
            
            # Primary individual values for backward-compatibility
            primary = detected_individuals[0]
            bbox = primary["boundingBox"]
            individual = primary["individual"]
            tiger_name = primary["tigerName"]
            id_confidence = primary["identificationConfidence"]
            needs_review = any(ind["needsReview"] for ind in detected_individuals)
            status = "MULTI_TIGER_DETECTED" if len(detected_individuals) > 1 else primary["status"]
            candidates = primary["candidates"]
            embedding = primary["embedding"]
        elif detected_class == "other_animal":
            tiger_detected = False
            status = "NON_TIGER_ANIMAL"
            needs_review = False
        elif det_res["detected"] and detected_class != "none":
            status = f"DETECTED_{detected_class.upper()}"
            needs_review = False
        else:
            status = "LOW_CONFIDENCE_UNCLASSIFIED"
            needs_review = True
            
        elapsed = time.time() - start_time
        
        return {
            "fileName": filename,
            "image_width": w,
            "image_height": h,
            "blank": False,
            "blank_confidence": blank_res["blank_confidence"],
            "non_blank_confidence": blank_res["non_blank_confidence"],
            "tiger_detected": tiger_detected,
            "tiger_count": len(detected_individuals),
            "tiger_confidence": det_res["confidence"] if tiger_detected else 0.0,
            "detected_class": det_res["class"],
            "bbox": bbox,
            "all_detections": det_res.get("all_detections", []),
            "detected_individuals": detected_individuals,
            "individual": individual,
            "tiger_name": tiger_name,
            "identification_confidence": id_confidence,
            "needs_review": needs_review,
            "status": status,
            "candidates": candidates,
            "embedding": embedding,
            "has_human": has_human,
            "exif": exif,
            "processing_time_ms": round(elapsed * 1000, 2),
            "model_version": "YOLOv8-Tiger+ResNet50ReID-v2.0"
        }


