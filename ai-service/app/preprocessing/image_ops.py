import io
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from PIL import Image, ImageOps, ExifTags
import numpy as np

def extract_exif_metadata(image: Image.Image) -> Dict[str, Any]:
    """Extracts timestamp, camera make/model, and GPS from EXIF data if present."""
    metadata = {
        "timestamp": None,
        "camera_make": None,
        "camera_model": None,
        "latitude": None,
        "longitude": None,
        "has_exif_gps": False
    }
    
    try:
        exif = image.getexif()
        if not exif:
            return metadata
            
        for tag_id, value in exif.items():
            tag_name = ExifTags.TAGS.get(tag_id, tag_id)
            if tag_name == "DateTime" or tag_name == "DateTimeOriginal":
                metadata["timestamp"] = str(value)
            elif tag_name == "Make":
                metadata["camera_make"] = str(value).strip()
            elif tag_name == "Model":
                metadata["camera_model"] = str(value).strip()
                
        # Look into IFD tags for GPS
        gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo) if hasattr(exif, "get_ifd") else None
        if gps_ifd:
            lat = gps_ifd.get(ExifTags.GPS.GPSLatitude)
            lat_ref = gps_ifd.get(ExifTags.GPS.GPSLatitudeRef, "N")
            lon = gps_ifd.get(ExifTags.GPS.GPSLongitude)
            lon_ref = gps_ifd.get(ExifTags.GPS.GPSLongitudeRef, "E")
            
            if lat and lon:
                def convert_dms(dms):
                    deg = float(dms[0])
                    minutes = float(dms[1])
                    seconds = float(dms[2])
                    return deg + (minutes / 60.0) + (seconds / 3600.0)
                    
                dec_lat = convert_dms(lat)
                if lat_ref == "S":
                    dec_lat = -dec_lat
                dec_lon = convert_dms(lon)
                if lon_ref == "W":
                    dec_lon = -dec_lon
                    
                metadata["latitude"] = dec_lat
                metadata["longitude"] = dec_lon
                metadata["has_exif_gps"] = True
    except Exception:
        pass
        
    return metadata

def crop_bounding_box(image: Image.Image, bbox: list, padding_pct: float = 0.05) -> Image.Image:
    """
    Crops the bounding box from PIL Image.
    bbox format: [x1, y1, x2, y2] in pixels or normalized 0-1
    """
    w, h = image.size
    x1, y1, x2, y2 = bbox
    
    # Handle normalized coordinates
    if max(x1, y1, x2, y2) <= 1.0:
        x1, x2 = x1 * w, x2 * w
        y1, y2 = y1 * h, y2 * h
        
    # Apply padding
    box_w = x2 - x1
    box_h = y2 - y1
    pad_x = box_w * padding_pct
    pad_y = box_h * padding_pct
    
    crop_x1 = max(0, int(x1 - pad_x))
    crop_y1 = max(0, int(y1 - pad_y))
    crop_x2 = min(w, int(x2 + pad_x))
    crop_y2 = min(h, int(y2 + pad_y))
    
    if crop_x2 <= crop_x1 or crop_y2 <= crop_y1:
        return image.copy()
        
    return image.crop((crop_x1, crop_y1, crop_x2, crop_y2))

def isolate_flank_region(tiger_crop: Image.Image) -> Image.Image:
    """
    Isolates the flank / ribcage area from a tiger detection crop.
    Center-middle 60% of the body crop captures the signature stripe pattern.
    """
    w, h = tiger_crop.size
    flank_x1 = int(w * 0.15)
    flank_y1 = int(h * 0.15)
    flank_x2 = int(w * 0.85)
    flank_y2 = int(h * 0.85)
    
    if flank_x2 > flank_x1 and flank_y2 > flank_y1:
        return tiger_crop.crop((flank_x1, flank_y1, flank_x2, flank_y2))
    return tiger_crop

def preprocess_for_embedding(image: Image.Image, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """
    Resizes, applies subtle contrast enhancement, and converts to normalized float32 array.
    """
    img = image.convert("RGB").resize(target_size, Image.Resampling.BILINEAR)
    img_array = np.array(img, dtype=np.float32) / 255.0
    
    # Standard ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    norm_array = (img_array - mean) / std
    
    # Transpose to (C, H, W)
    return np.transpose(norm_array, (2, 0, 1))

def preprocess_for_classification(image: Image.Image, target_size: Tuple[int, int] = (224, 224)) -> np.ndarray:
    """Preprocess image for Blank / Non-Blank classifier."""
    return preprocess_for_embedding(image, target_size)
<<<<<<< HEAD


def extract_flank_views(tiger_crop: Image.Image):
    """Create robust body/flank views without pretending to have pose estimation.
    The views cover the full crop plus left/center/right body regions and are
    averaged by the Re-ID model to reduce sensitivity to framing.
    """
    img = tiger_crop.convert("RGB")
    w, h = img.size
    views = [img]
    if w >= 4 and h >= 4:
        views.extend([
            img.crop((0, int(0.10*h), int(0.65*w), int(0.90*h))),
            img.crop((int(0.20*w), int(0.10*h), int(0.80*w), int(0.90*h))),
            img.crop((int(0.35*w), int(0.10*h), w, int(0.90*h))),
        ])
    return views
=======
>>>>>>> origin/Trivedi-branch
