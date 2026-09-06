"""
Converts a predicted binary building mask (GeoTIFF, from infer.py) into
building-footprint POLYGONS and saves them as GeoJSON.

This is intentionally a separate step from the model / infer.py: the
model only ever produces a pixel-level mask. Turning that into vector
polygons -- and, further down the line in later stages, into cadastral
parcel geometry -- is distinct GIS post-processing, not something the
segmentation model itself does.

Usage:
    python src/mask_to_polygons.py --mask outputs/<tile>_predicted_mask.tif \
        --out outputs/predicted_footprints.geojson
"""

from __future__ import annotations

import argparse
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.features import shapes
from shapely.geometry import shape

from utils import get_logger

logger = get_logger("mask_to_polygons")


def mask_to_geodataframe(mask_path: str, min_area_px: int = 4) -> gpd.GeoDataFrame:
    with rasterio.open(mask_path) as src:
        mask = src.read(1)
        transform = src.transform
        crs = src.crs

    if crs is None:
        logger.warning(
            "Mask has no CRS -- output polygons will be in raw pixel/array "
            "coordinates, not real-world geographic coordinates. This "
            "happens when the original input image had no georeferencing."
        )

    binary = (mask > 0).astype(np.uint8)

    polygons = []
    for geom, value in shapes(binary, mask=binary, transform=transform):
        if value != 1:
            continue
        poly = shape(geom)
        if poly.area < min_area_px:
            continue  # drop tiny noise polygons from thresholding artifacts
        polygons.append(poly)

    logger.info(f"Vectorized {len(polygons)} building polygon(s) from mask.")

    gdf = gpd.GeoDataFrame({"geometry": polygons}, crs=crs)
    gdf["area"] = gdf.geometry.area
    return gdf


def main():
    parser = argparse.ArgumentParser(description="Vectorize a predicted mask into building polygons.")
    parser.add_argument("--mask", type=str, required=True, help="Path to predicted mask GeoTIFF")
    parser.add_argument(
        "--out", type=str, default="outputs/predicted_footprints.geojson", help="Output GeoJSON path"
    )
    parser.add_argument(
        "--min-area-px",
        type=float,
        default=4,
        help="Minimum polygon area (in the mask's coordinate units) to keep, filters noise",
    )
    args = parser.parse_args()

    gdf = mask_to_geodataframe(args.mask, min_area_px=args.min_area_px)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    gdf.to_file(out_path, driver="GeoJSON")
    logger.info(f"Saved {len(gdf)} building footprint polygon(s) -> {out_path}")


if __name__ == "__main__":
    main()
