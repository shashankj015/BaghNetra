#!/usr/bin/env python3
import sys
from pathlib import Path

# Set path
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tiger_reid.visualization.visualize_retrieval import plot_training_curves, visualize_retrieval_grid
import argparse
import os

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--history", type=str, default="experiments/exp001/training_history.json")
    parser.add_argument("--checkpoint", type=str, default="checkpoints/best_model.pth")
    parser.add_argument("--num_queries", type=int, default=5)
    args = parser.parse_args()
    
    if os.path.exists(args.history):
        plot_training_curves(args.history)
    if os.path.exists(args.checkpoint):
        visualize_retrieval_grid(checkpoint_path=args.checkpoint, num_queries=args.num_queries)
