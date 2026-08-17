"""
BaghNetra Tiger Re-ID: ATRW Dataset & Sampler Implementation
Handles dataset loading, leakage-safe identity splitting, and P x K balanced identity sampling.
"""

import os
import csv
import json
import random
from pathlib import Path
from collections import defaultdict
from typing import List, Tuple, Dict, Optional

import torch
from torch.utils.data import Dataset, Sampler
from PIL import Image
import numpy as np


def create_leakage_safe_splits(
    anno_csv_path: str,
    output_dir: str,
    val_identity_ratio: float = 0.2,
    query_samples_per_id: int = 2,
    seed: int = 42
) -> Dict[str, str]:
    """
    Creates a strictly leakage-safe Train/Validation identity split.
    
    Identities in the Validation set never appear in the Training set.
    For the validation identities, images are partitioned into Query (probe)
    and Gallery (reference catalogue) to evaluate authentic open-set Re-ID retrieval.
    """
    random.seed(seed)
    np.random.seed(seed)
    
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    # 1. Read all annotated train records
    id_to_imgs = defaultdict(list)
    with open(anno_csv_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) >= 2:
                tiger_id, img_name = row[0].strip(), row[1].strip()
                id_to_imgs[tiger_id].append(img_name)
                
    unique_ids = sorted(list(id_to_imgs.keys()))
    num_total_ids = len(unique_ids)
    
    # Shuffle identities
    shuffled_ids = list(unique_ids)
    random.shuffle(shuffled_ids)
    
    num_val_ids = max(1, int(num_total_ids * val_identity_ratio))
    val_ids = set(shuffled_ids[:num_val_ids])
    train_ids = set(shuffled_ids[num_val_ids:])
    
    train_rows: List[Tuple[str, str]] = []
    val_all_rows: List[Tuple[str, str]] = []
    val_query_rows: List[Tuple[str, str]] = []
    val_gallery_rows: List[Tuple[str, str]] = []
    
    for tid in train_ids:
        for img in id_to_imgs[tid]:
            train_rows.append((tid, img))
            
    for tid in val_ids:
        imgs = list(id_to_imgs[tid])
        random.shuffle(imgs)
        # Allocate query vs gallery
        queries = imgs[:query_samples_per_id]
        gallery = imgs[query_samples_per_id:]
        
        for img in imgs:
            val_all_rows.append((tid, img))
        for img in queries:
            val_query_rows.append((tid, img))
        for img in gallery:
            val_gallery_rows.append((tid, img))
            
    # Save CSV files
    train_csv = out_path / "train.csv"
    val_all_csv = out_path / "val_all.csv"
    val_query_csv = out_path / "val_query.csv"
    val_gallery_csv = out_path / "val_gallery.csv"
    
    def save_csv(path: Path, rows: List[Tuple[str, str]]):
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            for r in rows:
                writer.writerow(r)
                
    save_csv(train_csv, train_rows)
    save_csv(val_all_csv, val_all_rows)
    save_csv(val_query_csv, val_query_rows)
    save_csv(val_gallery_csv, val_gallery_rows)
    
    print("=" * 60)
    print(" LEAKAGE-SAFE SPLIT GENERATION SUMMARY")
    print("=" * 60)
    print(f"Total Tiger Identities: {num_total_ids}")
    print(f"Train Identities:      {len(train_ids)} ({len(train_rows)} images)")
    print(f"Validation Identities: {len(val_ids)} ({len(val_all_rows)} images)")
    print(f"  - Validation Query:   {len(val_query_rows)} probe images ({query_samples_per_id} per tiger)")
    print(f"  - Validation Gallery: {len(val_gallery_rows)} reference images")
    print(f"Splits saved under:     {out_path.resolve()}")
    print("=" * 60)
    
    return {
        "train_csv": str(train_csv),
        "val_all_csv": str(val_all_csv),
        "val_query_csv": str(val_query_csv),
        "val_gallery_csv": str(val_gallery_csv)
    }


