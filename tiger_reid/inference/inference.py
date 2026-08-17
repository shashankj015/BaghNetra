"""
BaghNetra Tiger Re-ID: Individual Identification & Unknown Tiger Detection Inference
Usage:
  python tiger_reid/inference/inference.py --image path/to/tiger.jpg --threshold 0.70
"""

import os
import sys
import csv
import argparse
from pathlib import Path
from typing import Dict, Any, List

import torch
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from tiger_reid.datasets.transforms import get_val_transforms
from tiger_reid.models.tiger_reid import TigerReIDNet


class TigerIdentifier:
    """
    Open-Set Metric Learning Identifier for Amur Tiger Re-ID.
    """
    def __init__(
        self,
        checkpoint_path: str = "checkpoints/best_model.pth",
        gallery_dir: str = "gallery",
        match_threshold: float = 0.70,
        device: str = "auto"
    ):
        self.match_threshold = match_threshold
        self.device = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")) if device == "auto" else torch.device(device)
        self.transform = get_val_transforms(image_size=(224, 224))
        
        # 1. Load Model
        ckpt = torch.load(checkpoint_path, map_location=self.device)
        config = ckpt.get("config", {})
        model_cfg = config.get("model", {})
        
        num_classes = len(ckpt["model_state_dict"]["classifier.weight"]) if "classifier.weight" in ckpt["model_state_dict"] else 0
        self.model = TigerReIDNet(
            num_classes=num_classes,
            backbone_name=model_cfg.get("backbone", "resnet50"),
            pretrained=False,
            embedding_dim=model_cfg.get("embedding_dim", 512),
            dropout_rate=0.0
        )
        self.model.load_state_dict(ckpt["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()
        
        # 2. Load Gallery Prototypes
        gal_path = Path(gallery_dir)
        proto_emb_file = gal_path / "prototype_embeddings.npy"
        proto_meta_file = gal_path / "prototype_metadata.csv"
        
        if not (proto_emb_file.exists() and proto_meta_file.exists()):
            raise FileNotFoundError(
                f"Gallery files not found in '{gallery_dir}'. Please run build_gallery.py first."
            )
            
        self.prototype_embeddings = np.load(proto_emb_file) # (N_prototypes, 512)
        
        self.tiger_ids = []
        self.ref_images = []
        with open(proto_meta_file, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader)
            for row in reader:
                if len(row) >= 3:
                    self.tiger_ids.append(row[0])
                    self.ref_images.append(row[2])

    def extract_embedding(self, image: Image.Image) -> np.ndarray:
        """Extracts 512-D normalized embedding from PIL Image."""
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            emb = self.model.extract_features(tensor)
        return emb.cpu().numpy()[0]

    def identify(self, image_path: str, top_k: int = 5) -> Dict[str, Any]:
        """
        Identifies the individual tiger in the image against known catalogue.
        """
        img_path = Path(image_path)
        if not img_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
            
        img = Image.open(img_path).convert("RGB")
        query_emb = self.extract_embedding(img)
        
        # Cosine similarities: dot product since both are L2-normalized
        similarities = np.dot(self.prototype_embeddings, query_emb)
        
        # Rank by similarity descending
        ranked_indices = np.argsort(-similarities)
        
        candidates: List[Dict[str, Any]] = []
        for rank, idx in enumerate(ranked_indices[:top_k]):
            candidates.append({
                "rank": rank + 1,
                "tiger_id": self.tiger_ids[idx],
                "similarity": float(similarities[idx]),
                "representative_image": self.ref_images[idx]
            })
            
        top_match = candidates[0]
        is_known = top_match["similarity"] >= self.match_threshold
        
        result = {
            "query_image": str(img_path.resolve()),
            "status": "MATCHED" if is_known else "UNKNOWN_TIGER",
            "predicted_tiger_id": top_match["tiger_id"] if is_known else "UNKNOWN",
            "top_similarity": top_match["similarity"],
            "match_threshold": self.match_threshold,
            "top_candidates": candidates
        }
        return result


def main():
    parser = argparse.ArgumentParser(description="BaghNetra Tiger Identification Inference")
    parser.add_argument("--image", type=str, required=True, help="Path to tiger query image")
    parser.add_argument("--checkpoint", type=str, default="checkpoints/best_model.pth", help="Model checkpoint")
    parser.add_argument("--gallery_dir", type=str, default="gallery", help="Gallery directory")
    parser.add_argument("--threshold", type=float, default=0.70, help="Similarity threshold for matching")
    parser.add_argument("--top_k", type=int, default=5, help="Number of candidates to display")
    args = parser.parse_args()

    identifier = TigerIdentifier(
        checkpoint_path=args.checkpoint,
        gallery_dir=args.gallery_dir,
        match_threshold=args.threshold
    )

    result = identifier.identify(args.image, top_k=args.top_k)

    print("=" * 60)
    print(" BAGHNETRA TIGER RE-IDENTIFICATION RESULT")
    print("=" * 60)
    print(f"Query Image:         {result['query_image']}")
    print(f"Identification State:{result['status']}")
    print(f"Predicted Tiger ID:  {result['predicted_tiger_id']}")
    print(f"Top-1 Similarity:    {result['top_similarity']:.4f} (Threshold: {result['match_threshold']:.2f})")
    print("\nTop Candidates:")
    for cand in result["top_candidates"]:
        match_flag = "✓" if cand["rank"] == 1 and result["status"] == "MATCHED" else " "
        print(f"  [{cand['rank']}] Tiger_{cand['tiger_id']:<6} | Cosine Sim: {cand['similarity']:.4f} {match_flag}")
    print("=" * 60)


if __name__ == "__main__":
    main()
