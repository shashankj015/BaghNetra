#!/usr/bin/env python3
import sys
from pathlib import Path

# Set path
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from tiger_reid.training.train import main

if __name__ == "__main__":
    main()