class ATRWReIDDataset(Dataset):
    """
    PyTorch Dataset for Amur Tiger Re-Identification.
    
    Returns:
        image: torch.Tensor of shape (3, H, W)
        label: int (contiguous identity label 0..C-1)
        image_path: str (absolute or relative path to the image file)
        tiger_id_str: str (original ATRW tiger ID string, e.g. "250")
    """
    def __init__(
        self,
        csv_path: str,
        images_dir: str,
        transform=None,
        label_map: Optional[Dict[str, int]] = None,
        keypoints_json: Optional[str] = None,
        use_keypoint_crop: bool = False
    ):
        self.images_dir = Path(images_dir)
        self.transform = transform
        self.use_keypoint_crop = use_keypoint_crop
        
        # Load keypoints if needed
        self.keypoints_dict = {}
        if keypoints_json and Path(keypoints_json).exists():
            with open(keypoints_json, "r", encoding="utf-8") as f:
                self.keypoints_dict = json.load(f)
                
        # Read dataset rows
        self.samples = [] # List of (img_path, tiger_id_str)
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 2:
                    tid, img_name = row[0].strip(), row[1].strip()
                    img_path = self.images_dir / img_name
                    if img_path.exists():
                        self.samples.append((str(img_path), tid, img_name))
                elif len(row) == 1:
                    img_name = row[0].strip()
                    img_path = self.images_dir / img_name
                    if img_path.exists():
                        self.samples.append((str(img_path), "UNKNOWN", img_name))
                        
        # Map IDs to contiguous integer labels
        if label_map is not None:
            self.label_map = label_map
        else:
            unique_ids = sorted(list(set(s[1] for s in self.samples if s[1] != "UNKNOWN")))
            self.label_map = {uid: idx for idx, uid in enumerate(unique_ids)}
            
        self.num_classes = len(self.label_map)
        
        # Build index mapping per class label for fast sampling
        self.label_to_indices = defaultdict(list)
        for idx, (_, tid, _) in enumerate(self.samples):
            if tid in self.label_map:
                lbl = self.label_map[tid]
                self.label_to_indices[lbl].append(idx)

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, str, str]:
        img_path_str, tid_str, img_name = self.samples[idx]
        
        # Load image via PIL (RGB)
        try:
            image = Image.open(img_path_str).convert("RGB")
        except Exception as e:
            # Fallback for unexpected I/O error
            image = Image.new("RGB", (224, 224), color=(128, 128, 128))
            
        # Optional tighter keypoint-derived flank cropping
        if self.use_keypoint_crop and img_name in self.keypoints_dict:
            kpts = self.keypoints_dict[img_name]
            if any(x > 0 for x in kpts):
                pts = np.array(kpts).reshape(-1, 3)
                vis_pts = pts[pts[:, 2] > 0]
                if len(vis_pts) > 0:
                    w, h = image.size
                    min_x, min_y = float(np.min(vis_pts[:, 0])), float(np.min(vis_pts[:, 1]))
                    max_x, max_y = float(np.max(vis_pts[:, 0])), float(np.max(vis_pts[:, 1]))
                    
                    # Expand bbox by 5% margin to preserve context
                    margin_x = (max_x - min_x) * 0.05
                    margin_y = (max_y - min_y) * 0.05
                    box = (
                        max(0, min_x - margin_x),
                        max(0, min_y - margin_y),
                        min(w, max_x + margin_x),
                        min(h, max_y + margin_y)
                    )
                    if box[2] > box[0] and box[3] > box[1]:
                        image = image.crop(box)
                        
        if self.transform is not None:
            image = self.transform(image)
            
        label = self.label_map.get(tid_str, -1)
        return image, label, img_path_str, tid_str


class BalancedIdentitySampler(Sampler):
    """
    P x K Identity Batch Sampler for Metric Learning & Triplet Mining.
    
    In each batch:
    - Exactly P unique tiger identities are selected.
    - Exactly K images are sampled for each identity.
    - Total batch size = P * K (e.g. 8 * 4 = 32).
    
    This guarantees that every anchor image has at least (K - 1) true positives
    and (P - 1) * K true negatives within its mini-batch for batch-hard triplet mining.
    """
    def __init__(self, dataset: ATRWReIDDataset, p_identities: int = 8, k_instances: int = 4):
        self.dataset = dataset
        self.p_identities = p_identities
        self.k_instances = k_instances
        self.batch_size = p_identities * k_instances
        
        self.label_to_indices = dataset.label_to_indices
        self.labels = [lbl for lbl, idxs in self.label_to_indices.items() if len(idxs) > 0]
        
        if len(self.labels) < self.p_identities:
            raise ValueError(
                f"Number of unique dataset identities ({len(self.labels)}) "
                f"is smaller than requested P ({self.p_identities})."
            )
            
        # Estimate number of iterations per epoch based on dataset size
        self.num_batches = max(1, len(dataset) // self.batch_size)

    def __iter__(self):
        for _ in range(self.num_batches):
            batch = []
            selected_labels = random.sample(self.labels, self.p_identities)
            for lbl in selected_labels:
                indices = self.label_to_indices[lbl]
                if len(indices) >= self.k_instances:
                    selected_indices = random.sample(indices, self.k_instances)
                else:
                    # Sample with replacement if count < K
                    selected_indices = random.choices(indices, k=self.k_instances)
                batch.extend(selected_indices)
            yield batch

    def __len__(self) -> int:
        return self.num_batches
