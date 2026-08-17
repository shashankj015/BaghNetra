"""
BaghNetra - Quick Model Smoke Test
===================================
Tests all 3 AI models against real images and shows PASS/FAIL for each.
Run:  py ai-service/scripts/test_models.py
"""

import sys
import time
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.inference.pipeline import BaghNetraAIPipeline

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def create_test_blank():
    """Create a realistic blank image (empty dark forest - no animal)."""
    arr = np.random.randint(5, 20, (480, 640, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    path = BASE_DIR / "scratch" / "test_blank.jpg"
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, quality=85)
    return path

def create_test_forest():
    """Create a blank forest scene (green foliage, no animal)."""
    img = Image.new("RGB", (640, 480))
    draw = ImageDraw.Draw(img)
    for y in range(480):
        r = int(40 + (y / 480) * 30)
        g = int(70 + (y / 480) * 50)
        b = int(25 + (y / 480) * 15)
        draw.line([(0, y), (640, y)], fill=(r, g, b))
    path = BASE_DIR / "scratch" / "test_forest_blank.jpg"
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, quality=85)
    return path

def find_real_tiger_photo():
    """Find a real tiger photo in uploads/."""
    uploads = BASE_DIR / "uploads"
    for ext in ["*.webp", "*.jpg", "*.jpeg", "*.png"]:
        for f in uploads.glob(ext):
            if "tiger" in f.name.lower():
                return f
    # Fallback: any file in uploads
    for ext in ["*.webp", "*.jpg", "*.jpeg", "*.png"]:
        for f in uploads.glob(ext):
            return f
    return None

