"""
BaghNetra Tiger Re-ID: Top-k Retrieval & Ranking Query Engine
"""

import torch
import numpy as np
from typing import List, Dict, Any

from .metrics import compute_distance_matrix


def retrieve_topk_matches(
    query_feats: torch.Tensor,
    gallery_feats: torch.Tensor,
    query_pids: np.ndarray,
    gallery_pids: np.ndarray,
    gallery_paths: List[str],
    top_k: int = 5,
    metric: str = "cosine"
) -> List[Dict[str, Any]]:
    """
    Ranks gallery images for each query and returns top-k structured matches.
    """
    # Normalized features
    q_norm = torch.nn.functional.normalize(query_feats, p=2, dim=1)
    g_norm = torch.nn.functional.normalize(gallery_feats, p=2, dim=1)
    
    # Cosine similarities
    sim_matrix = torch.mm(q_norm, g_norm.t()).cpu().numpy()
    
    results = []
    num_queries = len(query_pids)
    
    for q_idx in range(num_queries):
        sims = sim_matrix[q_idx]
        sorted_indices = np.argsort(-sims)
        
        q_pid = query_pids[q_idx]
        matches = []
        for rank, g_idx in enumerate(sorted_indices[:top_k]):
            g_pid = gallery_pids[g_idx]
            matches.append({
                "rank": rank + 1,
                "gallery_id": g_pid,
                "similarity": float(sims[g_idx]),
                "is_correct": bool(g_pid == q_pid),
                "gallery_path": gallery_paths[g_idx]
            })
            
        results.append({
            "query_index": q_idx,
            "query_id": q_pid,
            "top_matches": matches
        })
        
    return results
