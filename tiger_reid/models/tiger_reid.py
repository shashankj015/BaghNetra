"""
BaghNetra Tiger Re-ID: Metric Learning Model Architecture
Extracts 512-dimensional L2-normalized biometric stripe embeddings.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Optional

from .backbone import build_backbone


class TigerReIDNet(nn.Module):
    """
    Person-ReID style Metric Learning Deep Network for Tiger Flank Identification.
    
    Architecture:
      Input (B, 3, 224, 224)
        ↓
      Backbone (ResNet-50 / ConvNeXt / ViT)
        ↓
      Global Feature Pooling (2048-D)
        ↓
      Linear Projection Layer (512-D)
        ↓
      BatchNorm1d + L2-Normalization (512-D unit hypersphere embedding)
        ↓ (During Training)
      Classifier Linear Head (num_train_classes)
    """
    def __init__(
        self,
        num_classes: int,
        backbone_name: str = "resnet50",
        pretrained: bool = True,
        embedding_dim: int = 512,
        dropout_rate: float = 0.1
    ):
        super(TigerReIDNet, self).__init__()
        self.num_classes = num_classes
        self.embedding_dim = embedding_dim
        
        # 1. Feature Extractor Backbone
        self.backbone, in_features = build_backbone(backbone_name=backbone_name, pretrained=pretrained)
        
        # 2. Embedding Head (Projects 2048-D -> 512-D)
        self.embedding_layer = nn.Linear(in_features, embedding_dim, bias=False)
        self.bn_neck = nn.BatchNorm1d(embedding_dim)
        # Initialize BNNeck with unit scale and zero bias (Bag of Tricks for Re-ID)
        self.bn_neck.bias.requires_grad_(False)
        
        self.dropout = nn.Dropout(p=dropout_rate) if dropout_rate > 0 else nn.Identity()
        
        # 3. Identity Classification Head (Used only during metric learning training)
        if num_classes > 0:
            self.classifier = nn.Linear(embedding_dim, num_classes, bias=False)
            nn.init.normal_(self.classifier.weight, std=0.001)
        else:
            self.classifier = None

    def extract_features(self, x: torch.Tensor) -> torch.Tensor:
        """
        Extracts 512-D L2-normalized embeddings for retrieval and inference.
        """
        feats = self.backbone(x)
        if feats.dim() > 2:
            feats = F.adaptive_avg_pool2d(feats, (1, 1)).flatten(1)
        
        raw_emb = self.embedding_layer(feats)
        norm_emb = self.bn_neck(raw_emb)
        normalized_emb = F.normalize(norm_emb, p=2, dim=1)
        return normalized_emb

    def forward(self, x: torch.Tensor) -> Tuple[Optional[torch.Tensor], torch.Tensor, torch.Tensor]:
        """
        Forward pass.
        
        Returns:
            If in training mode: (logits, normalized_embeddings, raw_embeddings)
            If in evaluation mode: normalized_embeddings (or tuple if explicit)
        """
        feats = self.backbone(x)
        if feats.dim() > 2:
            feats = F.adaptive_avg_pool2d(feats, (1, 1)).flatten(1)
            
        raw_emb = self.embedding_layer(feats)
        bn_feat = self.bn_neck(raw_emb)
        normalized_emb = F.normalize(bn_feat, p=2, dim=1)
        
        if self.training and self.classifier is not None:
            drop_feat = self.dropout(bn_feat)
            logits = self.classifier(drop_feat)
            return logits, normalized_emb, raw_emb
        else:
            return normalized_emb
