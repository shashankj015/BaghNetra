"""
BaghNetra Tiger Re-ID: Dataset Sample & Crop Verification Visualizer
Generates side-by-side comparison grids of tiger flanks across identities and augmentations.
"""

import os
import sys
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from tiger_reid.datasets.atrw import ATRWReIDDataset
from tiger_reid.datasets.transforms import get_train_transforms, get_val_transforms

def unnormalize(tensor):
    """Reverts ImageNet normalization to RGB [0, 1] for matplotlib display."""
    mean = np.array([0.485, 0.456, 0.406]).reshape(3, 1, 1)
    std = np.array([0.229, 0.224, 0.225]).reshape(3, 1, 1)
    img_np = tensor.cpu().numpy() * std + mean
    img_np = np.clip(img_np, 0, 1)
    return np.transpose(img_np, (1, 2, 0))

def visualize_dataset_samples(output_path="tiger_reid/visualization/sample_crops_verification.png"):
    splits_csv = "tiger_reid/data/splits/train.csv"
    images_dir = "/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/re id/train"
    
    val_transform = get_val_transforms(image_size=(224, 224))
    train_transform = get_train_transforms(image_size=(224, 224))
    
    val_ds = ATRWReIDDataset(splits_csv, images_dir, transform=val_transform)
    train_ds = ATRWReIDDataset(splits_csv, images_dir, transform=train_transform)
    
    # Pick 4 distinct tigers, and 3 images per tiger
    target_labels = list(val_ds.label_to_indices.keys())[:4]
    
    fig, axes = plt.subplots(4, 6, figsize=(18, 12))
    plt.subplots_adjust(wspace=0.1, hspace=0.3)
    
    for row_idx, lbl in enumerate(target_labels):
        indices = val_ds.label_to_indices[lbl][:3]
        tiger_id_str = [k for k, v in val_ds.label_map.items() if v == lbl][0]
        
        # Display 3 clean images (cols 0, 1, 2)
        for col_idx, ds_idx in enumerate(indices):
            clean_tensor, _, path, _ = val_ds[ds_idx]
            clean_rgb = unnormalize(clean_tensor)
            
            ax = axes[row_idx, col_idx]
            ax.imshow(clean_rgb)
            ax.set_title(f"Tiger {tiger_id_str} (View {col_idx+1})", fontsize=10, fontweight='bold', color='#1e3a8a')
            ax.axis('off')
            
        # Display 3 augmented images (cols 3, 4, 5)
        for col_idx, ds_idx in enumerate(indices):
            aug_tensor, _, _, _ = train_ds[ds_idx]
            aug_rgb = unnormalize(aug_tensor)
            
            ax = axes[row_idx, col_idx + 3]
            ax.imshow(aug_rgb)
            ax.set_title(f"Augmented (V{col_idx+1})", fontsize=9, color='#047857')
            ax.axis('off')

    plt.suptitle("BaghNetra Tiger Re-ID: Sample Stripe Consistency & Stripe-Preserving Augmentations", fontsize=14, fontweight='bold', y=0.98)
    
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out_file, dpi=200, bbox_inches='tight')
    plt.close()
    print(f"Visualization saved to: {out_file.resolve()}")

if __name__ == "__main__":
    visualize_dataset_samples()
