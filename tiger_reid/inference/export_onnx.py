"""
BaghNetra Tiger Re-ID: ONNX Export & Runtime Verification
Exports the 512-D embedding extraction pipeline to ONNX for integration with BaghNetra backend.
"""

import sys
import argparse
from pathlib import Path
import torch
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from tiger_reid.models.tiger_reid import TigerReIDNet


class FeatureExtractorWrapper(torch.nn.Module):
    """Wraps TigerReIDNet to cleanly export 512-D L2-normalized embeddings."""
    def __init__(self, model: TigerReIDNet):
        super().__init__()
        self.model = model
        self.eval()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model.extract_features(x)


def export_to_onnx(
    checkpoint_path: str = "checkpoints/best_model.pth",
    output_onnx_path: str = "checkpoints/tiger_reid_resnet50.onnx",
    input_size: tuple = (1, 3, 224, 224)
):
    print(f"Exporting model from '{checkpoint_path}' to ONNX '{output_onnx_path}'...")
    ckpt = torch.load(checkpoint_path, map_location="cpu")
    config = ckpt.get("config", {})
    model_cfg = config.get("model", {})
    
    num_classes = len(ckpt["model_state_dict"]["classifier.weight"]) if "classifier.weight" in ckpt["model_state_dict"] else 0
    model = TigerReIDNet(
        num_classes=num_classes,
        backbone_name=model_cfg.get("backbone", "resnet50"),
        pretrained=False,
        embedding_dim=model_cfg.get("embedding_dim", 512),
        dropout_rate=0.0
    )
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()
    
    wrapper = FeatureExtractorWrapper(model)
    wrapper.eval()
    
    dummy_input = torch.randn(*input_size, dtype=torch.float32)
    
    out_file = Path(output_onnx_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    
    torch.onnx.export(
        wrapper,
        dummy_input,
        str(out_file),
        export_params=True,
        opset_version=18,
        do_constant_folding=True,
        input_names=["input_images"],
        output_names=["embeddings_512d"],
        dynamic_axes={
            "input_images": {0: "batch_size"},
            "embeddings_512d": {0: "batch_size"}
        }
    )
    print(f"ONNX export successful: {out_file.resolve()} ({out_file.stat().st_size / (1024*1024):.2f} MB)")
    
    # Also save copy in models/ directory for backend runtime integration
    backend_model_path = Path("models/tiger_reid_resnet50.onnx")
    backend_model_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "rb") as f_in, open(backend_model_path, "wb") as f_out:
        f_out.write(f_in.read())
    print(f"Backend ONNX copy placed at: {backend_model_path.resolve()}")
    
    # Verify with ONNX Runtime
    try:
        import onnxruntime as ort
        session = ort.InferenceSession(str(out_file), providers=["CPUExecutionProvider"])
        ort_inputs = {session.get_inputs()[0].name: dummy_input.numpy()}
        ort_outs = session.run(None, ort_inputs)
        
        # PyTorch reference output
        with torch.no_grad():
            torch_out = wrapper(dummy_input).numpy()
            
        max_diff = np.max(np.abs(torch_out - ort_outs[0]))
        print(f"ONNX Runtime verification passed! Max numerical diff vs PyTorch: {max_diff:.6e}")
        assert max_diff < 1e-4, f"Discrepancy between PyTorch and ONNX Runtime too large ({max_diff})"
    except Exception as e:
        print(f"ONNX Runtime verification error: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export Tiger Re-ID to ONNX")
    parser.add_argument("--checkpoint", type=str, default="checkpoints/best_model.pth")
    parser.add_argument("--output", type=str, default="checkpoints/tiger_reid_resnet50.onnx")
    args = parser.parse_args()
    
    export_to_onnx(checkpoint_path=args.checkpoint, output_onnx_path=args.output)
