from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import shapes
from shapely.geometry import shape
import geopandas as gpd


def extract_roads(input_path, output_dir):
    """
    Prototype road extraction from RGB GeoTIFF.

    Uses image characteristics to identify likely road-like regions
    and converts them into georeferenced polygons.
    """

    input_path = Path(input_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    with rasterio.open(input_path) as src:
        image = src.read([1, 2, 3]).astype(np.float32)
        transform = src.transform
        crs = src.crs

    # Convert CHW -> HWC
    image = np.transpose(image, (1, 2, 0))

    # Normalize each band
    normalized = np.zeros_like(image)

    for i in range(3):
        band = image[:, :, i]

        low = np.percentile(band, 2)
        high = np.percentile(band, 98)

        if high > low:
            normalized[:, :, i] = (
                (band - low) / (high - low)
            )
        else:
            normalized[:, :, i] = 0

    # ---------------------------------------------------------
    # Basic road-like pixel detection
    # ---------------------------------------------------------
    #
    # Roads often have relatively similar RGB values.
    # This is a prototype heuristic, NOT the final AI model.
    #

    r = normalized[:, :, 0]
    g = normalized[:, :, 1]
    b = normalized[:, :, 2]

    brightness = (r + g + b) / 3.0

    color_difference = (
        np.maximum.reduce([r, g, b])
        - np.minimum.reduce([r, g, b])
    )

    road_mask = (
        (brightness > 0.25)
        & (brightness < 0.85)
        & (color_difference < 0.18)
    )

    road_mask = road_mask.astype(np.uint8)

    # ---------------------------------------------------------
    # Convert road mask to polygons
    # ---------------------------------------------------------

    records = []

    for geom, value in shapes(
        road_mask,
        mask=road_mask.astype(bool),
        transform=transform,
    ):
        if value != 1:
            continue

        polygon = shape(geom)

        if polygon.is_empty:
            continue

        # Ignore extremely tiny regions
        if polygon.area <= 0:
            continue

        records.append(
            {
                "geometry": polygon,
                "class": "road",
            }
        )

    if records:
        gdf = gpd.GeoDataFrame(
            records,
            geometry="geometry",
            crs=crs,
        )
    else:
        gdf = gpd.GeoDataFrame(
            {
                "geometry": [],
                "class": [],
            },
            geometry="geometry",
            crs=crs,
        )

    # ---------------------------------------------------------
    # Save GeoJSON
    # ---------------------------------------------------------

    output_path = (
        output_dir
        / f"{input_path.stem}_road_features.geojson"
    )

    gdf.to_file(
        output_path,
        driver="GeoJSON",
    )

    print(f"Road features detected: {len(gdf)}")
    print(f"Saved road layer: {output_path}")

    return {
        "road_count": len(gdf),
        "road_geojson": str(output_path),
    }


if __name__ == "__main__":

    import argparse

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--input",
        required=True,
    )

    parser.add_argument(
        "--output",
        default="outputs",
    )

    args = parser.parse_args()

    extract_roads(
        args.input,
        args.output,
    )