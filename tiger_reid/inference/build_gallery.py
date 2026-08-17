"""
BaghNetra Tiger Re-ID: Gallery & Biometric Tiger Catalogue Builder
Extracts embeddings, computes normalized prototype vectors per tiger identity, and saves gallery metadata.
"""

import os
import sys
import csv
import argparse
from pathlib import Path
from collections import defaultdict

import torch
import numpy as np
from torch.utils.data import DataLoader
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from tiger_reid.datasets.atrw import ATRWReIDDataset
from tiger_reid.datasets.transforms import get_val_transforms
from tiger_reid.models.tiger_reid import TigerReIDNet
from tiger_reid.evaluation.evaluate import extract_all_embeddings


def build_tiger_gallery(
    checkpoint_path: str = "checkpoints/best_model.pth",
    gallery_csv: str = "tiger_reid/data/splits/val_gallery.csv",
    images_dir: str = "/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/re id/train",
    output_dir: str = "gallery",
    device: str = "auto"
):
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    dev = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")) if device == "auto" else torch.device(device)
    print(f"Building tiger gallery using model: {checkpoint_path} on {dev}")
    
    # 1. Load Checkpoint
    ckpt = torch.load(checkpoint_path, map_location=dev)
    config = ckpt.get("config", {})
    
    # Load dataset to determine num classes
    transform = get_val_transforms(image_size=(224, 224))
    dataset = ATRWReIDDataset(gallery_csv, images_dir, transform=transform)
    loader = DataLoader(dataset, batch_size=32, shuffle=False, num_workers=2)
    
    # Build model and load weights
    model_cfg = config.get("model", {})
    num_classes = len(ckpt["model_state_dict"]["classifier.weight"]) if "classifier.weight" in ckpt["model_state_dict"] else 0
    
    model = TigerReIDNet(
        num_classes=num_classes,
        backbone_name=model_cfg.get("backbone", "resnet50"),
        pretrained=False,
        embedding_dim=model_cfg.get("embedding_dim", 512),
        dropout_rate=0.0
    )
    model.load_state_dict(ckpt["model_state_dict"])
    model.to(dev)
    model.eval()
    
    # 2. Extract Embeddings
    print(f"Extracting embeddings for {len(dataset)} gallery images across {dataset.num_classes} identities...")
    embs, pids, paths = extract_all_embeddings(model, loader, dev)
    embs_np = embs.numpy()
    
    # 3. Save All Individual Gallery Images
    all_emb_file = out_path / "all_gallery_embeddings.npy"
    np.save(all_emb_file, embs_np)
    
    all_meta_file = out_path / "all_gallery_metadata.csv"
    with open(all_meta_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["tiger_id", "image_path"])
        for pid, path in zip(pids, paths):
            writer.writerow([pid, path])
            
    # 4. Compute Normalized Tiger Prototype Vectors (Mean per Identity)
    id_to_embs = defaultdict(list)
    id_to_paths = defaultdict(list)
    for emb, pid, path in zip(embs_np, pids, paths):
        id_to_embs[pid].append(emb)
        id_to_paths[pid].append(path)
        
    prototype_ids = sorted(list(id_to_embs.keys()))
    prototype_vectors = []
    proto_meta_rows = []
    
    for pid in prototype_ids:
        vecs = np.array(id_to_embs[pid])
        mean_vec = np.mean(vecs, axis=0)
        norm_vec = mean_vec / (np.linalg.norm(mean_vec) + 1e-12)
        prototype_vectors.append(norm_vec)
        proto_meta_rows.append([pid, len(vecs), id_to_paths[pid][0]])
        
    prototype_matrix = np.array(prototype_vectors, dtype=np.float32)
    proto_emb_file = out_path / "prototype_embeddings.npy"
    np.save(proto_emb_file, prototype_matrix)
    
    proto_meta_file = out_path / "prototype_metadata.csv"
    with open(proto_meta_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["tiger_id", "num_reference_images", "representative_image"])
        for row in proto_meta_rows:
            writer.writerow(row)
            
    print("=" * 60)
    print(" TIGER GALLERY SUCCESSFULLY BUILT")
    print("=" * 60)
    print(f"Total Unique Tigers Registered: {len(prototype_ids)}")
    print(f"Total Reference Images Indexed:  {len(paths)}")
    print(f"Prototypes saved to:            {proto_emb_file.resolve()}")
    print(f"Prototype metadata:             {proto_meta_file.resolve()}")
    print("=" * 60)


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
