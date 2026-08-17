"""
BaghNetra Tiger Re-ID: Modular Backbone Factory
Provides pluggable visual backbones (ResNet-50 baseline, ConvNeXt, ViT)
"""

import torch
import torch.nn as nn
import torchvision.models as models
from torchvision.models import ResNet50_Weights, ConvNeXt_Tiny_Weights, ViT_B_16_Weights


def build_backbone(backbone_name: str = "resnet50", pretrained: bool = True) -> tuple[nn.Module, int]:
    """
    Builds and returns a feature extraction backbone and its output feature dimension.
    
    Supported:
    - 'resnet50': Deep residual CNN (2048-D features)
    - 'convnext_tiny': Modern pure convolutional architecture (768-D features)
    - 'vit_b_16': Vision Transformer baseline (768-D features)
    """
    backbone_name = backbone_name.lower()
    
    if backbone_name == "resnet50":
        weights = ResNet50_Weights.DEFAULT if pretrained else None
        model = models.resnet50(weights=weights)
        # Remove original fully connected classification head
        in_features = model.fc.in_features # 2048
        model.fc = nn.Identity()
        return model, in_features
        
    elif backbone_name == "convnext_tiny":
        weights = ConvNeXt_Tiny_Weights.DEFAULT if pretrained else None
        model = models.convnext_tiny(weights=weights)
        in_features = model.classifier[2].in_features # 768
        model.classifier[2] = nn.Identity()
        return model, in_features
        
    elif backbone_name == "vit_b_16":
        weights = ViT_B_16_Weights.DEFAULT if pretrained else None
        model = models.vit_b_16(weights=weights)
        in_features = model.heads.head.in_features # 768
        model.heads.head = nn.Identity()
        return model, in_features
        
    else:
        raise ValueError(f"Unsupported backbone: '{backbone_name}'. Choose from ['resnet50', 'convnext_tiny', 'vit_b_16']")
