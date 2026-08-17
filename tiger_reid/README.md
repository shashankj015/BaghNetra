# BaghNetra: Deep Metric Learning Tiger Re-Identification (Tiger Re-ID)

An open-set person-reidentification style metric learning system for identifying individual wild Amur tigers (*Panthera tigris*) from camera-trap imagery using flank stripe biometrics.

---

## 🌟 Overview

Unlike standard closed-set classifiers that force every image into a fixed set of classes, BaghNetra Tiger Re-ID extracts a **512-dimensional $L_2$-normalized biometric embedding space**:
- Images of the **same tiger** (even in different lighting, angles, and poses) project to nearby points on the unit hypersphere ($\cos \theta \to 1.0$).
- Images of **different tigers** project to distant points.
- **Unknown tigers** that have never been seen before can be reliably recognized and rejected using a scientifically calibrated cosine similarity threshold ($\text{similarity} < \tau \implies \text{UNKNOWN\_TIGER}$).

```
Input Tiger Image ────► Flank Crop ────► ResNet-50 / ConvNeXt ────► 512-D L2 Embedding
                                                                           │
                                                                           ▼
                                                                Cosine Similarity Search
                                                                           │
                                                                           ▼
                                                             Top-5 Matches & Identity
```

---

## 📊 Dataset: ATRW (Amur Tiger Re-identification in the Wild)

- **Labeled Identities**: 107 unique wild tigers
- **Annotated Images**: 1,887 flank images
- **Leakage-Safe Partitioning**:
  - **Training**: 86 tigers (1,558 images)
  - **Hold-out Validation Query**: 21 tigers (42 probe images)
  - **Hold-out Validation Gallery**: 21 tigers (287 reference catalogue images)

Zero identity overlap between training and validation ensures authentic open-set generalization.

---

## 🚀 Quickstart & Pipeline Execution

### 1. Inspect Dataset
```bash
python tiger_reid/inspect_dataset.py
```

### 2. Verify Data Augmentations & Crops
```bash
python tiger_reid/visualization/visualize_samples.py
```

### 3. Run Pipeline Overfitting Test
```bash
python tiger_reid/test_overfit.py
```

### 4. Train Tiger Re-ID Model (Metric Learning)
```bash
python tiger_reid/train.py --config tiger_reid/configs/config.yaml --epochs 30
```

### 5. Build Known Tiger Catalogue / Gallery
```bash
python tiger_reid/build_gallery.py --checkpoint checkpoints/best_model.pth
```

### 6. Calibrate Matching & Unknown Tiger Threshold
```bash
python tiger_reid/inference/calibrate_threshold.py --checkpoint checkpoints/best_model.pth
```

### 7. Run Single-Image Inference
```bash
python tiger_reid/inference.py --image "re id/train/003597.jpg" --threshold 0.70
```

### 8. Export to ONNX (for BaghNetra Backend Runtime)
```bash
python tiger_reid/inference/export_onnx.py --checkpoint checkpoints/best_model.pth
```

### 9. Visualize Top-5 Retrieval Grid & Curves
```bash
python tiger_reid/visualize_retrieval.py
```

---

## 📐 Architecture & Metric Learning Formulation

- **Backbone**: ResNet-50 with Global Average Pooling
- **Embedding Head**: Linear projection $\to$ 512-D $\to$ Batch Normalization Neck $\to$ $L_2$ Normalization
- **Combined Loss Function**:
  $$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{CE}} + \lambda_{\text{triplet}} \cdot \mathcal{L}_{\text{Batch-Hard Triplet}}$$
- **Batch Sampling**: $P \times K$ identity sampler ($P=8$ identities, $K=4$ images per identity, batch size = 32).
- **Batch-Hard Mining**:
  - $d_{\text{ap}} = \max_{j \in \text{same tiger}} \| \mathbf{e}_i - \mathbf{e}_j \|_2$
  - $d_{\text{an}} = \min_{k \in \text{different tiger}} \| \mathbf{e}_i - \mathbf{e}_k \|_2$
  - $\mathcal{L}_{\text{triplet}} = \frac{1}{B}\sum_{i} \max(0, d_{\text{ap}} - d_{\text{an}} + m)$
