import io
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from PIL import Image

from app.models.blank_classifier import BlankDetector
from app.models.tiger_detector import TigerDetector
from app.models.tiger_identifier import TigerIdentifier
from app.preprocessing.image_ops import extract_exif_metadata, crop_bounding_box, isolate_flank_region
from app.utils.config import (
    BLANK_MODEL_PATH,
    TIGER_DETECTOR_PATH,
    TIGER_IDENTIFIER_PATH,
    TIGER_EMBEDDINGS_PATH,
    BLANK_CONFIDENCE_THRESHOLD,
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
        self.blank_detector = BlankDetector(
            model_path=BLANK_MODEL_PATH if BLANK_MODEL_PATH.exists() else None,
            device=DEVICE
        )
        self.tiger_detector = TigerDetector(
            model_path=TIGER_DETECTOR_PATH if TIGER_DETECTOR_PATH.exists() else None,
            device=DEVICE
        )
        self.tiger_identifier = TigerIdentifier(
            model_path=TIGER_IDENTIFIER_PATH if TIGER_IDENTIFIER_PATH.exists() else None,
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
        is_blank = blank_res["blank"]
        
        if is_blank:
            elapsed = time.time() - start_time
            return {
                "fileName": filename,
                "blank": True,
                "blank_confidence": blank_res["blank_confidence"],
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
            
        # 3. Object Detection (Tiger / Other Animal / Human)
        det_res = self.tiger_detector.detect(img, confidence_threshold=TIGER_CONFIDENCE_THRESHOLD)
        tiger_detected = (det_res["class"] == "tiger" and det_res["detected"])
        bbox = det_res.get("bbox", [0, 0, w, h])
        has_human = det_res.get("has_human", False)
        
        # 4. If tiger is detected -> extract crop and run individual stripe identification
        individual = None
        tiger_name = None
        id_confidence = 0.0
        needs_review = False
        status = "NON_TIGER_ANIMAL"
        candidates = []
        embedding = []
        
        if tiger_detected:
            tiger_crop = crop_bounding_box(img, bbox)
            flank_crop = isolate_flank_region(tiger_crop)
            
            # 5. Stripe Re-Identification
            id_res = self.tiger_identifier.identify(
                tiger_crop=tiger_crop,
                high_threshold=h_id_thresh,
                low_threshold=l_id_thresh
            )
            
            individual = id_res.get("individual")
            tiger_name = id_res.get("tiger_name")
            id_confidence = id_res.get("identification_confidence", 0.0)
            needs_review = id_res.get("needs_review", False)
            status = id_res.get("status", "CONFIRMED_MATCH")
            candidates = id_res.get("candidates", [])
            embedding = id_res.get("embedding", [])
        elif det_res["detected"] and det_res["class"] != "none":
            status = f"DETECTED_{det_res['class'].upper()}"
            needs_review = False
        else:
            status = "LOW_CONFIDENCE_UNCLASSIFIED"
            needs_review = True
            
        elapsed = time.time() - start_time
        
        return {
            "fileName": filename,
            "blank": False,
            "blank_confidence": blank_res["blank_confidence"],
            "non_blank_confidence": blank_res["non_blank_confidence"],
            "tiger_detected": tiger_detected,
            "tiger_confidence": det_res["confidence"] if tiger_detected else 0.0,
            "detected_class": det_res["class"],
            "bbox": bbox,
            "all_detections": det_res.get("all_detections", []),
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
            "model_version": f"YOLOv8-Tiger+MetricCNN-v1.0"
        }
