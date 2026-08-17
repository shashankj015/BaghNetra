"""
STEP 6 Verification: Overfitting test on a tiny subset to verify loss optimization & metric learning gradient flow.
"""

import sys
from pathlib import Path
import torch
import torch.optim as optim
from torch.utils.data import DataLoader

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tiger_reid.datasets.atrw import ATRWReIDDataset, BalancedIdentitySampler
from tiger_reid.datasets.transforms import get_val_transforms
from tiger_reid.models.tiger_reid import TigerReIDNet
from tiger_reid.models.losses import CombinedReIDLoss

def run_overfit_test():
    print("=" * 60)
    print(" STEP 6: PIPELINE OVERFITTING & GRADIENT FLOW TEST")
    print("=" * 60)
    
    device = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))
    print(f"Using compute device: {device}")
    
    splits_csv = "tiger_reid/data/splits/train.csv"
    images_dir = "/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/re id/train"
    
    transform = get_val_transforms(image_size=(224, 224))
    dataset = ATRWReIDDataset(splits_csv, images_dir, transform=transform)
    
    # 4 identities, 4 images each = 16 images
    P, K = 4, 4
    sampler = BalancedIdentitySampler(dataset, p_identities=P, k_instances=K)
    loader = DataLoader(dataset, batch_sampler=sampler)
    
    # Grab one fixed batch
    fixed_imgs, fixed_labels, _, _ = next(iter(loader))
    fixed_imgs, fixed_labels = fixed_imgs.to(device), fixed_labels.to(device)
    
    print(f"Overfitting on batch of {len(fixed_imgs)} images across {len(torch.unique(fixed_labels))} identities...")
    
    model = TigerReIDNet(num_classes=dataset.num_classes, backbone_name="resnet50", pretrained=True, embedding_dim=512)
    model.to(device)
    model.train()
    
    criterion = CombinedReIDLoss(margin=0.3, triplet_weight=1.0, classification_weight=1.0)
    optimizer = optim.AdamW(model.parameters(), lr=0.001, weight_decay=1e-4)
    
    initial_loss = None
    for step in range(1, 26):
        optimizer.zero_grad()
        logits, norm_emb, _ = model(fixed_imgs)
        loss, cls_l, tri_l = criterion(logits, norm_emb, fixed_labels)
        loss.backward()
        optimizer.step()
        
        if initial_loss is None:
            initial_loss = loss.item()
            
        preds = torch.argmax(logits, dim=1)
        acc = (preds == fixed_labels).float().mean().item() * 100.0
        
        if step % 5 == 0 or step == 1:
            print(f"  Step {step:02d} | Total Loss: {loss.item():.4f} (Cls: {cls_l.item():.4f}, Triplet: {tri_l.item():.4f}) | Batch Acc: {acc:.1f}%")

    final_loss = loss.item()
    print(f"\nInitial Loss: {initial_loss:.4f} -> Final Loss: {final_loss:.4f}")
    assert final_loss < initial_loss * 0.5, "Loss did not decrease sufficiently in overfit test!"
    assert acc >= 90.0, "Accuracy did not reach target threshold in overfit test!"
    
    print("=" * 60)
    print(" STEP 6 VERIFIED: Training pipeline, gradient updates, and loss functions work correctly!")
    print("=" * 60)

if __name__ == "__main__":
    run_overfit_test()
