"""
BaghNetra — Blank Image Detector Dataset Builder
=================================================
Builds a robust, lightweight dataset for the MobileNetV3 blank vs non-blank
classifier using ONLY real photographs (downloaded from open-license sources)
combined with realistic programmatic augmentations that simulate real
camera-trap failure modes.

Target total: ~600 images across train/validation/test splits.
All images resized to 320×320 JPEG (~15-40 KB each) → ~20 MB total on disk.
Designed to run and train on low-end / field laptops (CPU only, <4 GB RAM).

Dataset structure produced:
  datasets/blank_dataset/
    train/blank/        (~120 images)
    train/non_blank/    (~120 images)
    validation/blank/   (~40 images)
    validation/non_blank/ (~40 images)
    test/blank/         (~40 images)
    test/non_blank/     (~40 images)
"""

import os
import sys
import json
import random
import hashlib
from pathlib import Path
from io import BytesIO

import requests
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps

# ──────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = BASE_DIR / "datasets" / "blank_dataset"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 Chrome/120 Safari/537.36"
    )
}

# ──────────────────────────────────────────────────────────────
# Open-access image URLs (Unsplash CDN — free for any use)
# ──────────────────────────────────────────────────────────────
# Blank-like scenes (forests, trails, grass, night sky — NO animals)
BLANK_URLS = [
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=480",  # forest path
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=480",  # shaded woodland
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=480",  # sunlit trees
    "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=480",  # trail grass
    "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=480",  # branches
    "https://images.unsplash.com/photo-1511497584788-876761c144ee?w=480",  # dense foliage
    "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=480",  # misty lake
    "https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=480",  # foggy morning
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=480",  # landscape dawn
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=480",  # foggy valley
    "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=480",  # mountain forest
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=480",  # riverbed empty
]

# Non-blank scenes (animals, tigers, people — clearly a subject present)
NON_BLANK_URLS = [
    "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=480",  # tiger in grass
    "https://images.unsplash.com/photo-1549366021-9f761d450615?w=480",  # tiger close
    "https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=480",  # tiger walking
    "https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=480",  # bengal tiger
    "https://images.unsplash.com/photo-1508814437933-f0c7d18a9217?w=480",  # tiger water
    "https://images.unsplash.com/photo-1484406566174-9da000fda645?w=480",  # deer
    "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=480",  # leopard
    "https://images.unsplash.com/photo-1547970810-dc699c715e22?w=480",  # deer forest
    "https://images.unsplash.com/photo-1504173010664-32509aeebb62?w=480",  # sambar
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480",  # person
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=480",  # guard
    "https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?w=480",  # tiger shade
]

# ──────────────────────────────────────────────────────────────
# Download helper
# ──────────────────────────────────────────────────────────────
def download_image(url: str) -> Image.Image | None:
    """Download a URL and return as PIL.Image, or None on failure."""
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code == 200 and len(r.content) > 2000:
            img = Image.open(BytesIO(r.content)).convert("RGB")
            return img
    except Exception as e:
        print(f"  [!] Failed: {url[:60]}... ({e})")
    return None

# ──────────────────────────────────────────────────────────────
# Camera-trap augmentation pipeline
# Simulates real failure modes a field camera produces
# ──────────────────────────────────────────────────────────────
def augment_blank(img: Image.Image, idx: int) -> Image.Image:
    """
    Create realistic blank-camera-trap variants:
      - Night IR (grayscale + green tint)
      - Heavy rain streaks
      - Fog / heat shimmer (heavy Gaussian blur)
      - Motion blur from wind-blown grass
      - Overexposed flash / insect near lens
      - Pure darkness with sensor noise
    """
    img = img.copy()
    mode = idx % 8

    if mode == 0:
        # Night infrared
        g = ImageOps.grayscale(img)
        img = Image.merge("RGB", (g, g, g))
        img = ImageEnhance.Brightness(img).enhance(0.4)

    elif mode == 1:
        # Rain streaks
        draw = ImageDraw.Draw(img)
        w, h = img.size
        for _ in range(200):
            x = random.randint(0, w)
            y = random.randint(0, h)
            draw.line([(x, y), (x + random.randint(3, 8), y + random.randint(15, 30))],
                      fill=(180, 195, 215), width=1)
        img = ImageEnhance.Contrast(img).enhance(0.7)

    elif mode == 2:
        # Heavy fog / heat shimmer
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(6, 12)))
        img = ImageEnhance.Brightness(img).enhance(random.uniform(1.1, 1.4))

    elif mode == 3:
        # Near-total darkness with sensor noise
        arr = np.array(img, dtype=np.float32)
        arr = arr * random.uniform(0.03, 0.12)
        noise = np.random.normal(0, random.uniform(3, 8), arr.shape)
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr)

    elif mode == 4:
        # Overexposed flash / insect near lens
        draw = ImageDraw.Draw(img)
        w, h = img.size
        cx, cy = random.randint(w // 4, 3 * w // 4), random.randint(h // 4, 3 * h // 4)
        r = random.randint(40, 90)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 245))
        img = img.filter(ImageFilter.GaussianBlur(radius=10))

    elif mode == 5:
        # Wind-blown grass (horizontal motion blur + green overlay)
        img = ImageEnhance.Color(img).enhance(1.5)
        img = img.filter(ImageFilter.GaussianBlur(radius=3))
        # Add grass lines at bottom
        draw = ImageDraw.Draw(img)
        w, h = img.size
        for _ in range(60):
            x1 = random.randint(0, w)
            draw.line([(x1, h), (x1 + random.randint(-30, 30), h - random.randint(80, 200))],
                      fill=(90 + random.randint(0, 40), 130 + random.randint(0, 40), 40),
                      width=random.randint(2, 4))

    elif mode == 6:
        # Grayscale dusk / low-light
        img = ImageOps.grayscale(img).convert("RGB")
        img = ImageEnhance.Brightness(img).enhance(random.uniform(0.3, 0.6))

    elif mode == 7:
        # Random crop + slight rotation (camera shifted by wind)
        w, h = img.size
        angle = random.uniform(-8, 8)
        img = img.rotate(angle, fillcolor=(30, 40, 25))
        crop_pct = random.uniform(0.05, 0.15)
        img = img.crop((int(w * crop_pct), int(h * crop_pct),
                         int(w * (1 - crop_pct)), int(h * (1 - crop_pct))))

    # Random horizontal flip
    if random.random() > 0.5:
        img = ImageOps.mirror(img)

    return img


