"""
Image/mask preprocessing utilities.

Kept as plain functions (rather than a transform-composition framework)
so it's obvious exactly what happens to the raster data before it hits
the model, and so the same resize logic is trivially reusable at
inference time to keep image/mask pixel grids in sync.
"""

from __future__ import annotations

import cv2
import numpy as np


def resize_image(image: np.ndarray, size: int) -> np.ndarray:
    """Resize a (H, W, C) image to (size, size, C) using area interpolation
    (better for downsampling aerial imagery than nearest/linear)."""
    return cv2.resize(image, (size, size), interpolation=cv2.INTER_AREA)


def resize_mask(mask: np.ndarray, size: int) -> np.ndarray:
    """Resize a (H, W) binary mask to (size, size) using nearest-neighbor
    interpolation so we never introduce fractional/blended label values."""
    resized = cv2.resize(mask.astype(np.uint8), (size, size), interpolation=cv2.INTER_NEAREST)
    return resized.astype(np.float32)


def stretch_to_uint8(image: np.ndarray, lower_percentile: float = 2.0, upper_percentile: float = 98.0) -> np.ndarray:
    """Rescale an arbitrary-bit-depth raster (e.g. 16-bit satellite imagery,
    which is common for SpaceNet's source GeoTIFFs and is NOT simply
    0-65535 in practice) to 0-255 uint8 using a percentile stretch.

    Without this, a naive '/255' normalization on 16-bit data would leave
    pixel values near-zero and the model would effectively see a blank
    image. uint8 input passes through percentile clipping too, which is
    a no-op in the common case and harmless otherwise.
    """
    if image.dtype == np.uint8:
        return image

    image = image.astype(np.float32)
    lo = np.percentile(image, lower_percentile)
    hi = np.percentile(image, upper_percentile)
    if hi <= lo:
        hi = lo + 1e-6
    stretched = np.clip((image - lo) / (hi - lo), 0.0, 1.0) * 255.0
    return stretched.astype(np.uint8)


def normalize_image(image: np.ndarray, mean: list[float], std: list[float]) -> np.ndarray:
    """Scale to [0, 1] then apply per-channel mean/std normalization.
    Expects image as (H, W, C) float32 in 0-255 range (or already 0-1)."""
    image = image.astype(np.float32)
    if image.max() > 1.0:
        image = image / 255.0
    mean_arr = np.array(mean, dtype=np.float32).reshape(1, 1, -1)
    std_arr = np.array(std, dtype=np.float32).reshape(1, 1, -1)
    return (image - mean_arr) / std_arr


def random_flip(image: np.ndarray, mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Simple augmentation: random horizontal/vertical flip applied
    identically to image and mask so they stay pixel-aligned."""
    if np.random.rand() < 0.5:
        image = np.fliplr(image).copy()
        mask = np.fliplr(mask).copy()
    if np.random.rand() < 0.5:
        image = np.flipud(image).copy()
        mask = np.flipud(mask).copy()
    return image, mask


def to_chw(image: np.ndarray) -> np.ndarray:
    """(H, W, C) -> (C, H, W) for PyTorch."""
    return np.transpose(image, (2, 0, 1)).astype(np.float32)