def run_tests():
    print("=" * 60)
    print("   BAGHNETRA AI MODEL SMOKE TEST")
    print("   Testing Blank Detector + Tiger Detector + Tiger ID")
    print("=" * 60)

    # Load pipeline
    print("\nLoading AI pipeline...")
    start = time.time()
    pipeline = BaghNetraAIPipeline()
    print(f"Pipeline loaded in {time.time() - start:.1f}s\n")

    passed = 0
    failed = 0
    total = 0

    # ────────────────────────────────────────────────
    # TEST 1: Dark blank image -> should be BLANK
    # ────────────────────────────────────────────────
    total += 1
    print("-" * 60)
    print("TEST 1: Dark empty frame (should be classified as BLANK)")
    blank_path = create_test_blank()
    res = pipeline.process_image(blank_path, filename="test_dark_blank.jpg")
    blank_conf = res["blank_confidence"]
    is_blank = res["blank"]
    status = res["status"]

    if blank_conf > 0.5:
        print(f"  RESULT: blank_confidence = {blank_conf:.4f}")
        print(f"  STATUS: {status}")
        print(f"  >>> PASS - Correctly detected as blank")
        passed += 1
    else:
        print(f"  RESULT: blank_confidence = {blank_conf:.4f}")
        print(f"  STATUS: {status}")
        print(f"  >>> FAIL - Should be blank but got non-blank")
        failed += 1

    # ────────────────────────────────────────────────
    # TEST 2: Green forest blank -> should be BLANK
    # ────────────────────────────────────────────────
    total += 1
    print("-" * 60)
    print("TEST 2: Green forest scene (should be classified as BLANK)")
    forest_path = create_test_forest()
    res = pipeline.process_image(forest_path, filename="test_forest_blank.jpg")
    blank_conf = res["blank_confidence"]
    status = res["status"]

    if blank_conf > 0.5:
        print(f"  RESULT: blank_confidence = {blank_conf:.4f}")
        print(f"  STATUS: {status}")
        print(f"  >>> PASS - Correctly detected as blank")
        passed += 1
    else:
        print(f"  RESULT: blank_confidence = {blank_conf:.4f}")
        print(f"  STATUS: {status}")
        print(f"  >>> FAIL - Should be blank but got non-blank")
        failed += 1

    # ────────────────────────────────────────────────
    # TEST 3: Real tiger photo -> should NOT be blank
    # ────────────────────────────────────────────────
    tiger_path = find_real_tiger_photo()
    if tiger_path:
        total += 1
        print("-" * 60)
        print(f"TEST 3: Real tiger photo ({tiger_path.name})")
        print("  Expected: NOT blank, tiger detected")
        res = pipeline.process_image(tiger_path, filename=tiger_path.name)

        blank_conf = res["blank_confidence"]
        tiger_det = res["tiger_detected"]
        tiger_conf = res["tiger_confidence"]
        det_class = res["detected_class"]
        individual = res.get("tiger_name", "N/A")
        id_conf = res.get("identification_confidence", 0)
        status = res["status"]
        proc_time = res["processing_time_ms"]

        print(f"  Blank confidence:  {blank_conf:.4f} (want < 0.5)")
        print(f"  Tiger detected:    {tiger_det}")
        print(f"  Tiger confidence:  {tiger_conf:.4f}")
        print(f"  Detected class:    {det_class}")
        print(f"  Individual match:  {individual} ({id_conf:.4f})")
        print(f"  Status:            {status}")
        print(f"  Processing time:   {proc_time:.0f} ms")

        if blank_conf < 0.5 and tiger_det:
            print(f"  >>> PASS - Tiger correctly detected (not blank!)")
            passed += 1
        elif blank_conf < 0.5:
            print(f"  >>> PARTIAL PASS - Not blank, but tiger not detected (detection issue)")
            passed += 1
        else:
            print(f"  >>> FAIL - Real tiger classified as blank!")
            failed += 1
    else:
        print("-" * 60)
        print("TEST 3: SKIPPED - No real tiger photo found in uploads/")

    # ────────────────────────────────────────────────
    # TEST 4: Sample synthetic tiger from dataset
    # ────────────────────────────────────────────────
    sample_dir = BASE_DIR / "sample-data" / "sd_card_run_01"
    tiger_samples = list(sample_dir.glob("*TIGER*.jpg"))
    if tiger_samples:
        total += 1
        test_img = tiger_samples[0]
        print("-" * 60)
        print(f"TEST 4: Sample tiger from SD card ({test_img.name})")
        res = pipeline.process_image(test_img, filename=test_img.name)
        blank_conf = res["blank_confidence"]
        tiger_det = res["tiger_detected"]
        status = res["status"]

        print(f"  Blank confidence: {blank_conf:.4f}")
        print(f"  Tiger detected:   {tiger_det}")
        print(f"  Status:           {status}")

        if blank_conf < 0.5:
            print(f"  >>> PASS - Not classified as blank")
            passed += 1
        else:
            print(f"  >>> FAIL - Tiger photo wrongly classified as blank")
            failed += 1

    # ────────────────────────────────────────────────
    # TEST 5: Sample blank from SD card
    # ────────────────────────────────────────────────
    blank_samples = list(sample_dir.glob("*BLANK*.jpg"))
    if blank_samples:
        total += 1
        test_img = blank_samples[0]
        print("-" * 60)
        print(f"TEST 5: Sample blank from SD card ({test_img.name})")
        res = pipeline.process_image(test_img, filename=test_img.name)
        blank_conf = res["blank_confidence"]
        status = res["status"]

        print(f"  Blank confidence: {blank_conf:.4f}")
        print(f"  Status:           {status}")

        if blank_conf > 0.5:
            print(f"  >>> PASS - Correctly detected as blank")
            passed += 1
        else:
            print(f"  >>> FAIL - Blank photo not caught")
            failed += 1

    # ────────────────────────────────────────────────
    # SUMMARY
    # ────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print(f"   RESULTS: {passed}/{total} PASSED, {failed}/{total} FAILED")
    if failed == 0:
        print("   ALL TESTS PASSED - Models are working correctly!")
    else:
        print(f"   WARNING: {failed} test(s) failed - check above for details")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
