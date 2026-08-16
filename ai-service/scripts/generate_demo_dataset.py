"""
BaghNetra - Synthetic & Demo Dataset Generator for Pench Tiger Reserve
Generates realistic camera trap frames with distinct visual patterns for:
- Blank images (wind-blown grass, night darkness, heat haze, rain streaks, insect flash)
- Wildlife (Chital, Sambar, Leopard, Human patrol)
- Individual Tigers with distinct, mathematically generated flank stripe profiles (BT001 - BT005)
- Unknown Tiger candidates for testing enrollment

NOTE: ALL DATA GENERATED IS LABELED:
DEMO DATA — NOT REAL PENCH TIGER RESERVE DATA
"""

import os
import math
import random
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
SAMPLE_DATA_DIR = BASE_DIR / "sample-data"

# Pench Tiger Reserve Camera Stations
PENCH_STATIONS = [
    {"stationId": "PTR-C-01", "name": "Karmajhiri Core Waterhole", "lat": 21.6842, "lon": 79.3124, "zone": "CORE"},
    {"stationId": "PTR-C-02", "name": "Turia Gate River Crossing", "lat": 21.6521, "lon": 79.3451, "zone": "CORE"},
    {"stationId": "PTR-C-03", "name": "Gumtara Core Meadow", "lat": 21.7214, "lon": 79.2890, "zone": "CORE"},
    {"stationId": "PTR-C-04", "name": "Alikatta Fireline Junction", "lat": 21.6980, "lon": 79.3280, "zone": "CORE"},
    {"stationId": "PTR-B-01", "name": "Rukhad Buffer Ridge", "lat": 21.7850, "lon": 79.4120, "zone": "BUFFER"},
    {"stationId": "PTR-B-02", "name": "Jamtara Buffer Corridor", "lat": 21.6110, "lon": 79.4210, "zone": "BUFFER"},
    {"stationId": "PTR-V-01", "name": "Khawasa Village Boundary", "lat": 21.5950, "lon": 79.3510, "zone": "VILLAGE_ADJACENT"},
    {"stationId": "PTR-V-02", "name": "Ari Village Agricultural Border", "lat": 21.8120, "lon": 79.4650, "zone": "VILLAGE_ADJACENT"}
]

# Signature Stripe Frequencies & Angular Orientations for Individual Tigers
TIGER_PROFILES = {
    "BT001": {"name": "Collarwali / Baghin", "stripes": 14, "angle": 12, "thickness": 7, "curve": 0.3, "color_tint": (220, 130, 40)},
    "BT002": {"name": "Langdi / T-20", "stripes": 9, "angle": -18, "thickness": 11, "curve": -0.2, "color_tint": (230, 140, 45)},
    "BT003": {"name": "Raiyyakassa Male", "stripes": 18, "angle": 5, "thickness": 6, "curve": 0.5, "color_tint": (210, 120, 30)},
    "BT004": {"name": "Charger / T-40", "stripes": 11, "angle": 25, "thickness": 9, "curve": 0.1, "color_tint": (225, 135, 35)},
    "BT005": {"name": "Bikram / T-50", "stripes": 16, "angle": -8, "thickness": 8, "curve": -0.4, "color_tint": (215, 125, 38)},
    "BT_UNKNOWN_01": {"name": "Dispersing Sub-Adult (Candidate)", "stripes": 22, "angle": -25, "thickness": 5, "curve": 0.6, "color_tint": (205, 115, 30)}
}

