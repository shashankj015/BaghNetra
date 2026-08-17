"""
BaghNetra Tiger Re-ID: Retrieval Visualizer & Experiment Curves
Generates visual retrieval cards and training/validation metric curves.
"""

import os
import sys
import json
import argparse
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from tiger_reid.datasets.atrw import ATRWReIDDataset
from tiger_reid.datasets.transforms import get_val_transforms
from tiger_reid.models.tiger_reid import TigerReIDNet
from tiger_reid.evaluation.evaluate import extract_all_embeddings
from tiger_reid.evaluation.retrieval import retrieve_topk_matches
from torch.utils.data import DataLoader


def plot_training_curves(history_file: str, output_path: str = "tiger_reid/visualization/training_curves.png"):
    with open(history_file, "r", encoding="utf-8") as f:
        hist = json.load(f)
        
    epochs = hist["epoch"]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # 1. Loss curves
    ax1.plot(epochs, hist["train_loss"], label="Total Loss", color="#1e40af", linewidth=2)
    ax1.plot(epochs, hist["cls_loss"], label="Classification Loss", color="#059669", linestyle="--")
    ax1.plot(epochs, hist["triplet_loss"], label="Triplet Loss", color="#dc2626", linestyle=":")
    ax1.set_xlabel("Epoch", fontsize=11)
    ax1.set_ylabel("Loss", fontsize=11)
    ax1.set_title("Metric Learning Loss Convergence", fontsize=12, fontweight="bold")
    ax1.grid(True, alpha=0.3)
    ax1.legend(frameon=True)
    
    # 2. Validation Re-ID Metrics
    ax2.plot(epochs, hist["val_mAP"], label="Val mAP (%)", color="#7c3aed", linewidth=2)
    ax2.plot(epochs, hist["val_rank_1"], label="Val Rank-1 (%)", color="#2563eb", linewidth=2)
    ax2.plot(epochs, hist["val_rank_5"], label="Val Rank-5 (%)", color="#10b981", linestyle="--")
    ax2.set_xlabel("Epoch", fontsize=11)
    ax2.set_ylabel("Metric (%)", fontsize=11)
    ax2.set_title("Open-Set Re-ID Validation Performance", fontsize=12, fontweight="bold")
    ax2.grid(True, alpha=0.3)
    ax2.legend(frameon=True)
    
    plt.tight_layout()
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out, dpi=200)
    plt.close()
    print(f"Training curves saved to: {out.resolve()}")


def visualize_retrieval_grid(
    checkpoint_path: str = "checkpoints/best_model.pth",
    query_csv: str = "tiger_reid/data/splits/val_query.csv",
    gallery_csv: str = "tiger_reid/data/splits/val_gallery.csv",
    images_dir: str = "/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/re id/train",
    num_queries: int = 4,
    output_path: str = "tiger_reid/visualization/retrieval_results.png"
):
    dev = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))
    ckpt = torch.load(checkpoint_path, map_location=dev)
    config = ckpt.get("config", {})
    model_cfg = config.get("model", {})
    
    transform = get_val_transforms(image_size=(224, 224))
    query_ds = ATRWReIDDataset(query_csv, images_dir, transform=transform)
    gallery_ds = ATRWReIDDataset(gallery_csv, images_dir, transform=transform)
    
    q_loader = DataLoader(query_ds, batch_size=32, shuffle=False)
    g_loader = DataLoader(gallery_ds, batch_size=32, shuffle=False)
    
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
    
    q_feats, q_pids, q_paths = extract_all_embeddings(model, q_loader, dev)
    g_feats, g_pids, g_paths = extract_all_embeddings(model, g_loader, dev)
    
    results = retrieve_topk_matches(q_feats, g_feats, q_pids, g_pids, g_paths, top_k=5)
    
    fig, axes = plt.subplots(num_queries, 6, figsize=(18, 3.2 * num_queries))
    plt.subplots_adjust(wspace=0.2, hspace=0.4)
    
    for row in range(min(num_queries, len(results))):
        res = results[row]
        q_path = q_paths[res["query_index"]]
        q_id = res["query_id"]
        
        # Query image
        ax_q = axes[row, 0] if num_queries > 1 else axes[0]
        q_img = Image.open(q_path).convert("RGB")
        ax_q.imshow(q_img)
        ax_q.set_title(f"QUERY\nTiger ID: {q_id}", fontsize=10, fontweight="bold", color="#1e40af")
        for spine in ax_q.spines.values():
            spine.set_edgecolor("#2563eb")
            spine.set_linewidth(3)
        ax_q.set_xticks([])
        ax_q.set_yticks([])
        
        # Top 5 gallery retrievals
        for col, match in enumerate(res["top_matches"]):
            ax_g = axes[row, col + 1] if num_queries > 1 else axes[col + 1]
            g_img = Image.open(match["gallery_path"]).convert("RGB")
            ax_g.imshow(g_img)
            
            border_color = "#10b981" if match["is_correct"] else "#ef4444"
            status_text = "MATCH ✓" if match["is_correct"] else "MISMATCH ✗"
            
            ax_g.set_title(
                f"Rank {match['rank']}: ID {match['gallery_id']}\nSim: {match['similarity']:.3f} | {status_text}",
                fontsize=9,
                fontweight="bold",
                color=border_color
            )
            for spine in ax_g.spines.values():
                spine.set_edgecolor(border_color)
                spine.set_linewidth(3)
            ax_g.set_xticks([])
            ax_g.set_yticks([])

    plt.suptitle("BaghNetra Tiger Re-ID: Query Retrieval vs Gallery (Rank-1 to Rank-5)", fontsize=14, fontweight="bold", y=0.99)
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out, dpi=200, bbox_inches="tight")
    plt.close()
    print(f"Retrieval grid visualization saved to: {out.resolve()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--history", type=str, default="experiments/exp001/training_history.json")
    parser.add_argument("--checkpoint", type=str, default="checkpoints/best_model.pth")
    args = parser.parse_args()
    
    if os.path.exists(args.history):
        plot_training_curves(args.history)
    if os.path.exists(args.checkpoint):
        visualize_retrieval_grid(checkpoint_path=args.checkpoint)
