"""
BaghNetra - AI Model 2: YOLO Tiger & Animal Detector Training Pipeline
Trains and validates real YOLO detector for:
  0: tiger
  1: other_animal
  2: human
Saves model weights to models/tiger_detector/best_model.pt and reports real mAP, precision, recall.
"""

import os
import sys
import json
import argparse
import time
from pathlib import Path
import shutil

sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.utils.logger import logger

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DATASET = BASE_DIR / "datasets" / "tiger_detection"
DEFAULT_OUTPUT = BASE_DIR / "models" / "tiger_detector"

def train_tiger_detector(
    dataset_path: Path,
    output_dir: Path,
    epochs: int = 5,
    img_size: int = 640,
    batch_size: int = 4
):
    output_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Starting Tiger Detector YOLO training on {dataset_path}")
    
    start_time = time.time()
    
    if not HAS_YOLO:
        raise RuntimeError("Ultralytics YOLO is not installed in Python environment. Cannot train detector.")
        
    data_yaml = dataset_path / "data.yaml"
    train_images = dataset_path / "images" / "train"
    
    if not data_yaml.exists() or not train_images.exists():
        raise FileNotFoundError(
            f"Tiger detection dataset is missing at {dataset_path}. "
            f"Expected data.yaml and {train_images}. Run generate_demo_dataset.py first."
        )
        
    logger.info(f"Using dataset configuration: {data_yaml}")
    
    # Initialize base YOLOv8 nano model for fine-tuning on custom 3-class Pench dataset
    model = YOLO("yolov8n.pt")
    
    # Train model on our custom Pench dataset
    logger.info(f"Training YOLOv8 on custom classes: 0=tiger, 1=other_animal, 2=human for {epochs} epochs...")
    train_results = model.train(
        data=str(data_yaml),
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        device="cpu",
        workers=0,
        lr0=0.01,
        lrf=0.01,
        verbose=True,
        project=str(BASE_DIR / "runs" / "detect"),
        name="tiger_train",
        exist_ok=True
    )
    
    # Validate the trained model on validation split
    logger.info("Validating trained custom YOLO model on test/val set...")
    val_results = model.val(data=str(data_yaml), split="val", device="cpu", verbose=False)
    
    # Save the trained model to our canonical models directory
    target_pt = output_dir / "best_model.pt"
    
    # Check if a best.pt was produced in runs/detect/tiger_train/weights/best.pt
    run_best_pt = BASE_DIR / "runs" / "detect" / "tiger_train" / "weights" / "best.pt"
    if run_best_pt.exists():
        shutil.copy2(run_best_pt, target_pt)
        logger.info(f"Copied best fine-tuned weights from {run_best_pt} to {target_pt}")
    else:
        model.save(str(target_pt))
        logger.info(f"Saved model directly to {target_pt}")
        
    # Extract real validation metrics
    map50 = round(float(val_results.box.map50), 4) if hasattr(val_results.box, "map50") else 0.0
    map50_95 = round(float(val_results.box.map), 4) if hasattr(val_results.box, "map") else 0.0
    precision = round(float(val_results.box.mp), 4) if hasattr(val_results.box, "mp") else 0.0
    recall = round(float(val_results.box.mr), 4) if hasattr(val_results.box, "mr") else 0.0
    
    # Class-specific metrics
    per_class_map50 = {}
    if hasattr(val_results.box, "maps") and val_results.box.maps is not None:
        for idx, cls_name in enumerate(["tiger", "other_animal", "human"]):
            if idx < len(val_results.box.maps):
                per_class_map50[cls_name] = round(float(val_results.box.maps[idx]), 4)

    metrics = {
        "model_name": "YOLOv8-Wildlife-Tiger",
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "epochs": epochs,
        "batch_size": batch_size,
        "image_size": img_size,
        "classes": {
            0: "tiger",
            1: "other_animal",
            2: "human"
        },
        "mAP50": map50,
        "mAP50_95": map50_95,
        "precision": precision,
        "recall": recall,
        "f1_score": round(2 * (precision * recall) / max(1e-6, (precision + recall)), 4),
        "per_class_map50": per_class_map50,
        "duration_seconds": round(time.time() - start_time, 2)
    }
    
    with open(output_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
        
    logger.info(f"[OK] Tiger Detector training complete. Saved to {target_pt}")
    logger.info(f"[OK] Metrics: mAP50={map50}, Precision={precision}, Recall={recall}")
    return metrics

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train BaghNetra Tiger Detector")
    parser.add_argument("--dataset", type=Path, default=DEFAULT_DATASET)
    parser.add_argument("--output_dir", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=4)
    args = parser.parse_args()
    
    train_tiger_detector(
        dataset_path=args.dataset,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size
    )
