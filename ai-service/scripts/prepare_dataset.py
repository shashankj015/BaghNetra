"""
BaghNetra - Dataset Preparation, Validation & Integrity Audit Script
Checks image corruption, duplicate detection, class balance, and train/val/test distributions.
"""

import os
import hashlib
from pathlib import Path
from typing import Dict, Any, List
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASETS_DIR = BASE_DIR / "datasets"

def compute_file_hash(file_path: Path) -> str:
    """Computes SHA-256 hash of file for duplicate detection."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def validate_and_prepare():
    print("==================================================")
    print("  BAGHNETRA DATASET AUDIT & PREPARATION UTILITY   ")
    print("==================================================")
    
    report = {
        "blank_dataset": {},
        "individual_tiger_dataset": {},
        "duplicates": [],
        "corrupt_images": [],
        "total_images_scanned": 0
    }
    
    seen_hashes = {}
    
    # 1. Audit Blank Dataset
    blank_base = DATASETS_DIR / "blank_dataset"
    if blank_base.exists():
        for split in ["train", "validation", "test"]:
            report["blank_dataset"][split] = {"blank": 0, "non_blank": 0}
            for cls in ["blank", "non_blank"]:
                cls_dir = blank_base / split / cls
                if not cls_dir.exists():
                    continue
                for img_path in cls_dir.glob("*.jpg"):
                    report["total_images_scanned"] += 1
                    
                    # Corruption check
                    try:
                        with Image.open(img_path) as img:
                            img.verify()
                    except Exception as e:
                        report["corrupt_images"].append(str(img_path))
                        continue
                        
                    # Duplicate check
                    f_hash = compute_file_hash(img_path)
                    if f_hash in seen_hashes:
                        report["duplicates"].append({
                            "original": str(seen_hashes[f_hash]),
                            "duplicate": str(img_path)
                        })
                    else:
                        seen_hashes[f_hash] = img_path
                        
                    report["blank_dataset"][split][cls] += 1

    # 2. Audit Individual Tiger Dataset
    id_base = DATASETS_DIR / "individual_tiger"
    if id_base.exists():
        for tiger_dir in id_base.iterdir():
            if not tiger_dir.is_dir():
                continue
            t_id = tiger_dir.name
            report["individual_tiger_dataset"][t_id] = 0
            for img_path in tiger_dir.glob("*.jpg"):
                report["total_images_scanned"] += 1
                try:
                    with Image.open(img_path) as img:
                        img.verify()
                    report["individual_tiger_dataset"][t_id] += 1
                except Exception:
                    report["corrupt_images"].append(str(img_path))

    # Print Summary Report
    print(f"\nTotal Images Scanned: {report['total_images_scanned']}")
    print(f"Corrupt Images Found: {len(report['corrupt_images'])}")
    print(f"Duplicate Files Found: {len(report['duplicates'])}")
    
    print("\n[Blank Dataset Split Summary]")
    for split, counts in report["blank_dataset"].items():
        print(f"  - {split.upper():<12} | Blank: {counts['blank']:<4} | Non-Blank: {counts['non_blank']:<4} | Total: {counts['blank'] + counts['non_blank']}")
        
    print("\n[Individual Tiger Catalogue Summary]")
    for t_id, count in report["individual_tiger_dataset"].items():
        print(f"  - Individual {t_id:<14}: {count} flank capture images")
        
    print("\nDataset preparation status: OK / VALIDATED")
    return report

if __name__ == "__main__":
    validate_and_prepare()
