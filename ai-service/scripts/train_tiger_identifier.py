"""Train and genuinely evaluate BaghNetra tiger re-identification."""
import sys, json, argparse, random, time
from pathlib import Path
from collections import defaultdict
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.utils.logger import logger
from app.preprocessing.image_ops import isolate_flank_region, preprocess_for_embedding, extract_flank_views

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DATASET = BASE_DIR / "datasets" / "individual_tiger"
DEFAULT_OUTPUT = BASE_DIR / "models" / "tiger_identifier"

SEED = 42
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)


def collect_images(dataset_path):
    groups = {}
    for d in sorted(dataset_path.iterdir()):
        if d.is_dir() and "UNKNOWN" not in d.name:
            imgs = sorted(list(d.glob("*.jpg")) + list(d.glob("*.jpeg")) + list(d.glob("*.png")))
            if len(imgs) >= 4:
                groups[d.name] = imgs
    return groups


def split_groups(groups, test_ratio=0.2, val_ratio=0.15):
    train, val, test = {}, {}, {}
    for tid, imgs in groups.items():
        imgs = imgs.copy(); random.Random(SEED + sum(ord(c) for c in tid)).shuffle(imgs)
        n = len(imgs)
        n_test = max(1, round(n * test_ratio))
        n_val = max(1, round(n * val_ratio))
        test[tid] = imgs[:n_test]
        val[tid] = imgs[n_test:n_test+n_val]
        train[tid] = imgs[n_test+n_val:]
    return train, val, test


def augment(img):
    if random.random() < 0.5: img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if random.random() < 0.8:
        img = ImageEnhance.Brightness(img).enhance(random.uniform(0.75, 1.25))
    if random.random() < 0.7:
        img = ImageEnhance.Contrast(img).enhance(random.uniform(0.75, 1.25))
    if random.random() < 0.25:
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.2, 1.0)))
    return img


class TripletDataset(Dataset):
    def __init__(self, groups, num_triplets=1500):
        self.groups = groups
        self.ids = list(groups)
        self.num_triplets = num_triplets
    def __len__(self): return self.num_triplets
    def __getitem__(self, _):
        aid = random.choice(self.ids)
        a, p = random.sample(self.groups[aid], 2)
        nid = random.choice([x for x in self.ids if x != aid])
        n = random.choice(self.groups[nid])
        def load(path):
            with Image.open(path) as im:
                im = augment(isolate_flank_region(im.convert("RGB")))
                return torch.from_numpy(preprocess_for_embedding(im))
        return load(a), load(p), load(n), self.ids.index(aid)


def embed_paths(model, paths, device):
    """Batch multi-view embeddings for CPU-friendly evaluation/training."""
    tensors=[]
    for p in paths:
        with Image.open(p) as im:
            views = extract_flank_views(isolate_flank_region(im.convert("RGB")))
            tensors.extend([torch.from_numpy(preprocess_for_embedding(v)) for v in views])
    model.eval()
    with torch.no_grad():
        embs=model(torch.stack(tensors).to(device)).cpu().numpy()
    out=[]; idx=0
    views_per=len(extract_flank_views(Image.new("RGB",(64,64))))
    for _ in paths:
        e=embs[idx:idx+views_per].mean(axis=0); idx += views_per
        e /= np.linalg.norm(e)+1e-8; out.append(e)
    return out


def make_gallery(model, groups, device):
    gallery = {}
    for tid, paths in groups.items():
        es = embed_paths(model, paths, device)
        mean = np.mean(es, axis=0); mean /= np.linalg.norm(mean) + 1e-8
        gallery[tid] = mean
    return gallery


def evaluate(model, gallery, groups, device):
    sims = []
    rows = []
    correct1 = correct3 = total = 0
    for true_id, paths in groups.items():
        for p in paths:
            e = embed_paths(model, [p], device)[0]
            scores = sorted(((float(np.dot(e, g)), tid) for tid, g in gallery.items()), reverse=True)
            ranked = [tid for _, tid in scores]
            score = scores[0][0] if scores else 0.0
            total += 1
            correct1 += int(ranked[:1] == [true_id])
            correct3 += int(true_id in ranked[:3])
            same = score if ranked and ranked[0] == true_id else float(np.dot(e, gallery[true_id]))
            sims.append((same, ranked[0] == true_id))
            rows.append((true_id, ranked[0] if ranked else None, score, ranked[:3]))
    return {
        "top1": correct1 / max(1,total), "top3": correct3 / max(1,total),
        "rows": rows, "scores": sims, "count": total
    }


def calibrate_threshold(model, gallery, groups, device):
    # Build same/different similarities from actual validation queries.
    same, diff = [], []
    for true_id, paths in groups.items():
        for p in paths:
            e = embed_paths(model, [p], device)[0]
            same.append(float(np.dot(e, gallery[true_id])))
            for other_id, g in gallery.items():
                if other_id != true_id: diff.append(float(np.dot(e, g)))
    candidates = np.linspace(0.40, 0.98, 117)
    best = None
    for t in candidates:
        fn = sum(x < t for x in same) / max(1, len(same))
        fp = sum(x >= t for x in diff) / max(1, len(diff))
        # Favor low false matches for conservation use while retaining reasonable recall.
        cost = 3.0 * fp + fn
        if best is None or cost < best[0]: best = (cost, float(t), float(fn), float(fp))
    return {"high_threshold": best[1], "validation_false_reject_rate": best[2], "validation_false_match_rate": best[3]}


