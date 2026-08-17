from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import csv

BASE = Path(__file__).resolve().parents[2]
DATASET = BASE / "datasets" / "tiger_detection"

CLASS_NAMES = {
    0: "tiger",
    1: "other_animal",
    2: "human",
}

SPLITS = ["train", "val", "test"]

OUTPUT = BASE / "dataset_audit"
OUTPUT.mkdir(exist_ok=True)

issues = []
summary = {
    split: {name: 0 for name in CLASS_NAMES.values()}
    for split in SPLITS
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def find_image(image_dir, stem):
    for ext in IMAGE_EXTENSIONS:
        p = image_dir / f"{stem}{ext}"
        if p.exists():
            return p
    return None


def yolo_to_pixel(x, y, w, h, img_w, img_h):
    x1 = int((x - w / 2) * img_w)
    y1 = int((y - h / 2) * img_h)
    x2 = int((x + w / 2) * img_w)
    y2 = int((y + h / 2) * img_h)

    return x1, y1, x2, y2


for split in SPLITS:

    image_dir = DATASET / "images" / split
    label_dir = DATASET / "labels" / split

    if not image_dir.exists():
        issues.append([split, "", "MISSING_IMAGE_DIRECTORY"])
        continue

    if not label_dir.exists():
        issues.append([split, "", "MISSING_LABEL_DIRECTORY"])
        continue

    output_split = OUTPUT / split
    output_split.mkdir(exist_ok=True)

    images = [
        p for p in image_dir.iterdir()
        if p.suffix.lower() in IMAGE_EXTENSIONS
    ]

    print(f"\n===== {split.upper()} =====")
    print(f"Images: {len(images)}")

    for image_path in sorted(images):

        label_path = label_dir / f"{image_path.stem}.txt"

        # Missing label
        if not label_path.exists():
            issues.append([
                split,
                image_path.name,
                "MISSING_LABEL"
            ])
            continue

        try:
            image = Image.open(image_path).convert("RGB")
        except Exception as e:
            issues.append([
                split,
                image_path.name,
                f"IMAGE_ERROR: {e}"
            ])
            continue

        img_w, img_h = image.size

        draw = ImageDraw.Draw(image)

        try:
            lines = label_path.read_text().splitlines()
        except Exception as e:
            issues.append([
                split,
                image_path.name,
                f"LABEL_READ_ERROR: {e}"
            ])
            continue

        valid_label_count = 0

        for line_number, line in enumerate(lines, start=1):

            if not line.strip():
                continue

            parts = line.split()

            if len(parts) != 5:
                issues.append([
                    split,
                    image_path.name,
                    f"INVALID_LABEL_FORMAT_LINE_{line_number}: {line}"
                ])
                continue

            try:
                class_id = int(parts[0])
                x, y, w, h = map(float, parts[1:])
            except ValueError:
                issues.append([
                    split,
                    image_path.name,
                    f"INVALID_NUMBERS_LINE_{line_number}: {line}"
                ])
                continue

            # Invalid class
            if class_id not in CLASS_NAMES:
                issues.append([
                    split,
                    image_path.name,
                    f"INVALID_CLASS_{class_id}"
                ])
                continue

            # Invalid coordinates
            if not (
                0 <= x <= 1 and
                0 <= y <= 1 and
                0 < w <= 1 and
                0 < h <= 1
            ):
                issues.append([
                    split,
                    image_path.name,
                    f"INVALID_COORDINATES_LINE_{line_number}: {line}"
                ])
                continue

            # Bounding box extending outside image
            x1, y1, x2, y2 = yolo_to_pixel(
                x, y, w, h, img_w, img_h
            )

            if x1 < 0 or y1 < 0 or x2 > img_w or y2 > img_h:
                issues.append([
                    split,
                    image_path.name,
                    f"BOX_OUTSIDE_IMAGE_LINE_{line_number}"
                ])

            class_name = CLASS_NAMES[class_id]
            summary[split][class_name] += 1
            valid_label_count += 1

            # Draw bounding box
            draw.rectangle(
                [x1, y1, x2, y2],
                outline="red",
                width=3
            )

            draw.rectangle(
                [x1, max(0, y1 - 22), x1 + 150, y1],
                fill="red"
            )

            draw.text(
                [x1 + 3, max(0, y1 - 20)],
                class_name,
                fill="white"
            )

        # Save annotated image
        output_path = output_split / image_path.name
        image.save(output_path)

        # Empty label file = background image
        if valid_label_count == 0:
            issues.append([
                split,
                image_path.name,
                "EMPTY_LABEL_BACKGROUND"
            ])

    # Find orphan labels
    for label_path in label_dir.glob("*.txt"):

        image_path = find_image(
            image_dir,
            label_path.stem
        )

        if image_path is None:
            issues.append([
                split,
                label_path.name,
                "LABEL_WITHOUT_IMAGE"
            ])


# Write issue report
report_path = OUTPUT / "audit_report.csv"

with open(
    report_path,
    "w",
    newline="",
    encoding="utf-8"
) as f:

    writer = csv.writer(f)

    writer.writerow([
        "split",
        "file",
        "issue"
    ])

    writer.writerows(issues)


print("\n==============================")
print("DATASET AUDIT COMPLETE")
print("==============================")

for split in SPLITS:
    print(f"\n{split.upper()}")

    for class_id, class_name in CLASS_NAMES.items():
        print(
            f"  {class_id} ({class_name}): "
            f"{summary[split][class_name]}"
        )

print("\nStructural issues:", len(issues))
print("Report:", report_path)
print("Annotated images:", OUTPUT)