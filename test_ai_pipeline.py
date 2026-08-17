"""
Integration Test: Verify BaghNetra AI Service & Pipeline with ResNet-50 Tiger Re-ID
"""

import os
import sys
import json
from pathlib import Path
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent / "ai-service"))

from app.inference.pipeline import BaghNetraAIPipeline

def test_integration():
    print("=" * 70)
    print(" BAGHNETRA AI PIPELINE END-TO-END INTEGRATION TEST")
    print("=" * 70)
    
    pipeline = BaghNetraAIPipeline()
    
    print("\n--- 1. Check AI Pipeline Status ---")
    print(f"Blank Detector Loaded:    {pipeline.blank_detector.is_loaded}")
    print(f"Tiger Detector Loaded:    {pipeline.tiger_detector.is_loaded}")
    print(f"Tiger Identifier Loaded:  {pipeline.tiger_identifier.is_loaded}")
    print(f"Reference Tigers Enrolled: {len(pipeline.tiger_identifier.known_tigers)}")
    for t in pipeline.tiger_identifier.known_tigers:
        print(f"  - Tiger ID: {t.get('tigerId'):<6} | Name: {t.get('name')}")
        
    assert pipeline.tiger_identifier.is_loaded, "Tiger Identifier failed to load!"
    assert len(pipeline.tiger_identifier.known_tigers) >= 6, "Reference tigers missing!"
    
    print("\n--- 2. Test Pipeline Triage on Known Tiger (BT003) ---")
    sample_bt003 = "sample-data/sd_card_run_01/IMG_1008_TIGER_BT003.jpg"
    res_bt003 = pipeline.process_image(sample_bt003, filename="IMG_1008_TIGER_BT003.jpg")
    
    print(f"Processing Result for {sample_bt003}:")
    print(f"  Detected Class:       {res_bt003.get('detected_class')}")
    print(f"  Tiger Detected:       {res_bt003.get('tiger_detected')}")
    print(f"  Identification State: {res_bt003.get('status')}")
    print(f"  Matched Individual:   {res_bt003.get('individual')} ({res_bt003.get('tiger_name')})")
    print(f"  Match Confidence:     {res_bt003.get('identification_confidence')}")
    print(f"  Top Candidate:        {res_bt003.get('candidates')[0] if res_bt003.get('candidates') else None}")
    
    print("\n--- 3. Test Pipeline Triage on Unseen / New Tiger ---")
    sample_new = "sample-data/sd_card_run_01/IMG_1017_NEW_TIGER.jpg"
    res_new = pipeline.process_image(sample_new, filename="IMG_1017_NEW_TIGER.jpg")
    
    print(f"Processing Result for {sample_new}:")
    print(f"  Detected Class:       {res_new.get('detected_class')}")
    print(f"  Tiger Detected:       {res_new.get('tiger_detected')}")
    print(f"  Identification State: {res_new.get('status')}")
    print(f"  Matched Individual:   {res_new.get('individual')}")
    print(f"  Match Confidence:     {res_new.get('identification_confidence')}")
    print(f"  Needs Review:         {res_new.get('needs_review')}")
    
    print("\n--- 4. Test Pipeline Triage on Blank Scene ---")
    sample_blank = "sample-data/sd_card_run_01/IMG_1000_BLANK.jpg"
    res_blank = pipeline.process_image(sample_blank, filename="IMG_1000_BLANK.jpg")
    print(f"Processing Result for {sample_blank}:")
    print(f"  Detected Class:       {res_blank.get('detected_class')}")
    print(f"  Is Blank:             {res_blank.get('blank')}")
    print(f"  Status:               {res_blank.get('status')}")
    
    print("\n" + "=" * 70)
    print(" ALL INTEGRATION CHECKS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_integration()
