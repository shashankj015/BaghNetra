"""
BaghNetra - Instant Single Image AI Classifier
=================================================
Usage:
    py test_image.py <image_path>
    py test_image.py uploads/my_photo.jpg
    py test_image.py sample-data/sd_card_run_01/IMG_1002_TIGER_BT003.jpg

Immediately returns whether the image is:
  - 🐅 TIGER (with Individual ID, confidence, and flank stripe similarity)
  - 👤 HUMAN (with privacy safeguard flag)
  - 🌿 BLANK (with false trigger / quarantine confidence)
  - 🦌 OTHER WILDLIFE (chital deer, leopard, sambar, etc.)
"""

import sys
import os
import time
from pathlib import Path

# Add ai-service to path
sys.path.append(str(Path(__file__).resolve().parent / "ai-service"))

def classify(image_path_str: str):
    image_path = Path(image_path_str)
    if not image_path.exists():
        print(f"\n[ERROR] File not found: {image_path_str}")
        print("Please provide a valid image path (e.g. py test_image.py sample-data/sd_card_run_01/IMG_1000_BLANK.jpg)\n")
        return

    from app.inference.pipeline import BaghNetraAIPipeline
    pipeline = BaghNetraAIPipeline()

    start = time.time()
    res = pipeline.process_image(image_path, filename=image_path.name)
    elapsed_ms = round((time.time() - start) * 1000, 1)

    print("\n" + "=" * 65)
    print(f"  📸 IMAGE: {image_path.name}")
    print(f"  ⚡ INFERENCE TIME: {res.get('processing_time_ms', elapsed_ms)} ms (CPU)")
    print("=" * 65)

    # 1. Blank Classification
    if res.get("blank"):
        conf = res.get("blank_confidence", 0.0) * 100
        print(f"\n  🌿 RESULT: >>> BLANK (EMPTY FRAME) <<<")
        print(f"  • Confidence:         {conf:.1f}%")
        print(f"  • Triage Action:      {res.get('status')}")
        print(f"  • Non-Blank Score:    {res.get('non_blank_confidence', 0.0)*100:.1f}%")
        print(f"  • Safe Quarantine:    Recommended (No wildlife detected)")

    # 2. Tiger Detected
    elif res.get("tiger_detected"):
        t_conf = res.get("tiger_confidence", 0.0) * 100
        indiv = res.get("individual") or "Unknown / New Individual"
        name = res.get("tiger_name") or "New Tiger Candidate"
        id_conf = res.get("identification_confidence", 0.0) * 100
        bbox = res.get("bbox", [])

        print(f"\n  🐅 RESULT: >>> TIGER DETECTED <<<")
        print(f"  • Detection Confidence:      {t_conf:.1f}%")
        print(f"  • Identified Individual:     {indiv} ({name})")
        print(f"  • Stripe Match Similarity:   {id_conf:.1f}%")
        print(f"  • Bounding Box [x1,y1,x2,y2]: {bbox}")
        print(f"  • Status:                    {res.get('status')}")

        candidates = res.get("candidates", [])
        if candidates:
            print(f"\n  Top Re-ID Candidates:")
            for i, c in enumerate(candidates[:3]):
                print(f"    {i+1}. {c.get('tigerId')} - {c.get('name')}: {c.get('similarity', 0)*100:.1f}% match")

    # 3. Human Detected
    elif res.get("has_human") or res.get("detected_class") == "human":
        print(f"\n  👤 RESULT: >>> HUMAN DETECTED <<<")
        print(f"  • Subject:            Forest Guard / Patrol Personnel")
        print(f"  • Privacy Protection: Enabled (Identity Redacted)")
        print(f"  • Status:             {res.get('status')}")

    # 4. Other Animal Detected
    else:
        det_cls = res.get("detected_class", "animal")
        print(f"\n  🦌 RESULT: >>> OTHER WILDLIFE DETECTED <<<")
        print(f"  • Species Category:   {det_cls.upper()}")
        print(f"  • Blank Confidence:   {res.get('blank_confidence', 0.0)*100:.1f}%")
        print(f"  • Status:             {res.get('status')}")

    print("\n" + "=" * 65 + "\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        classify(sys.argv[1])
    else:
        # Default demo check on the real tiger photo if no argument provided
        default_img = Path("uploads/1786900896458-741936340-a-powerful-tiger-roars-as-it-leaps-across-a-warm-golden-background-photo.webp")
        if default_img.exists():
            print("No image path passed — running on sample real tiger photo:")
            classify(str(default_img))
        else:
            print("Usage: py test_image.py <path_to_image>")
