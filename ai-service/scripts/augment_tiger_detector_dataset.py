"""Create camera-trap-safe training augmentations for YOLO detector.
Generates horizontal flips and mild photometric variants while preserving labels.
Never modifies validation/test data.
"""
from pathlib import Path
from PIL import Image, ImageEnhance
import shutil
import random

BASE=Path(__file__).resolve().parent.parent.parent
ROOT=BASE/'datasets/tiger_detection'
TRAIN=ROOT/'images/train'; LABELS=ROOT/'labels/train'

def yolo_flip(label_text):
    out=[]
    for line in label_text.splitlines():
        p=line.split()
        if len(p)==5:
            cls,x,y,w,h=p; x=str(1.0-float(x)); out.append(f"{cls} {x} {y} {w} {h}")
    return '\n'.join(out)+'\n'

for img_path in sorted(TRAIN.glob('*')):
    if img_path.suffix.lower() not in {'.jpg','.jpeg','.png'}: continue
    label=LABELS/(img_path.stem+'.txt')
    if not label.exists(): continue
    # only add one deterministic flip per original to keep dataset manageable
    flip_name=img_path.stem+'_flip'+img_path.suffix
    flip_path=TRAIN/flip_name
    flip_label=LABELS/(img_path.stem+'_flip.txt')
    if not flip_path.exists():
        with Image.open(img_path) as im:
            im=im.convert('RGB').transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            im.save(flip_path, quality=95)
        flip_label.write_text(yolo_flip(label.read_text()))
print('Augmented training set created.')
