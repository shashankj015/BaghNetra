"""
BaghNetra Tiger Re-ID: Training Script
Usage:
  python tiger_reid/training/train.py --config tiger_reid/configs/config.yaml
"""

import os
import sys
import yaml
import random
import argparse
from pathlib import Path

import torch
import numpy as np
from torch.utils.data import DataLoader

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from tiger_reid.datasets.atrw import (
    ATRWReIDDataset,
    BalancedIdentitySampler,
    create_leakage_safe_splits
)
from tiger_reid.datasets.transforms import get_train_transforms, get_val_transforms
from tiger_reid.models.tiger_reid import TigerReIDNet
from tiger_reid.training.trainer import ReIDTrainer


def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def select_device(preferred: str = "auto") -> torch.device:
    if preferred == "auto":
        if torch.backends.mps.is_available():
            return torch.device("mps")
        elif torch.cuda.is_available():
            return torch.device("cuda")
        else:
            return torch.device("cpu")
    else:
        return torch.device(preferred)


def main():
    parser = argparse.ArgumentParser(description="Train Tiger Re-ID Metric Learning Model")
    parser.add_argument("--config", type=str, default="tiger_reid/configs/config.yaml", help="Path to config file")
    parser.add_argument("--epochs", type=int, default=None, help="Override epoch count")
    parser.add_argument("--lr", type=float, default=None, help="Override learning rate")
    parser.add_argument("--exp_name", type=str, default="exp001", help="Experiment name")
    args = parser.parse_args()

    # 1. Load Configuration
    with open(args.config, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    if args.epochs is not None:
        config["training"]["epochs"] = args.epochs
    if args.lr is not None:
        config["training"]["learning_rate"] = args.lr

    # 2. Set Seed & Device
    seed = config["system"].get("seed", 42)
    set_seed(seed)
    device = select_device(config["system"].get("device", "auto"))
    print(f"Device: {device} | Seed: {seed} | Experiment: {args.exp_name}")

    # 3. Prepare Splits
    splits_dir = config["data"]["splits_dir"]
    train_csv = os.path.join(splits_dir, "train.csv")
    val_query_csv = os.path.join(splits_dir, "val_query.csv")
    val_gallery_csv = os.path.join(splits_dir, "val_gallery.csv")

    if not (os.path.exists(train_csv) and os.path.exists(val_query_csv) and os.path.exists(val_gallery_csv)):
        print("Generating leakage-safe dataset splits...")
        splits = create_leakage_safe_splits(
            anno_csv_path=config["data"]["train_anno_csv"],
            output_dir=splits_dir,
            val_identity_ratio=0.2,
            query_samples_per_id=2,
            seed=seed
        )
    else:
        print(f"Using existing splits from {splits_dir}")

    # 4. Datasets & Transforms
    img_size = tuple(config["data"]["image_size"])
    train_transforms = get_train_transforms(image_size=img_size)
    val_transforms = get_val_transforms(image_size=img_size)

    images_dir = config["data"]["train_images_dir"]
    train_dataset = ATRWReIDDataset(train_csv, images_dir, transform=train_transforms)
    val_query_dataset = ATRWReIDDataset(val_query_csv, images_dir, transform=val_transforms)
    val_gallery_dataset = ATRWReIDDataset(val_gallery_csv, images_dir, transform=val_transforms)

    print(f"Train Dataset:       {len(train_dataset)} images ({train_dataset.num_classes} identities)")
    print(f"Val Query Dataset:   {len(val_query_dataset)} probe images")
    print(f"Val Gallery Dataset: {len(val_gallery_dataset)} reference images")

    # 5. DataLoaders
    P = config["sampler"]["p_identities"]
    K = config["sampler"]["k_instances"]
    batch_sampler = BalancedIdentitySampler(train_dataset, p_identities=P, k_instances=K)
    
    num_workers = config["system"].get("num_workers", 2)
    train_loader = DataLoader(train_dataset, batch_sampler=batch_sampler, num_workers=num_workers)
    
    val_bs = config["evaluation"].get("batch_size", 32)
    val_query_loader = DataLoader(val_query_dataset, batch_size=val_bs, shuffle=False, num_workers=num_workers)
    val_gallery_loader = DataLoader(val_gallery_dataset, batch_size=val_bs, shuffle=False, num_workers=num_workers)

    # 6. Model Instantiation
    model_cfg = config["model"]
    model = TigerReIDNet(
        num_classes=train_dataset.num_classes,
        backbone_name=model_cfg.get("backbone", "resnet50"),
        pretrained=model_cfg.get("pretrained", True),
        embedding_dim=model_cfg.get("embedding_dim", 512),
        dropout_rate=model_cfg.get("dropout_rate", 0.1)
    )
    model.to(device)

    # 7. Trainer Execution
    exp_dir = os.path.join(config["training"]["experiments_dir"], args.exp_name)
    trainer = ReIDTrainer(
        model=model,
        train_loader=train_loader,
        val_query_loader=val_query_loader,
        val_gallery_loader=val_gallery_loader,
        config=config,
        device=device,
        experiment_dir=exp_dir
    )

    # Save copy of config in experiment dir
    os.makedirs(exp_dir, exist_ok=True)
    with open(os.path.join(exp_dir, "config.yaml"), "w", encoding="utf-8") as f:
        yaml.dump(config, f)

    trainer.fit()


if __name__ == "__main__":
    main()
