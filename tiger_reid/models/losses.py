"""
BaghNetra Tiger Re-ID: Loss Functions & Batch-Hard Triplet Mining
Implements Batch-Hard Triplet Loss, Cross-Entropy Loss, and Combined Objective.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


def pairwise_euclidean_distance(embeddings: torch.Tensor, squared: bool = False, eps: float = 1e-12) -> torch.Tensor:
    """
    Computes pairwise Euclidean distance matrix between all pairs in the batch.
    
    Args:
        embeddings: Tensor of shape (B, D)
        squared: If True, returns squared Euclidean distance
        eps: Small epsilon for numerical stability in sqrt gradient
        
    Returns:
        dist_mat: Tensor of shape (B, B) where dist_mat[i, j] = ||e_i - e_j||_2
    """
    # ||a - b||^2 = ||a||^2 + ||b||^2 - 2 <a, b>
    dot_product = torch.matmul(embeddings, embeddings.t())
    square_norm = torch.diag(dot_product)
    
    dist_sq = square_norm.unsqueeze(0) - 2.0 * dot_product + square_norm.unsqueeze(1)
    dist_sq = F.relu(dist_sq) # Clamp negative values caused by floating point precision
    
    if squared:
        return dist_sq
    else:
        # Stable sqrt gradient
        mask = (dist_sq == 0.0).float()
        dist_mat = torch.sqrt(dist_sq + mask * eps)
        dist_mat = dist_mat * (1.0 - mask)
        return dist_mat


class BatchHardTripletLoss(nn.Module):
    """
    Batch-Hard Triplet Loss with online mining of hardest positive and negative pairs.
    
    For every anchor image i:
      - Hardest Positive (d_ap): max distance between anchor i and all other images j with same tiger ID.
      - Hardest Negative (d_an): min distance between anchor i and all images k with different tiger ID.
      
    Loss:
      L = (1/N) * sum_i max(0, d_ap - d_an + margin)
    """
    def __init__(self, margin: float = 0.3, distance_metric: str = "euclidean"):
        super(BatchHardTripletLoss, self).__init__()
        self.margin = margin
        self.distance_metric = distance_metric

    def forward(self, embeddings: torch.Tensor, labels: torch.Tensor) -> torch.Tensor:
        """
        Args:
            embeddings: (B, D) L2-normalized feature embeddings
            labels: (B,) Identity class labels
        """
        device = embeddings.device
        n = embeddings.size(0)
        
        # 1. Compute pairwise distance matrix (B, B)
        dist_mat = pairwise_euclidean_distance(embeddings)
        
        # 2. Build identity comparison masks
        is_pos = labels.unsqueeze(0) == labels.unsqueeze(1) # (B, B)
        is_neg = labels.unsqueeze(0) != labels.unsqueeze(1) # (B, B)
        
        # Exclude self-comparisons (diagonal) from positives
        eye = torch.eye(n, dtype=torch.bool, device=device)
        is_pos = is_pos & (~eye)
        
        # 3. Hardest Positive Mining: For each anchor i, find max distance among same tiger images
        # Replace non-positives with -infinity before computing max
        dist_ap = dist_mat.clone()
        dist_ap[~is_pos] = -1e9
        hardest_pos_dist, _ = torch.max(dist_ap, dim=1)
        
        # 4. Hardest Negative Mining: For each anchor i, find min distance among different tiger images
        # Replace non-negatives with +infinity before computing min
        dist_an = dist_mat.clone()
        dist_an[~is_neg] = 1e9
        hardest_neg_dist, _ = torch.min(dist_an, dim=1)
        
        # 5. Triplet Loss Calculation
        triplet_loss = F.relu(hardest_pos_dist - hardest_neg_dist + self.margin)
        
        # Average over valid anchors (anchors that have at least 1 positive and 1 negative)
        valid_anchors = (is_pos.sum(dim=1) > 0) & (is_neg.sum(dim=1) > 0)
        if valid_anchors.sum() > 0:
            loss = triplet_loss[valid_anchors].mean()
        else:
            loss = triplet_loss.mean()
            
        return loss


class CombinedReIDLoss(nn.Module):
    """
    Combined Identity Classification Loss + Batch-Hard Triplet Metric Loss.
    
    total_loss = classification_loss + lambda_triplet * triplet_loss
    """
    def __init__(
        self,
        margin: float = 0.3,
        triplet_weight: float = 1.0,
        classification_weight: float = 1.0,
        label_smoothing: float = 0.1
    ):
        super(CombinedReIDLoss, self).__init__()
        self.triplet_weight = triplet_weight
        self.classification_weight = classification_weight
        
        self.ce_loss = nn.CrossEntropyLoss(label_smoothing=label_smoothing)
        self.triplet_loss = BatchHardTripletLoss(margin=margin)

    def forward(
        self,
        logits: torch.Tensor,
        embeddings: torch.Tensor,
        labels: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Returns:
            total_loss: scalar tensor
            cls_loss: scalar tensor
            triplet_loss: scalar tensor
        """
        cls_loss = self.ce_loss(logits, labels) if logits is not None else torch.tensor(0.0, device=embeddings.device)
        tri_loss = self.triplet_loss(embeddings, labels)
        
        total_loss = self.classification_weight * cls_loss + self.triplet_weight * tri_loss
        return total_loss, cls_loss, tri_loss
