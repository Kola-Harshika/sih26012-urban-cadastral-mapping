"""
Small shared helpers: device detection, reproducibility, logging.
"""

from __future__ import annotations

import logging
import random
import sys

import numpy as np
import torch


def get_device() -> torch.device:
    """
    Detect CUDA if available, otherwise fall back to CPU. Training and
    inference both call this rather than hardcoding a device, per the
    requirement that the code must run without assuming a GPU exists.
    """
    if torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        device = torch.device("cpu")
    return device


def set_seed(seed: int = 42) -> None:
    """Seed python, numpy, and torch RNGs for a reproducible train/val split
    and reasonably reproducible training runs (full determinism on GPU is
    not guaranteed by torch, but this covers the common sources)."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
