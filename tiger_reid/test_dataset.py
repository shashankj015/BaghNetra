"""
Unit test to verify STEP 2: PyTorch Dataset, Leakage-Safe Splitting, and P x K Sampler.
"""

import os
import sys
from pathlib import Path
import torch
from torch.utils.data import DataLoader
from collections import Counter

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tiger_reid.datasets.atrw import (
    ATRWReIDDataset,
    BalancedIdentitySampler,
    create_leakage_safe_splits
)
from tiger_reid.datasets.transforms import get_train_transforms, get_val_transforms

def test_pipeline():
    raw_anno_csv = "/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/re id/atrw_anno_reid_train/reid_list_train.csv"
    images_dir = "/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/re id/train"
    splits_dir = "/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/tiger_reid/data/splits"

    print("--- 1. Testing Leakage-Safe Split Creation ---")
    splits = create_leakage_safe_splits(
        anno_csv_path=raw_anno_csv,
        output_dir=splits_dir,
        val_identity_ratio=0.2,
        seed=42
    )

    print("\n--- 2. Testing ATRWReIDDataset (Train & Val) ---")
    train_transform = get_train_transforms(image_size=(224, 224))
    val_transform = get_val_transforms(image_size=(224, 224))

    train_dataset = ATRWReIDDataset(
        csv_path=splits["train_csv"],
        images_dir=images_dir,
        transform=train_transform
    )

    val_dataset = ATRWReIDDataset(
        csv_path=splits["val_all_csv"],
        images_dir=images_dir,
        transform=val_transform
    )

    print(f"Train dataset size: {len(train_dataset)} images, {train_dataset.num_classes} identities")
    print(f"Val dataset size:   {len(val_dataset)} images, {val_dataset.num_classes} identities")

    # Verify zero identity overlap
    train_ids = set(train_dataset.label_map.keys())
    val_ids = set(val_dataset.label_map.keys())
    overlap = train_ids.intersection(val_ids)
    print(f"Train / Val Identity Overlap: {len(overlap)} (Must be 0)")
    assert len(overlap) == 0, f"DATA LEAKAGE DETECTED! Overlapping IDs: {overlap}"

    # Verify single sample retrieval
    sample_img, sample_lbl, sample_path, sample_tid = train_dataset[0]
    print(f"\nSingle Sample Inspection:")
    print(f"  Tensor shape: {sample_img.shape} (dtype: {sample_img.dtype})")
    print(f"  Label ID:     {sample_lbl} (Original Tiger ID: {sample_tid})")
    print(f"  Image path:   {sample_path}")
    assert sample_img.shape == (3, 224, 224), f"Unexpected shape {sample_img.shape}"
    assert isinstance(sample_lbl, int), "Label should be integer"

    print("\n--- 3. Testing BalancedIdentitySampler (P=8, K=4) ---")
    P = 8
    K = 4
    batch_sampler = BalancedIdentitySampler(train_dataset, p_identities=P, k_instances=K)
    train_loader = DataLoader(
        train_dataset,
        batch_sampler=batch_sampler,
        num_workers=0
    )

    print(f"Number of batches per epoch: {len(train_loader)} (Batch size = {P*K})")
    
    # Check first 3 batches
    for b_idx, (imgs, labels, paths, tids) in enumerate(train_loader):
        if b_idx >= 3:
            break
        label_counts = Counter(labels.tolist())
        print(f"  Batch {b_idx + 1}: Shape = {imgs.shape} | Unique Identities = {len(label_counts)} | Samples/Identity = {list(label_counts.values())}")
        assert imgs.shape[0] == P * K, f"Expected batch size {P*K}, got {imgs.shape[0]}"
        assert len(label_counts) == P, f"Expected {P} unique identities, got {len(label_counts)}"
        assert all(c == K for c in label_counts.values()), f"Expected exactly {K} samples per identity"

    print("\n" + "=" * 60)
    print(" ALL DATASET & SAMPLER TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_pipeline()
