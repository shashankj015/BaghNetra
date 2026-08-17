# BaghNetra AI model fixes

## Applied
- Tiger detector now fails closed when the custom YOLO weights/Ultralytics runtime are unavailable. It never maps generic COCO classes to `tiger` and never fabricates an 88% heuristic tiger prediction.
- Blank detector now fails closed and sends images to review instead of quarantining them when its model is unavailable.
- Pipeline propagates `MODEL_UNAVAILABLE` and prevents downstream false detections.
- Re-ID model was replaced by `StripeEmbeddingNet-V2`, which preserves spatial information and combines triplet metric learning with an identity-classification objective.
- Re-ID inference uses multi-view flank/body crops rather than a single fixed central crop.
- Re-ID thresholds are calibrated from held-out validation data and stored in `models/tiger_identifier/thresholds.json`.
- Hardcoded Re-ID accuracy metrics were removed; metrics are generated from held-out queries.
- The individual-tiger dataset was audited. The `crop_*.jpg` files in BT002, BT003, BT004 and BT005 contained non-tiger distractors (elephant, lion, bear and dogs) despite being stored under tiger identities, so they were removed from the Re-ID training set.
- BT001, BT002, BT003, BT004, BT005 and BT006 now contain only the retained real-tiger captures.
- Blank detector was fine-tuned with stronger photometric augmentation and a 2.5x non-blank class weight to prioritize wildlife preservation.
- Detector training script was hardened for portable paths and expanded augmentation/validation.

## Current measured results
- Blank detector: test accuracy 1.0000, precision 1.0000, recall 1.0000, F1 1.0000 on the included 119-image test split. This does **not** establish real-world performance; a separate hard-negative camera-trap set is still required.
- Re-ID V2: validation Top-1 0.8462, validation Top-3 1.0000, held-out test Top-1 0.6250, test Top-3 1.0000 on 16 queries after removing corrupted/non-tiger training samples.
- Calibrated high-confidence threshold: 0.745. The test result is not yet strong enough for autonomous conservation-grade identity assignment; ambiguous cases should remain in human review.
- Existing YOLO detector weights are retained, but a new YOLO training run could not be executed in this offline build environment because the `ultralytics` package is not installed and external package download is unavailable. The corrected training script is included and must be run in an environment with Ultralytics installed.
