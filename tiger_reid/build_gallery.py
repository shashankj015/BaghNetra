#!/usr/bin/env python3
import sys
from pathlib import Path

# Set path
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tiger_reid.inference.build_gallery import build_tiger_gallery
import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build BaghNetra Tiger Gallery")
    parser.add_argument("--checkpoint", type=str, default="checkpoints/best_model.pth")
    parser.add_argument("--gallery_csv", type=str, default="tiger_reid/data/splits/val_gallery.csv")
    parser.add_argument("--images_dir", type=str, default="/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/re id/train")
    parser.add_argument("--output_dir", type=str, default="gallery")
    args = parser.parse_args()
    
    build_tiger_gallery(
        checkpoint_path=args.checkpoint,
        gallery_csv=args.gallery_csv,
        images_dir=args.images_dir,
        output_dir=args.output_dir
    )