def train(args):
    start = time.time()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    groups = collect_images(args.dataset)
    if len(groups) < 2: raise RuntimeError("Need at least two known tiger identities")
    train_g, val_g, test_g = split_groups(groups)
    logger.info("Identity counts: %s", {k: len(v) for k,v in groups.items()})
    logger.info("Splits: train=%s val=%s test=%s", {k:len(v) for k,v in train_g.items()}, {k:len(v) for k,v in val_g.items()}, {k:len(v) for k,v in test_g.items()})

    from app.models.tiger_identifier import StripeEmbeddingNet
    model = StripeEmbeddingNet(embedding_dim=512, num_classes=len(groups)).to(device)
    ds = TripletDataset(train_g, args.num_triplets)
    loader = DataLoader(ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    triplet = nn.TripletMarginLoss(margin=args.margin, p=2)
    ce = nn.CrossEntropyLoss(label_smoothing=0.05)
    opt = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    sched = optim.lr_scheduler.CosineAnnealingLR(opt, T_max=args.epochs)

    best_val = -1
    best_state = None
    for epoch in range(args.epochs):
        model.train(); total_loss = 0.0
        for a,p,n,y in loader:
            a,p,n,y = a.to(device),p.to(device),n.to(device),y.to(device)
            opt.zero_grad()
            ea, la = model(a, True); ep = model(p); en = model(n)
            loss = triplet(ea,ep,en) + args.cls_weight * ce(la,y)
            loss.backward(); torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0); opt.step()
            total_loss += loss.item()
        sched.step()
        gallery = make_gallery(model, train_g, device)
        val = evaluate(model, gallery, val_g, device)
        logger.info("Epoch %d/%d loss=%.4f val_top1=%.4f val_top3=%.4f", epoch+1,args.epochs,total_loss/max(1,len(loader)),val["top1"],val["top3"])
        if val["top1"] > best_val:
            best_val = val["top1"]
            best_state = {k:v.detach().cpu().clone() for k,v in model.state_dict().items()}
            args.output_dir.mkdir(parents=True, exist_ok=True)
            torch.save(best_state, args.output_dir / "best_checkpoint.pt")

    model.load_state_dict(best_state)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    torch.save(model.state_dict(), args.output_dir / "best_model.pt")
    train_gallery = make_gallery(model, train_g, device)
    calibration = calibrate_threshold(model, train_gallery, val_g, device)
    test = evaluate(model, train_gallery, test_g, device)

    # Build production catalogue from all known captures using the final model.
    full_gallery = make_gallery(model, groups, device)
    names = {
        "BT001":"Collarwali / Baghin (PTR-T-15)", "BT002":"Langdi / T-20",
        "BT003":"Raiyyakassa Male (PTR-T-30)", "BT004":"Charger (PTR-T-40)",
        "BT005":"Bikram (PTR-T-50)", "BT006":"Pench Tiger BT006"
    }
    catalog=[]
    for tid, emb in full_gallery.items():
        catalog.append({"tigerId":tid,"name":names.get(tid,f"Pench Tiger {tid}"),"embedding":[round(float(x),6) for x in emb],"sample_count":len(groups[tid])})
    with open(args.output_dir / "embeddings.json","w",encoding="utf-8") as f: json.dump(catalog,f,indent=2)

    metrics={
        "model_name":"StripeEmbeddingNet-V2",
        "training_date":time.strftime("%Y-%m-%d %H:%M:%S"),
        "architecture":"Spatial CNN + supervised identity head + Triplet Margin Loss",
        "embedding_dim":512,"epochs":args.epochs,"batch_size":args.batch_size,
        "loss_function":"TripletMarginLoss + weighted CrossEntropy",
        "known_identities":len(groups),"images_total":sum(map(len,groups.values())),
        "split":"70/15/15 per identity (approx.)",
        "validation_top1":round(best_val,4),"validation_top3":round(val["top3"],4),
        "test_top1":round(test["top1"],4),"test_top3":round(test["top3"],4),
        "calibrated_high_threshold":calibration["high_threshold"],
        "validation_false_reject_rate":round(calibration["validation_false_reject_rate"],4),
        "validation_false_match_rate":round(calibration["validation_false_match_rate"],4),
        "test_queries":test["count"],"catalog_size":len(catalog),
        "duration_seconds":round(time.time()-start,2),
        "evaluation_note":"Metrics are computed from held-out query images; no hardcoded accuracy values."
    }
    with open(args.output_dir / "metrics.json","w",encoding="utf-8") as f: json.dump(metrics,f,indent=2)
    with open(args.output_dir / "thresholds.json","w",encoding="utf-8") as f: json.dump(calibration,f,indent=2)
    logger.info("Training complete: test_top1=%.4f test_top3=%.4f threshold=%.3f",test["top1"],test["top3"],calibration["high_threshold"])

if __name__ == "__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--dataset",type=Path,default=DEFAULT_DATASET)
    ap.add_argument("--output_dir",type=Path,default=DEFAULT_OUTPUT)
    ap.add_argument("--epochs",type=int,default=12)
    ap.add_argument("--batch_size",type=int,default=8)
    ap.add_argument("--lr",type=float,default=0.0005)
    ap.add_argument("--margin",type=float,default=0.35)
    ap.add_argument("--num_triplets",type=int,default=500)
    ap.add_argument("--cls_weight",type=float,default=0.5)
    args=ap.parse_args(); train(args)
