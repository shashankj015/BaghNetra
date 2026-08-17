"""
BaghNetra Tiger Re-ID: Evaluation Metrics
Implements Rank-k (CMC) accuracy and Mean Average Precision (mAP) for open-set tiger retrieval.
"""

import torch
import numpy as np
from typing import Dict, List, Tuple


def compute_distance_matrix(query_features: torch.Tensor, gallery_features: torch.Tensor, metric: str = "cosine") -> np.ndarray:
    """
    Computes pairwise distance or similarity matrix between queries and gallery.
    
    Args:
        query_features: (N_q, D) query embedding matrix
        gallery_features: (N_g, D) gallery embedding matrix
        metric: 'cosine' (returns cosine distance 1 - cos_sim) or 'euclidean'
        
    Returns:
        dist_matrix: (N_q, N_g) distance matrix (smaller = more similar)
    """
    q_norm = torch.nn.functional.normalize(query_features, p=2, dim=1)
    g_norm = torch.nn.functional.normalize(gallery_features, p=2, dim=1)
    
    if metric == "cosine":
        # Cosine similarity in [-1, 1] -> Cosine distance in [0, 2]
        sim_matrix = torch.mm(q_norm, g_norm.t())
        dist_matrix = 1.0 - sim_matrix
    else:
        # Euclidean distance
        m, n = q_norm.size(0), g_norm.size(0)
        dist_matrix = (
            torch.pow(q_norm, 2).sum(dim=1, keepdim=True).expand(m, n) +
            torch.pow(g_norm, 2).sum(dim=1, keepdim=True).t().expand(m, n)
        )
        dist_matrix.addmm_(q_norm, g_norm.t(), beta=1, alpha=-2)
        dist_matrix = dist_matrix.clamp(min=1e-12).sqrt()
        
    return dist_matrix.cpu().numpy()


def evaluate_cmc_map(
    distmat: np.ndarray,
    query_pids: np.ndarray,
    gallery_pids: np.ndarray,
    top_k: List[int] = [1, 5, 10]
) -> Tuple[Dict[str, float], np.ndarray]:
    """
    Calculates Cumulative Matching Characteristics (CMC) Rank-k accuracies and Mean Average Precision (mAP).
    
    Args:
        distmat: (N_q, N_g) pairwise distance matrix
        query_pids: (N_q,) query identity IDs
        gallery_pids: (N_g,) gallery identity IDs
        top_k: list of rank values (e.g. [1, 5, 10])
        
    Returns:
        metrics: dict containing 'rank_1', 'rank_5', 'rank_10', 'mAP'
        cmc_curve: (max_rank,) array of CMC accuracy values
    """
    num_q, num_g = distmat.shape
    if num_g < max(top_k):
        max_rank = num_g
    else:
        max_rank = max(top_k)
        
    indices = np.argsort(distmat, axis=1)
    matches = (gallery_pids[indices] == query_pids[:, np.newaxis]).astype(np.int32)
    
    all_cmc = []
    all_AP = []
    num_valid_q = 0
    
    for q_idx in range(num_q):
        # Raw matches for this query across ranked gallery
        raw_cmc = matches[q_idx]
        if not np.any(raw_cmc):
            # Query identity has no matching identity in gallery
            continue
            
        num_valid_q += 1
        
        # 1. CMC Calculation
        cmc = raw_cmc.cumsum()
        cmc[cmc > 1] = 1
        all_cmc.append(cmc[:max_rank])
        
        # 2. Average Precision (AP) Calculation
        num_rel = raw_cmc.sum()
        tmp_cmc = raw_cmc.cumsum()
        tmp_cmc = [x / (i + 1.0) for i, x in enumerate(tmp_cmc)]
        tmp_cmc = np.array(tmp_cmc) * raw_cmc
        AP = tmp_cmc.sum() / num_rel
        all_AP.append(AP)
        
    if num_valid_q == 0:
        return {"rank_1": 0.0, "rank_5": 0.0, "mAP": 0.0}, np.zeros(max_rank)
        
    all_cmc = np.asarray(all_cmc).astype(np.float32)
    cmc_curve = all_cmc.sum(axis=0) / num_valid_q
    mAP = float(np.mean(all_AP)) * 100.0
    
    metrics = {
        "mAP": mAP,
    }
    for k in top_k:
        if k <= len(cmc_curve):
            metrics[f"rank_{k}"] = float(cmc_curve[k - 1]) * 100.0
            
    return metrics, cmc_curve
