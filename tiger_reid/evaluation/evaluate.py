"""
BaghNetra Tiger Re-ID: Evaluation Protocol
Extracts feature embeddings and evaluates open-set Rank-1, Rank-5, and mAP performance.
"""

import torch
import numpy as np
from torch.utils.data import DataLoader
from typing import Dict, Tuple

from .metrics import compute_distance_matrix, evaluate_cmc_map


def extract_all_embeddings(model: torch.nn.Module, data_loader: DataLoader, device: torch.device) -> Tuple[torch.Tensor, np.ndarray, list]:
    """
    Extracts 512-D L2-normalized embeddings for all images in the loader.
    
    Returns:
        embeddings: (N, 512) tensor
        pids: (N,) numpy array of tiger IDs
        paths: list of image paths
    """
    model.eval()
    all_embeddings = []
    all_pids = []
    all_paths = []
    
    with torch.no_grad():
        for imgs, _, paths, tids in data_loader:
            imgs = imgs.to(device)
            embeddings = model.extract_features(imgs)
            all_embeddings.append(embeddings.cpu())
            all_pids.extend(tids)
            all_paths.extend(paths)
            
    embeddings_tensor = torch.cat(all_embeddings, dim=0)
    pids_array = np.array(all_pids)
    return embeddings_tensor, pids_array, all_paths


def evaluate_reid_performance(
    model: torch.nn.Module,
    query_loader: DataLoader,
    gallery_loader: DataLoader,
    device: torch.device,
    metric: str = "cosine"
) -> Dict[str, float]:
    """
    Performs standard Re-ID query-to-gallery retrieval evaluation.
    """
    # 1. Extract query features
    query_feats, query_pids, query_paths = extract_all_embeddings(model, query_loader, device)
    
    # 2. Extract gallery features
    gallery_feats, gallery_pids, gallery_paths = extract_all_embeddings(model, gallery_loader, device)
    
    # 3. Compute distance matrix
    dist_matrix = compute_distance_matrix(query_feats, gallery_feats, metric=metric)
    
    # 4. Compute metrics
    metrics, cmc_curve = evaluate_cmc_map(
        distmat=dist_matrix,
        query_pids=query_pids,
        gallery_pids=gallery_pids,
        top_k=[1, 5, 10]
    )
    
    return metrics
