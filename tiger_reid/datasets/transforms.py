"""
BaghNetra Tiger Re-ID: Image Transforms & Augmentation
Stripe-preserving data augmentations tailored for Amur tiger flank recognition.
"""

import torchvision.transforms as T
from PIL import Image

def get_train_transforms(image_size=(224, 224)):
    """
    Returns stripe-preserving training transforms.
    
    Augmentations are carefully chosen to preserve the curvature and relative
    spatial configuration of tiger stripe patterns while improving robustness to:
    - Camera angle / orientation (Horizontal Flip, slight Rotation)
    - Scale / distance variation (Random Resized Crop with mild scale bounds)
    - Wild lighting variations / day/dusk (Color Jitter)
    - Vegetation occlusions (Random Erasing / Cutout)
    """
    h, w = image_size
    return T.Compose([
        T.Resize((h, w), interpolation=T.InterpolationMode.BILINEAR, antialias=True),
        T.RandomResizedCrop(
            size=(h, w),
            scale=(0.85, 1.0),
            ratio=(0.8, 1.25),
            interpolation=T.InterpolationMode.BILINEAR,
            antialias=True
        ),
        T.RandomHorizontalFlip(p=0.5),
        T.RandomRotation(degrees=10, interpolation=T.InterpolationMode.BILINEAR),
        T.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15, hue=0.05),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        T.RandomErasing(p=0.2, scale=(0.02, 0.15), value='random')
    ])

def get_val_transforms(image_size=(224, 224)):
    """
    Deterministic evaluation/inference transform.
    Direct bilinear resize + ImageNet normalization.
    """
    h, w = image_size
    return T.Compose([
        T.Resize((h, w), interpolation=T.InterpolationMode.BILINEAR, antialias=True),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
