"""
BaghNetra Tiger Re-ID: Model Trainer Engine
Orchestrates training epochs, metric learning optimization, validation evaluation, and checkpoint saving.
"""

import os
import json
import time
import csv
from pathlib import Path
from typing import Dict, Any

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from tqdm import tqdm

from tiger_reid.evaluation.evaluate import evaluate_reid_performance
from tiger_reid.models.losses import CombinedReIDLoss


class ReIDTrainer:
    """
    Trainer class for Metric Learning Tiger Re-ID.
    """
    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_query_loader: DataLoader,
        val_gallery_loader: DataLoader,
        config: Dict[str, Any],
        device: torch.device,
        experiment_dir: str = "experiments/exp001"
    ):
        self.model = model
        self.train_loader = train_loader
        self.val_query_loader = val_query_loader
        self.val_gallery_loader = val_gallery_loader
        self.config = config
        self.device = device
        
        self.exp_dir = Path(experiment_dir)
        self.exp_dir.mkdir(parents=True, exist_ok=True)
        
        self.checkpoints_dir = Path(config["training"].get("checkpoint_dir", "checkpoints"))
        self.checkpoints_dir.mkdir(parents=True, exist_ok=True)
        
        # Criterion
        loss_cfg = config.get("loss", {})
        self.criterion = CombinedReIDLoss(
            margin=loss_cfg.get("margin", 0.3),
            triplet_weight=loss_cfg.get("triplet_weight", 1.0),
            classification_weight=loss_cfg.get("classification_weight", 1.0),
            label_smoothing=loss_cfg.get("label_smoothing", 0.1)
        )
        
        # Optimizer
        train_cfg = config.get("training", {})
        lr = float(train_cfg.get("learning_rate", 3e-4))
        wd = float(train_cfg.get("weight_decay", 1e-4))
        self.optimizer = optim.AdamW(self.model.parameters(), lr=lr, weight_decay=wd)
        
        # Scheduler
        self.epochs = int(train_cfg.get("epochs", 30))
        self.scheduler = optim.lr_scheduler.CosineAnnealingLR(
            self.optimizer,
            T_max=self.epochs,
            eta_min=float(train_cfg.get("min_lr", 1e-6))
        )
        
        # Tracking & Early Stopping
        self.best_mAP = 0.0
        self.best_epoch = 0
        self.patience = int(train_cfg.get("early_stopping_patience", 10))
        self.patience_counter = 0
        
        self.history = {
            "epoch": [],
            "train_loss": [],
            "cls_loss": [],
            "triplet_loss": [],
            "train_acc": [],
            "val_rank_1": [],
            "val_rank_5": [],
            "val_mAP": [],
            "lr": []
        }

    def train_epoch(self, epoch: int) -> Dict[str, float]:
        self.model.train()
        total_loss_sum = 0.0
        cls_loss_sum = 0.0
        tri_loss_sum = 0.0
        correct_preds = 0
        total_samples = 0
        
        pbar = tqdm(self.train_loader, desc=f"Epoch {epoch:02d}/{self.epochs:02d}", leave=False)
        for imgs, labels, _, _ in pbar:
            imgs = imgs.to(self.device)
            labels = labels.to(self.device)
            
            self.optimizer.zero_grad()
            logits, norm_emb, _ = self.model(imgs)
            loss, cls_l, tri_l = self.criterion(logits, norm_emb, labels)
            
            loss.backward()
            self.optimizer.step()
            
            bs = imgs.size(0)
            total_loss_sum += loss.item() * bs
            cls_loss_sum += cls_l.item() * bs
            tri_loss_sum += tri_l.item() * bs
            
            preds = torch.argmax(logits, dim=1)
            correct_preds += (preds == labels).sum().item()
            total_samples += bs
            
            pbar.set_postfix({
                "loss": f"{loss.item():.3f}",
                "cls": f"{cls_l.item():.3f}",
                "tri": f"{tri_l.item():.3f}",
                "acc": f"{(correct_preds/total_samples)*100:.1f}%"
            })
            
        return {
            "train_loss": total_loss_sum / total_samples,
            "cls_loss": cls_loss_sum / total_samples,
            "triplet_loss": tri_loss_sum / total_samples,
            "train_acc": (correct_preds / total_samples) * 100.0
        }

    def fit(self) -> Dict[str, Any]:
        print("=" * 70)
        print(f" STARTING BAGHNETRA TIGER RE-ID TRAINING ({self.epochs} Epochs on {self.device})")
        print("=" * 70)
        
        for epoch in range(1, self.epochs + 1):
            t0 = time.time()
            train_metrics = self.train_epoch(epoch)
            current_lr = self.optimizer.param_groups[0]["lr"]
            self.scheduler.step()
            
            # Evaluate open-set retrieval on hold-out validation identities
            val_metrics = evaluate_reid_performance(
                model=self.model,
                query_loader=self.val_query_loader,
                gallery_loader=self.val_gallery_loader,
                device=self.device,
                metric="cosine"
            )
            
            elapsed = time.time() - t0
            
            # Log history
            self.history["epoch"].append(epoch)
            self.history["train_loss"].append(train_metrics["train_loss"])
            self.history["cls_loss"].append(train_metrics["cls_loss"])
            self.history["triplet_loss"].append(train_metrics["triplet_loss"])
            self.history["train_acc"].append(train_metrics["train_acc"])
            self.history["val_rank_1"].append(val_metrics.get("rank_1", 0.0))
            self.history["val_rank_5"].append(val_metrics.get("rank_5", 0.0))
            self.history["val_mAP"].append(val_metrics.get("mAP", 0.0))
            self.history["lr"].append(current_lr)
            
            print(
                f"Epoch {epoch:02d}/{self.epochs:02d} [{elapsed:.1f}s] | "
                f"Train Loss: {train_metrics['train_loss']:.4f} (Acc: {train_metrics['train_acc']:.1f}%) | "
                f"Val Rank-1: {val_metrics['rank_1']:.1f}% | Val Rank-5: {val_metrics['rank_5']:.1f}% | "
                f"Val mAP: {val_metrics['mAP']:.1f}% | LR: {current_lr:.6f}"
            )
            
            # Check for best model
            is_best = val_metrics["mAP"] > self.best_mAP
            if is_best:
                self.best_mAP = val_metrics["mAP"]
                self.best_epoch = epoch
                self.patience_counter = 0
                self.save_checkpoint("best_model.pth", epoch, val_metrics)
                print(f"  >>> Best model saved! (Val mAP: {self.best_mAP:.2f}%)")
            else:
                self.patience_counter += 1
                
            # Always save latest
            self.save_checkpoint("latest_model.pth", epoch, val_metrics)
            
            # Early stopping check
            if self.patience_counter >= self.patience:
                print(f"\nEarly stopping triggered after {self.patience} epochs without validation improvement.")
                break

        print("=" * 70)
        print(f" TRAINING COMPLETE | Best Epoch: {self.best_epoch} | Best Val mAP: {self.best_mAP:.2f}%")
        print("=" * 70)
        
        self.save_history()
        return self.history

    def save_checkpoint(self, filename: str, epoch: int, val_metrics: Dict[str, float]):
        ckpt_path = self.checkpoints_dir / filename
        exp_ckpt_path = self.exp_dir / filename
        
        payload = {
            "epoch": epoch,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "val_metrics": val_metrics,
            "config": self.config
        }
        torch.save(payload, ckpt_path)
        torch.save(payload, exp_ckpt_path)

    def save_history(self):
        # Save JSON
        json_path = self.exp_dir / "training_history.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(self.history, f, indent=2)
            
        # Save CSV
        csv_path = self.exp_dir / "metrics.csv"
        keys = list(self.history.keys())
        rows = zip(*[self.history[k] for k in keys])
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(keys)
            writer.writerows(rows)