def create_forest_background(w=640, h=480, is_night=False) -> Image.Image:
    """Generates naturalistic forest background with vegetation tones."""
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    
    if is_night:
        base_color = (25, 30, 25)
        top_color = (10, 15, 15)
    else:
        base_color = (60, 85, 45)
        top_color = (110, 145, 95)
        
    for y in range(h):
        ratio = y / h
        r = int(top_color[0] * (1 - ratio) + base_color[0] * ratio)
        g = int(top_color[1] * (1 - ratio) + base_color[1] * ratio)
        b = int(top_color[2] * (1 - ratio) + base_color[2] * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
        
    # Draw background trees & foliage textures
    for _ in range(30):
        tx = random.randint(0, w)
        tw = random.randint(15, 40)
        tree_color = (35, 45, 30) if not is_night else (15, 20, 15)
        draw.rectangle([tx, 0, tx + tw, h], fill=tree_color)
        
    img = img.filter(ImageFilter.GaussianBlur(radius=3))
    return img

def render_blank_frame(blank_type: str = "grass", w=640, h=480) -> Image.Image:
    """Generates various realistic blank / false trigger camera trap frames."""
    is_night = blank_type in ["night_dark", "insect_flash"]
    img = create_forest_background(w, h, is_night=is_night)
    draw = ImageDraw.Draw(img)
    
    if blank_type == "grass":
        # Wind-blown tall grass in foreground
        for _ in range(80):
            x1 = random.randint(0, w)
            y1 = h
            x2 = x1 + random.randint(-40, 40)
            y2 = h - random.randint(150, 350)
            draw.line([(x1, y1), (x2, y2)], fill=(120, 160, 50), width=random.randint(2, 5))
    elif blank_type == "rain":
        # Heavy rain streaks
        for _ in range(250):
            rx = random.randint(0, w)
            ry = random.randint(0, h)
            draw.line([(rx, ry), (rx + 8, ry + 25)], fill=(180, 200, 220), width=1)
    elif blank_type == "heat_shimmer":
        # Heat haze blur
        img = img.filter(ImageFilter.GaussianBlur(radius=8))
    elif blank_type == "insect_flash":
        # White flare near lens at night
        ix, iy = random.randint(100, w-100), random.randint(100, h-100)
        draw.ellipse([ix - 30, iy - 30, ix + 30, iy + 30], fill=(240, 240, 255))
        img = img.filter(ImageFilter.GaussianBlur(radius=10))
        
    _stamp_ethical_watermark(img)
    return img

def render_animal_frame(animal_type: str = "chital", w=640, h=480) -> Image.Image:
    """Renders non-tiger animal or human patrol in camera trap."""
    img = create_forest_background(w, h, is_night=False)
    draw = ImageDraw.Draw(img)
    
    cx, cy = w // 2, h // 2 + 40
    
    if animal_type == "chital":
        # Spotted deer body
        draw.ellipse([cx - 110, cy - 60, cx + 90, cy + 50], fill=(180, 110, 50))
        # White spots
        for _ in range(25):
            sx = cx - 90 + random.randint(0, 160)
            sy = cy - 45 + random.randint(0, 70)
            draw.ellipse([sx, sy, sx + 5, sy + 5], fill=(245, 245, 240))
    elif animal_type == "leopard":
        # Rosette patterns
        draw.ellipse([cx - 120, cy - 55, cx + 100, cy + 45], fill=(210, 150, 60))
        for _ in range(20):
            rx = cx - 100 + random.randint(0, 180)
            ry = cy - 40 + random.randint(0, 60)
            draw.ellipse([rx, ry, rx + 14, ry + 14], outline=(30, 20, 10), width=3)
    elif animal_type == "human":
        # Forest guard uniform
        draw.rectangle([cx - 30, cy - 90, cx + 30, cy + 90], fill=(70, 85, 60)) # Khaki tunic
        draw.ellipse([cx - 20, cy - 130, cx + 20, cy - 90], fill=(210, 170, 140)) # Face
        
    _stamp_ethical_watermark(img)
    return img

def render_tiger_frame(tiger_id: str, variation: int = 0, w=640, h=480) -> Image.Image:
    """
    Renders realistic individual tiger camera trap frame with unique flank stripe pattern.
    """
    profile = TIGER_PROFILES.get(tiger_id, TIGER_PROFILES["BT001"])
    img = create_forest_background(w, h, is_night=False)
    draw = ImageDraw.Draw(img)
    
    # Body coordinates
    bx1 = w // 2 - 170 + (variation * 8)
    by1 = h // 2 - 70
    bx2 = w // 2 + 150 + (variation * 8)
    by2 = h // 2 + 90
    
    # Base golden-orange tiger coat
    coat_color = profile["color_tint"]
    draw.ellipse([bx1, by1, bx2, by2], fill=coat_color)
    
    # Belly white undercoat
    draw.ellipse([bx1 + 30, by2 - 40, bx2 - 30, by2 + 15], fill=(245, 240, 230))
    
    # Head & ears
    hx1, hy1, hx2, hy2 = bx1 - 60, by1 - 30, bx1 + 40, by1 + 60
    draw.ellipse([hx1, hy1, hx2, hy2], fill=coat_color)
    
    # Distinctive individual flank stripes
    num_stripes = profile["stripes"]
    angle = profile["angle"]
    thickness = profile["thickness"]
    curve = profile["curve"]
    
    flank_start_x = bx1 + 50
    flank_width = (bx2 - bx1) - 100
    stripe_gap = flank_width / max(1, num_stripes)
    
    for s in range(num_stripes):
        sx = flank_start_x + (s * stripe_gap) + random.uniform(-3, 3)
        sy_top = by1 + 15 + random.uniform(-5, 5)
        sy_bot = by2 - 25 + random.uniform(-5, 5)
        
        # Calculate curved stripe trajectory
        control_offset = (sx - bx1) * curve
        rad = math.radians(angle)
        dx = math.sin(rad) * 40
        
        pts = [
            (sx, sy_top),
            (sx + dx + control_offset, (sy_top + sy_bot) / 2),
            (sx + (dx * 1.5), sy_bot)
        ]
        
        for p in range(len(pts) - 1):
            draw.line([pts[p], pts[p+1]], fill=(25, 20, 15), width=thickness)
            
    # Subtle blur on coat for realistic camera trap texture
    img = img.filter(ImageFilter.GaussianBlur(radius=0.7))
    _stamp_ethical_watermark(img)
    return img

def _stamp_ethical_watermark(img: Image.Image):
    """Complies with requirement 29: NEVER invent real tiger data without clear labeling."""
    draw = ImageDraw.Draw(img)
    w, h = img.size
    banner_text = "DEMO DATA — NOT REAL PENCH TIGER RESERVE DATA"
    draw.rectangle([0, h - 24, w, h], fill=(0, 0, 0, 180))
    draw.text((10, h - 20), banner_text, fill=(255, 215, 0))

def generate_all_datasets():
    """Generates complete structured datasets for Blank triage, Tiger detection, and Individual Re-ID."""
    print("Generating BaghNetra synthetic datasets for Pench Tiger Reserve...")
    
    # 1. Blank Dataset
    blank_base = DATASETS_DIR / "blank_dataset"
    for split in ["train", "validation", "test"]:
        (blank_base / split / "blank").mkdir(parents=True, exist_ok=True)
        (blank_base / split / "non_blank").mkdir(parents=True, exist_ok=True)
        
        count = 40 if split == "train" else 15
        for i in range(count):
            # Blanks
            b_type = random.choice(["grass", "rain", "heat_shimmer", "insect_flash", "night_dark"])
            b_img = render_blank_frame(b_type)
            b_img.save(blank_base / split / "blank" / f"blank_{split}_{i:03d}_{b_type}.jpg")
            
            # Non-blanks (animals + tigers)
            if i % 2 == 0:
                nb_img = render_tiger_frame(random.choice(list(TIGER_PROFILES.keys())), variation=i)
            else:
                nb_img = render_animal_frame(random.choice(["chital", "leopard", "human"]))
            nb_img.save(blank_base / split / "non_blank" / f"nonblank_{split}_{i:03d}.jpg")
            
    print("[OK] Blank Image Dataset generated.")
    
    # 2. Individual Tiger Dataset for Metric Learning
    id_base = DATASETS_DIR / "individual_tiger"
    for tiger_id in TIGER_PROFILES.keys():
        tiger_dir = id_base / tiger_id
        tiger_dir.mkdir(parents=True, exist_ok=True)
        for var in range(12):
            t_img = render_tiger_frame(tiger_id, variation=var)
            t_img.save(tiger_dir / f"{tiger_id}_capture_{var:02d}.jpg")
            
    print("[OK] Individual Tiger Re-Identification Dataset generated.")
    
    # 3. Sample SD Card Runs for End-to-End Acceptance Ingestion Test
    sd1_dir = SAMPLE_DATA_DIR / "sd_card_run_01"
    sd1_dir.mkdir(parents=True, exist_ok=True)
    
    manifest = []
    # 15 mixed frames in run 1
    for idx in range(18):
        station = random.choice(PENCH_STATIONS[:4]) # Core stations
        if idx in [0, 1, 4, 7, 10, 13]: # Blanks
            b_type = random.choice(["grass", "rain", "insect_flash"])
            img = render_blank_frame(b_type)
            fname = f"IMG_{idx+1000:04d}_BLANK.jpg"
            expected = "BLANK"
        elif idx in [2, 5, 8, 11, 14]: # Known Tigers
            tid = ["BT001", "BT002", "BT003"][idx % 3]
            img = render_tiger_frame(tid, variation=idx)
            fname = f"IMG_{idx+1000:04d}_TIGER_{tid}.jpg"
            expected = tid
        elif idx in [3, 9]: # Non-tiger animals
            img = render_animal_frame("chital")
            fname = f"IMG_{idx+1000:04d}_CHITAL.jpg"
            expected = "CHITAL"
        elif idx == 16: # Human patrol
            img = render_animal_frame("human")
            fname = f"IMG_{idx+1000:04d}_PATROL.jpg"
            expected = "HUMAN"
        else: # Unknown candidate tiger
            img = render_tiger_frame("BT_UNKNOWN_01", variation=idx)
            fname = f"IMG_{idx+1000:04d}_NEW_TIGER.jpg"
            expected = "UNKNOWN_CANDIDATE"
            
        img.save(sd1_dir / fname)
        manifest.append({
            "fileName": fname,
            "stationId": station["stationId"],
            "stationName": station["name"],
            "lat": station["lat"],
            "lon": station["lon"],
            "expectedClass": expected
        })
        
    with open(sd1_dir / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    print("[OK] Sample Camera Trap SD Card Run generated in sample-data/sd_card_run_01.")
    
    # Save camera stations seed file
    seed_stations_path = SAMPLE_DATA_DIR / "pench_stations.json"
    with open(seed_stations_path, "w", encoding="utf-8") as f:
        json.dump(PENCH_STATIONS, f, indent=2)
        
    print("Dataset generation complete.")

if __name__ == "__main__":
    generate_all_datasets()