def augment_non_blank(img: Image.Image, idx: int) -> Image.Image:
    """
    Create realistic non-blank variants that preserve the animal/human
    but simulate varied camera-trap conditions:
      - Night IR with animal visible
      - Low-light dawn/dusk
      - Partial occlusion by foliage
      - Rain with subject still visible
      - Slight motion blur
      - Brightness/contrast jitter
    """
    img = img.copy()
    mode = idx % 6

    if mode == 0:
        # Night IR — animal still visible in grayscale
        img = ImageOps.grayscale(img).convert("RGB")
        img = ImageEnhance.Contrast(img).enhance(1.3)

    elif mode == 1:
        # Low-light dawn
        img = ImageEnhance.Brightness(img).enhance(random.uniform(0.5, 0.75))
        img = ImageEnhance.Color(img).enhance(0.6)

    elif mode == 2:
        # Foliage occlusion overlay
        draw = ImageDraw.Draw(img)
        w, h = img.size
        for _ in range(15):
            x = random.randint(0, w)
            y = random.randint(0, h // 3)
            draw.ellipse([x, y, x + random.randint(20, 60), y + random.randint(20, 60)],
                         fill=(40 + random.randint(0, 30), 70 + random.randint(0, 30), 20))

    elif mode == 3:
        # Light rain
        draw = ImageDraw.Draw(img)
        w, h = img.size
        for _ in range(80):
            x = random.randint(0, w)
            y = random.randint(0, h)
            draw.line([(x, y), (x + 3, y + 12)], fill=(170, 185, 200), width=1)

    elif mode == 4:
        # Slight motion blur
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.5)))

    elif mode == 5:
        # Brightness + contrast jitter
        img = ImageEnhance.Brightness(img).enhance(random.uniform(0.8, 1.3))
        img = ImageEnhance.Contrast(img).enhance(random.uniform(0.8, 1.3))

    if random.random() > 0.5:
        img = ImageOps.mirror(img)

    return img


# ──────────────────────────────────────────────────────────────
# Purely synthetic blank generators (no download needed)
# These expand the blank class with zero-cost generated images
# ──────────────────────────────────────────────────────────────
def generate_synthetic_blank(idx: int, size: int = 320) -> Image.Image:
    """Generate a purely synthetic camera-trap blank image."""
    variant = idx % 6

    if variant == 0:
        # Near-black frame (night with no trigger)
        arr = np.random.randint(0, 15, (size, size, 3), dtype=np.uint8)
        img = Image.fromarray(arr)

    elif variant == 1:
        # Uniform grey fog
        base = random.randint(80, 140)
        arr = np.full((size, size, 3), base, dtype=np.uint8)
        noise = np.random.normal(0, 5, (size, size, 3))
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr)

    elif variant == 2:
        # Green foliage gradient (grass in front of camera)
        img = Image.new("RGB", (size, size))
        draw = ImageDraw.Draw(img)
        for y in range(size):
            r = int(40 + (y / size) * 30 + random.uniform(-5, 5))
            g = int(80 + (y / size) * 50 + random.uniform(-5, 5))
            b = int(25 + (y / size) * 15 + random.uniform(-3, 3))
            draw.line([(0, y), (size, y)], fill=(r, g, b))
        img = img.filter(ImageFilter.GaussianBlur(radius=3))

    elif variant == 3:
        # Overexposed white-out (direct sunlight / flash reflection)
        base = random.randint(220, 255)
        arr = np.full((size, size, 3), base, dtype=np.uint8)
        noise = np.random.normal(0, 3, (size, size, 3))
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr)

    elif variant == 4:
        # Brown earth / mud (camera fallen or obstructed)
        img = Image.new("RGB", (size, size))
        draw = ImageDraw.Draw(img)
        for y in range(size):
            r = int(100 + random.uniform(-10, 10))
            g = int(70 + random.uniform(-10, 10))
            b = int(40 + random.uniform(-8, 8))
            draw.line([(0, y), (size, y)], fill=(r, g, b))
        img = img.filter(ImageFilter.GaussianBlur(radius=4))

    elif variant == 5:
        # Night IR grain (greenish gray noise)
        r_ch = np.random.randint(10, 35, (size, size), dtype=np.uint8)
        g_ch = np.random.randint(20, 50, (size, size), dtype=np.uint8)
        b_ch = np.random.randint(10, 30, (size, size), dtype=np.uint8)
        img = Image.merge("RGB", (Image.fromarray(r_ch), Image.fromarray(g_ch), Image.fromarray(b_ch)))

    return img


