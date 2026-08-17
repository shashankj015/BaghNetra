import os
import sys
import json
import csv
from pathlib import Path
from collections import Counter, defaultdict
from PIL import Image
import numpy as np

def inspect_atrw_dataset(base_dir):
    print("=" * 80)
    print(" BAGHNETRA - ATRW RE-ID DATASET INSPECTION")
    print("=" * 80)

    base_path = Path(base_dir)
    print(f"Base Directory: {base_path.resolve()}\n")

    # 1. Directory & File Inventory
    print("--- 1. DIRECTORY & FILE INVENTORY ---")
    subdirs = [p for p in base_path.iterdir() if p.is_dir()]
    for s in sorted(subdirs):
        file_count = len(list(s.glob("*")))
        print(f"  Folder: {s.name:<25} | Items: {file_count}")

    train_img_dir = base_path / "train"
    test_img_dir = base_path / "test"
    train_anno_dir = base_path / "atrw_anno_reid_train"
    test_anno_dir = base_path / "atrw_anno_reid_test"

    train_csv = train_anno_dir / "reid_list_train.csv"
    train_json = train_anno_dir / "reid_keypoints_train.json"
    test_csv = test_anno_dir / "reid_list_test.csv"
    test_json = test_anno_dir / "reid_keypoints_test.json"

    files_to_check = [
        ("Train CSV List", train_csv),
        ("Train Keypoints JSON", train_json),
        ("Test CSV List", test_csv),
        ("Test Keypoints JSON", test_json),
    ]

    for label, path in files_to_check:
        exists = path.exists()
        size_kb = path.stat().st_size / 1024 if exists else 0
        print(f"  {label:<25}: Exists = {exists} ({size_kb:.1f} KB)")

    # 2. Inspect Train Annotations
    print("\n--- 2. TRAIN ANNOTATION INSPECTION (reid_list_train.csv) ---")
    train_entries = []
    if train_csv.exists():
        with open(train_csv, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 2:
                    # check if header
                    tiger_id, img_name = row[0].strip(), row[1].strip()
                    train_entries.append((tiger_id, img_name))

    print(f"Total entries in train CSV: {len(train_entries)}")
    print("Sample 5 entries (Raw):")
    for row in train_entries[:5]:
        print(f"  ID: {row[0]:<10} -> Image: {row[1]}")

    # Check if first entry is header
    is_header = False
    if train_entries and not train_entries[0][0].isdigit() and not train_entries[0][0].startswith("tiger"):
        print(f"  Note: First line appears to be header: {train_entries[0]}")
        # Let's inspect if it's numeric ID or string ID
    
    # Process train IDs
    train_id_to_imgs = defaultdict(list)
    for tid, img in train_entries:
        train_id_to_imgs[tid].append(img)

    train_unique_ids = len(train_id_to_imgs)
    print(f"\nUnique Tiger IDs in Train: {train_unique_ids}")
    
    imgs_per_id = [len(imgs) for imgs in train_id_to_imgs.values()]
    print(f"Images per Tiger ID (Train):")
    print(f"  Min: {min(imgs_per_id):<4} Max: {max(imgs_per_id):<4} Mean: {np.mean(imgs_per_id):.2f} Median: {np.median(imgs_per_id):.1f}")
    
    # ID distribution histogram
    id_counts = Counter(imgs_per_id)
    print(f"Distribution of image count per ID:")
    for count in sorted(id_counts.keys()):
        print(f"  Tigers with {count:>3} images: {id_counts[count]:>3} tigers")

    # 3. Inspect Test Annotations
    print("\n--- 3. TEST ANNOTATION INSPECTION (reid_list_test.csv) ---")
    test_entries = []
    if test_csv.exists():
        with open(test_csv, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) >= 1:
                    test_entries.append(row)

    print(f"Total entries in test CSV: {len(test_entries)}")
    print("Sample 5 entries (Raw):")
    for row in test_entries[:5]:
        print(f"  {row}")

    # 4. Inspect Keypoints JSON
    print("\n--- 4. KEYPOINTS / BOUNDING BOX INSPECTION ---")
    train_kpts = {}
    if train_json.exists():
        with open(train_json, "r", encoding="utf-8") as f:
            train_kpts = json.load(f)
    print(f"Total entries in train keypoints JSON: {len(train_kpts)}")

    test_kpts = {}
    if test_json.exists():
        with open(test_json, "r", encoding="utf-8") as f:
            test_kpts = json.load(f)
    print(f"Total entries in test keypoints JSON: {len(test_kpts)}")

    # Sample keypoint format
    if train_kpts:
        sample_key = list(train_kpts.keys())[0]
        sample_val = train_kpts[sample_key]
        print(f"\nSample Keypoint Entry for image '{sample_key}':")
        print(f"  Type: {type(sample_val)}")
        print(f"  Length: {len(sample_val) if isinstance(sample_val, list) else 'N/A'}")
        print(f"  Raw values: {sample_val[:15]} ... (truncated)")
        if isinstance(sample_val, list):
            # Check triplets (x, y, v)
            num_points = len(sample_val) // 3
            print(f"  Interpreted as {num_points} keypoints with (x, y, visibility) triplet format.")
            # Calculate bbox from visible keypoints
            pts = np.array(sample_val).reshape(-1, 3)
            vis_pts = pts[pts[:, 2] > 0]
            if len(vis_pts) > 0:
                min_x, min_y = np.min(vis_pts[:, 0]), np.min(vis_pts[:, 1])
                max_x, max_y = np.max(vis_pts[:, 0]), np.max(vis_pts[:, 1])
                print(f"  Derived Bounding Box from visible keypoints: [xmin={min_x:.1f}, ymin={min_y:.1f}, xmax={max_x:.1f}, ymax={max_y:.1f}], width={max_x-min_x:.1f}, height={max_y-min_y:.1f}")

    # 5. Image File Verification (Missing / Corrupt / Dimensions)
    print("\n--- 5. IMAGE FILE VERIFICATION & INTEGRITY ---")
    train_disk_imgs = set(p.name for p in train_img_dir.glob("*.*"))
    test_disk_imgs = set(p.name for p in test_img_dir.glob("*.*"))
    print(f"Images found on disk:")
    print(f"  train/: {len(train_disk_imgs)} files")
    print(f"  test/:  {len(test_disk_imgs)} files")

    # Match train CSV vs train disk images
    train_csv_imgs = set(img for _, img in train_entries)
    missing_train = train_csv_imgs - train_disk_imgs
    unannotated_train = train_disk_imgs - train_csv_imgs
    print(f"\nTrain Consistency Check:")
    print(f"  Missing images (in CSV but not on disk): {len(missing_train)}")
    print(f"  Unannotated images (on disk but not in CSV): {len(unannotated_train)}")

    # Match test CSV vs test disk images
    test_csv_imgs = set(row[0].strip() if len(row)==1 else row[1].strip() for row in test_entries)
    missing_test = test_csv_imgs - test_disk_imgs
    unannotated_test = test_disk_imgs - test_csv_imgs
    print(f"\nTest Consistency Check:")
    print(f"  Missing images (in CSV but not on disk): {len(missing_test)}")
    print(f"  Unannotated images (on disk but not in CSV): {len(unannotated_test)}")

    # Check image dimensions & corrupt images on a sample / all train images
    print(f"\nScanning image dimensions and corruption across train images...")
    corrupt_count = 0
    dimensions = []
    aspect_ratios = []
    
    # Check all train images
    for tid, img_name in train_entries:
        img_path = train_img_dir / img_name
        if not img_path.exists():
            continue
        try:
            with Image.open(img_path) as img:
                w, h = img.size
                dimensions.append((w, h))
                aspect_ratios.append(w / h)
                # Verify can read
                img.verify()
        except Exception as e:
            print(f"  CORRUPT IMAGE DETECTED: {img_name} ({e})")
            corrupt_count += 1

    print(f"Image scan completed:")
    print(f"  Corrupt images: {corrupt_count}")
    if dimensions:
        widths, heights = zip(*dimensions)
        print(f"  Width:  min={min(widths)}, max={max(widths)}, mean={np.mean(widths):.1f}")
        print(f"  Height: min={min(heights)}, max={max(heights)}, mean={np.mean(heights):.1f}")
        print(f"  Aspect Ratio (W/H): min={min(aspect_ratios):.2f}, max={max(aspect_ratios):.2f}, mean={np.mean(aspect_ratios):.2f}")

    # Check whether images are full frames or cropped flanks
    print("\n--- 6. IMAGE CONTENT NATURE (Full Frame vs Flank / Tiger Crop) ---")
    # Let's inspect image dimensions vs keypoint ranges
    if train_kpts and dimensions:
        sample_img_name = train_entries[0][1]
        sample_img_path = train_img_dir / sample_img_name
        with Image.open(sample_img_path) as im:
            sw, sh = im.size
        sample_pts = np.array(train_kpts.get(sample_img_name, [])).reshape(-1, 3)
        vis = sample_pts[sample_pts[:, 2] > 0]
        if len(vis) > 0:
            k_minx, k_miny = np.min(vis[:, 0]), np.min(vis[:, 1])
            k_maxx, k_maxy = np.max(vis[:, 0]), np.max(vis[:, 1])
            print(f"Sample image '{sample_img_name}': Image Size = {sw}x{sh}")
            print(f"Keypoints Bounding Box: [{k_minx:.1f}, {k_miny:.1f}, {k_maxx:.1f}, {k_maxy:.1f}] -> spans {((k_maxx-k_minx)/sw)*100:.1f}% width, {((k_maxy-k_miny)/sh)*100:.1f}% height")
            if (k_maxx - k_minx) / sw < 0.8 or (k_maxy - k_miny) / sh < 0.8:
                print("  => Images appear to be broader camera-trap frames or contain background. Keypoints or derived crops are crucial!")
            else:
                print("  => Images tightly bound the tiger flank / body.")

    print("=" * 80)
    print(" INSPECTION COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    reid_dir = "/Users/pagarearyanmanohar/code/hackathon/manthan/BaghNetra_mern/re id"
    inspect_atrw_dataset(reid_dir)
