"""Train the custom 3-class YOLO detector on Pench camera-trap data.
Fails loudly if Ultralytics is unavailable; never substitutes a generic COCO model.
"""
import sys,json,argparse,time,shutil
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from app.utils.logger import logger
try:
    from ultralytics import YOLO
except ImportError as exc:
    raise RuntimeError("Ultralytics is required for tiger detector training. Install ai-service/requirements.txt first.") from exc

BASE=Path(__file__).resolve().parent.parent.parent
DATA=BASE/'datasets/tiger_detection'; OUT=BASE/'models/tiger_detector'

def train(dataset=DATA, output=OUT, epochs=20, batch=4, imgsz=640):
    output.mkdir(parents=True,exist_ok=True); start=time.time()
    yaml=dataset/'data.yaml'
    if not yaml.exists(): raise FileNotFoundError(yaml)
    # Use the local base weights; this keeps field deployment offline after training.
    base_weights=BASE/'yolov8n.pt'
    if not base_weights.exists(): raise FileNotFoundError(base_weights)
    model=YOLO(str(base_weights))
    model.train(data=str(yaml),epochs=epochs,imgsz=imgsz,batch=batch,device='cpu',workers=0,
                project=str(BASE/'runs/detect'),name='tiger_train_v2',exist_ok=True,
                pretrained=True,patience=8,close_mosaic=5,
                fliplr=0.5,hsv_h=0.015,hsv_s=0.35,hsv_v=0.25,
                degrees=5,translate=0.05,scale=0.25,verbose=True)
    val=model.val(data=str(yaml),split='val',device='cpu',verbose=False)
    best=BASE/'runs/detect/tiger_train_v2/weights/best.pt'
    target=output/'best_model.pt'
    if best.exists(): shutil.copy2(best,target)
    else: model.save(str(target))
    p=float(val.box.mp); r=float(val.box.mr)
    metrics={'model_name':'YOLOv8-Wildlife-Tiger-V2','training_date':time.strftime('%Y-%m-%d %H:%M:%S'),
             'epochs':epochs,'batch_size':batch,'image_size':imgsz,'classes':{'0':'tiger','1':'other_animal','2':'human'},
             'mAP50':round(float(val.box.map50),4),'mAP50_95':round(float(val.box.map),4),
             'precision':round(p,4),'recall':round(r,4),'f1_score':round(2*p*r/max(1e-9,p+r),4),
             'per_class_map50':{k:round(float(v),4) for k,v in zip(['tiger','other_animal','human'],val.box.maps)},
             'duration_seconds':round(time.time()-start,2),
             'evaluation_note':'Measured on validation split; test split should be run separately before final claims.'}
    (output/'metrics.json').write_text(json.dumps(metrics,indent=2)); return metrics

if __name__=='__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('--epochs',type=int,default=20); ap.add_argument('--batch',type=int,default=4)
    a=ap.parse_args(); print(train(epochs=a.epochs,batch=a.batch))
