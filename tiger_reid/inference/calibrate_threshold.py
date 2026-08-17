"""
BaghNetra Tiger Re-ID: Unknown Tiger Matching Threshold Calibration
Analyzes genuine vs impostor cosine similarity distributions and determines scientific MATCH_THRESHOLD.
"""

import os
import sys
import argparse
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import torch
from torch.utils.data import DataLoader

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from tiger_reid.datasets.atrw import ATRWReIDDataset
from tiger_reid.datasets.transforms import get_val_transforms
from tiger_reid.models.tiger_reid import TigerReIDNet
from tiger_reid.evaluation.evaluate import extract_all_embeddings


def calibrate_threshold(
    checkpoint_path: str = "checkpoints/best_model.pth",
    val_csv: str = "tiger_reid/data/splits/val_all.csv",
    images_dir: str = "/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/re id/train",
    output_fig: str = "tiger_reid/visualization/threshold_calibration.png"
) -> float:
    dev = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))
    print(f"Calibrating matching threshold using validation set ({val_csv}) on {dev}...")
    
    ckpt = torch.load(checkpoint_path, map_location=dev)
    config = ckpt.get("config", {})
    model_cfg = config.get("model", {})
    
    transform = get_val_transforms(image_size=(224, 224))
    dataset = ATRWReIDDataset(val_csv, images_dir, transform=transform)
    loader = DataLoader(dataset, batch_size=32, shuffle=False)
    
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
    
    embeddings, pids, _ = extract_all_embeddings(model, loader, dev)
    embs_norm = torch.nn.functional.normalize(embeddings, p=2, dim=1)
    
    # Compute full pairwise similarity matrix
    sim_mat = torch.mm(embs_norm, embs_norm.t()).numpy()
    
    n = len(pids)
    is_pos = (pids[:, None] == pids[None, :])
    is_neg = (pids[:, None] != pids[None, :])
    
    # Extract upper triangle without diagonal
    triu_idx = np.triu_indices(n, k=1)
    pos_sims = sim_mat[triu_idx][is_pos[triu_idx]]
    neg_sims = sim_mat[triu_idx][is_neg[triu_idx]]
    
    print(f"Pair Statistics on Hold-out Validation Set:")
    print(f"  Positive pairs (Same Tiger):      {len(pos_sims)} pairs | Mean Sim: {np.mean(pos_sims):.4f} | Std: {np.std(pos_sims):.4f}")
    print(f"  Negative pairs (Different Tigers): {len(neg_sims)} pairs | Mean Sim: {np.mean(neg_sims):.4f} | Std: {np.std(neg_sims):.4f}")
    
    # Evaluate FAR and FRR across thresholds
    thresholds = np.linspace(0.0, 1.0, 201)
    far_list = [] # False Acceptance Rate (impostors accepted)
    frr_list = [] # False Rejection Rate (genuines rejected)
    
    for th in thresholds:
        far = np.mean(neg_sims >= th) * 100.0
        frr = np.mean(pos_sims < th) * 100.0
        far_list.append(far)
        frr_list.append(frr)
        
    far_arr = np.array(far_list)
    frr_arr = np.array(frr_list)
    
    # Find Equal Error Rate (EER) threshold
    eer_idx = np.argmin(np.abs(far_arr - frr_arr))
    eer_threshold = float(thresholds[eer_idx])
    eer_value = float((far_arr[eer_idx] + frr_arr[eer_idx]) / 2.0)
    
    # Find High-Confidence threshold (where FAR <= 1.0%)
    low_far_indices = np.where(far_arr <= 1.0)[0]
    high_conf_threshold = float(thresholds[low_far_indices[0]]) if len(low_far_indices) > 0 else eer_threshold
    
    print("=" * 60)
    print(" MATCHING THRESHOLD CALIBRATION SUMMARY")
    print("=" * 60)
    print(f"Equal Error Rate (EER) Threshold: {eer_threshold:.3f} (Error: {eer_value:.2f}%)")
    print(f"Recommended High-Confidence Threshold (FAR <= 1%): {high_conf_threshold:.3f}")
    print("=" * 60)
    
    # Plot distributions & calibration curve
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # Distribution histogram
    ax1.hist(neg_sims, bins=50, alpha=0.6, color="#ef4444", density=True, label="Different Tigers (Impostors)")
    ax1.hist(pos_sims, bins=50, alpha=0.6, color="#10b981", density=True, label="Same Tiger (Genuines)")
    ax1.axvline(eer_threshold, color="#1e40af", linestyle="--", linewidth=2, label=f"EER Threshold ({eer_threshold:.2f})")
    ax1.axvline(high_conf_threshold, color="#7c3aed", linestyle="-.", linewidth=2, label=f"High-Conf ({high_conf_threshold:.2f})")
    ax1.set_xlabel("Cosine Similarity", fontsize=11)
    ax1.set_ylabel("Density", fontsize=11)
    ax1.set_title("Cosine Similarity Distribution (Hold-Out Identities)", fontsize=12, fontweight="bold")
    ax1.legend(frameon=True)
    ax1.grid(True, alpha=0.3)
    
    # FAR vs FRR curves
    ax2.plot(thresholds, far_arr, label="False Acceptance Rate (FAR %)", color="#dc2626", linewidth=2)
    ax2.plot(thresholds, frr_arr, label="False Rejection Rate (FRR %)", color="#2563eb", linewidth=2)
    ax2.axvline(eer_threshold, color="#1e40af", linestyle="--", label=f"EER ({eer_threshold:.2f})")
    ax2.set_xlabel("Matching Threshold", fontsize=11)
    ax2.set_ylabel("Error Rate (%)", fontsize=11)
    ax2.set_title("FAR vs. FRR Trade-off Curve", fontsize=12, fontweight="bold")
    ax2.legend(frameon=True)
    ax2.grid(True, alpha=0.3)
    
    plt.tight_layout()
    out = Path(output_fig)
    out.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out, dpi=200)
    plt.close()
    print(f"Calibration plot saved to: {out.resolve()}")
    
    return high_conf_threshold


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=str, default="checkpoints/best_model.pth")
    parser.add_argument("--val_csv", type=str, default="tiger_reid/data/splits/val_all.csv")
    args = parser.parse_args()
    
    calibrate_threshold(checkpoint_path=args.checkpoint, val_csv=args.val_csv)
