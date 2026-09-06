"""
PyTorch Dataset for the Stage 1 building-footprint task.

Reads a manifest.csv (produced by build_manifest.py) of (image_path,
label_path) pairs. For each pair:

  1. Opens the image with rasterio (preserves CRS/transform metadata).
  2. Loads the label:
       - if it's a vector file (.geojson/.json/.shp), rasterizes the
         building polygons onto the IMAGE's own pixel grid using the
         image's transform/CRS via rasterio.features.rasterize. This is
         the step that turns "vector footprints" into a "pixel mask" --
         they are not the same thing, per the task requirements.
       - if it's already a raster mask (.tif/.png), it's read directly
         and resampled to match if needed.
  3. Resizes both to the configured patch size, normalizes the image,
     and (for training) applies a simple flip augmentation.

Returns (image_tensor[C,H,W], mask_tensor[1,H,W]).
"""

from __future__ import annotations

from pathlib import Path

import cv2
import geopandas as gpd
import numpy as np
import rasterio
import torch
from rasterio.features import rasterize
from torch.utils.data import Dataset

from transforms import normalize_image, random_flip, resize_image, resize_mask, stretch_to_uint8, to_chw

VECTOR_EXTENSIONS = {".geojson", ".json", ".shp"}
RASTER_EXTENSIONS = {".tif", ".tiff", ".png"}


def _read_image(image_path: str) -> tuple[np.ndarray, dict]:
    """Read a raster image as (H, W, 3) uint8/float, plus its rasterio
    profile (contains CRS, transform, etc. when present in the source)."""
    with rasterio.open(image_path) as src:
        profile = src.profile
        band_count = src.count
        if band_count >= 3:
            # Use the first three bands as RGB. SpaceNet pan-sharpened
            # imagery is typically already 3-band RGB; 8-band MUL sources
            # would need explicit band selection, which is out of scope
            # for this Stage 1 prototype and left as a config extension.
            data = src.read([1, 2, 3])
        else:
            single = src.read(1)
            data = np.stack([single, single, single], axis=0)
        image = np.transpose(data, (1, 2, 0))  # (C,H,W) -> (H,W,C)
        # Many satellite/aerial GeoTIFFs (including SpaceNet sources) are
        # 16-bit with a non-trivial value range, not plain 0-255. Stretch
        # to uint8 here so every downstream consumer (dataset + infer) sees
        # consistent, properly-scaled pixel values.
        image = stretch_to_uint8(image)
    return image, profile


def _rasterize_vector_label(label_path: str, profile: dict) -> np.ndarray:
    """Rasterize a GeoJSON/Shapefile of building polygons onto the image's
    own grid using its transform and CRS, producing a binary mask."""
    gdf = gpd.read_file(label_path)

    image_crs = profile.get("crs")
    if image_crs is not None and gdf.crs is not None and gdf.crs != image_crs:
        gdf = gdf.to_crs(image_crs)

    height = profile["height"]
    width = profile["width"]
    transform = profile["transform"]

    if len(gdf) == 0:
        return np.zeros((height, width), dtype=np.float32)

    shapes = [(geom, 1) for geom in gdf.geometry if geom is not None and not geom.is_empty]
    if len(shapes) == 0:
        return np.zeros((height, width), dtype=np.float32)

    mask = rasterize(
        shapes=shapes,
        out_shape=(height, width),
        transform=transform,
        fill=0,
        dtype="uint8",
    )
    return mask.astype(np.float32)


def _read_raster_label(label_path: str, target_shape: tuple[int, int]) -> np.ndarray:
    """Read an already-rasterized label mask and resize (nearest) to match
    the image's pixel grid if the shapes don't already agree."""
    ext = Path(label_path).suffix.lower()
    if ext in {".tif", ".tiff"}:
        with rasterio.open(label_path) as src:
            mask = src.read(1)
    else:
        mask = cv2.imread(label_path, cv2.IMREAD_GRAYSCALE)
        if mask is None:
            raise ValueError(f"Failed to read raster label as image: {label_path}")
    mask = (mask > 0).astype(np.float32)
    if mask.shape != target_shape:
        mask = cv2.resize(mask, (target_shape[1], target_shape[0]), interpolation=cv2.INTER_NEAREST)
    return mask


def load_label_as_mask(label_path: str, profile: dict) -> np.ndarray:
    ext = Path(label_path).suffix.lower()
    if ext in VECTOR_EXTENSIONS:
        return _rasterize_vector_label(label_path, profile)
    elif ext in RASTER_EXTENSIONS:
        return _read_raster_label(label_path, (profile["height"], profile["width"]))
    else:
        raise ValueError(
            f"Unrecognized label file extension '{ext}' for {label_path}. "
            f"Expected one of {VECTOR_EXTENSIONS | RASTER_EXTENSIONS}."
        )


class SpaceNetBuildingDataset(Dataset):
    def __init__(self, samples: list[dict], cfg, augment: bool = False):
        """
        samples: list of dicts with keys 'tile_id', 'image_path', 'label_path'
                 (i.e. rows from manifest.csv, already train/val split).
        cfg: loaded config (see config.py).
        augment: whether to apply random flips (True for training split only).
        """
        self.samples = samples
        self.cfg = cfg
        self.augment = augment
        self.patch_size = cfg.preprocessing.patch_size
        self.mean = cfg.preprocessing.mean
        self.std = cfg.preprocessing.std

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        sample = self.samples[idx]
        image, profile = _read_image(sample["image_path"])
        mask = load_label_as_mask(sample["label_path"], profile)

        image = resize_image(image, self.patch_size)
        mask = resize_mask(mask, self.patch_size)

        if self.augment:
            image, mask = random_flip(image, mask)

        image = normalize_image(image, self.mean, self.std)
        image = to_chw(image)

        image_tensor = torch.from_numpy(image).float()
        mask_tensor = torch.from_numpy(mask).float().unsqueeze(0)  # (1,H,W)

        return image_tensor, mask_tensor