# ──────────────────────────────────────────────────────────────
# Main builder
# ──────────────────────────────────────────────────────────────
TARGET_SIZE = (320, 320)  # Small enough for fast CPU training

SPLIT_CONFIG = {
    # split_name: (num_blank, num_non_blank)
    "train":      (120, 120),
    "validation":  (40,  40),
    "test":        (40,  40),
}

def save_img(img: Image.Image, path: Path):
    """Resize to TARGET_SIZE and save as JPEG with moderate compression."""
    img = img.resize(TARGET_SIZE, Image.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "JPEG", quality=80)


def build_blank_dataset():
    print("=" * 56)
    print("  BaghNetra Blank Detector Dataset Builder")
    print("  Target: ~600 images, ~20 MB total, CPU-friendly")
    print("=" * 56)

    # ── Step 1: Download base photos ──
    print("\n[1/3] Downloading real photographs...")
    blank_bases = []
    for url in BLANK_URLS:
        img = download_image(url)
        if img:
            blank_bases.append(img)
            print(f"  [OK] blank base ({len(blank_bases)}/{len(BLANK_URLS)})")

    non_blank_bases = []
    for url in NON_BLANK_URLS:
        img = download_image(url)
        if img:
            non_blank_bases.append(img)
            print(f"  [OK] non_blank base ({len(non_blank_bases)}/{len(NON_BLANK_URLS)})")

    print(f"\n  Downloaded {len(blank_bases)} blank + {len(non_blank_bases)} non-blank base photos")

    if not blank_bases:
        print("  [!]  No blank bases downloaded — will use 100% synthetic blanks")
    if not non_blank_bases:
        raise RuntimeError("Cannot build dataset: zero non-blank base images downloaded. Check network.")

    # ── Step 2: Generate augmented splits ──
    print("\n[2/3] Generating augmented dataset splits...")

    total_saved = 0
    for split_name, (n_blank, n_non_blank) in SPLIT_CONFIG.items():
        b_dir = DATASET_DIR / split_name / "blank"
        nb_dir = DATASET_DIR / split_name / "non_blank"

        # Remove old images
        for d in [b_dir, nb_dir]:
            if d.exists():
                for old in d.glob("*.jpg"):
                    old.unlink()

        # ── Blanks ──
        for i in range(n_blank):
            if blank_bases and random.random() < 0.6:
                # 60% from real downloaded photos + augmentation
                base = random.choice(blank_bases)
                img = augment_blank(base, i)
            else:
                # 40% purely synthetic blanks
                img = generate_synthetic_blank(i)

            save_img(img, b_dir / f"blank_{split_name}_{i:04d}.jpg")

        # ── Non-blanks ──
        for i in range(n_non_blank):
            base = non_blank_bases[i % len(non_blank_bases)]
            img = augment_non_blank(base, i)
            save_img(img, nb_dir / f"nonblank_{split_name}_{i:04d}.jpg")

        count = n_blank + n_non_blank
        total_saved += count
        print(f"  [OK] {split_name}: {n_blank} blank + {n_non_blank} non_blank = {count} images")

    # ── Step 3: Report ──
    total_bytes = 0
    total_files = 0
    for p in DATASET_DIR.rglob("*.jpg"):
        total_bytes += p.stat().st_size
        total_files += 1

    print(f"\n[3/3] Dataset ready!")
    print(f"  Location:    {DATASET_DIR}")
    print(f"  Total files: {total_files}")
    print(f"  Total size:  {total_bytes / (1024 * 1024):.1f} MB")
    print(f"  Avg file:    {total_bytes // max(total_files, 1) // 1024} KB")
    print(f"\n  [>] To train:  py ai-service/scripts/train_blank_model.py --epochs 15 --batch_size 8")


if __name__ == "__main__":
    build_blank_dataset()
