from pathlib import Path
import argparse
import json

import geopandas as gpd
from shapely.geometry import box
from shapely.ops import unary_union


def load_layer(path):
    if not path.exists():
        return None

    gdf = gpd.read_file(path)

    if gdf.empty:
        return None

    # Remove invalid/empty geometries
    gdf = gdf[gdf.geometry.notna()]
    gdf = gdf[~gdf.geometry.is_empty]

    if gdf.empty:
        return None

    # Fix simple geometry problems
    gdf["geometry"] = gdf.geometry.buffer(0)

    return gdf


def generate_candidate_parcels(buildings, roads):
    """
    Generate candidate urban parcel polygons from
    detected buildings and road features.

    This is a GIS-based prototype for candidate parcel
    delineation. It is NOT a replacement for official
    cadastral boundaries.
    """

    layers = []

    if buildings is not None:
        layers.append(buildings)

    if roads is not None:
        layers.append(roads)

    if not layers:
        raise ValueError("No building or road features available.")

    # Use the first layer's CRS as the working CRS
    base = layers[0]

    # Reproject all layers to the same CRS
    if buildings is not None and roads is not None:
        if buildings.crs != roads.crs:
            roads = roads.to_crs(buildings.crs)

    # Determine overall analysis area
    all_geometries = []

    if buildings is not None:
        all_geometries.extend(
            buildings.geometry.tolist()
        )

    if roads is not None:
        all_geometries.extend(
            roads.geometry.tolist()
        )

    combined = unary_union(all_geometries)

    if combined.is_empty:
        raise ValueError("Detected geometries are empty.")

    # Create a bounding analysis area
    minx, miny, maxx, maxy = combined.bounds

    # Small margin around detected features
    width = maxx - minx
    height = maxy - miny

    margin_x = width * 0.02 if width > 0 else 1
    margin_y = height * 0.02 if height > 0 else 1

    analysis_area = box(
        minx - margin_x,
        miny - margin_y,
        maxx + margin_x,
        maxy + margin_y,
    )

    # --------------------------------------------------
    # Create candidate cells
    # --------------------------------------------------
    #
    # A regular grid provides stable candidate parcels
    # when official parcel boundaries are unavailable.
    #
    # Grid density adapts to the detected area.
    #

    target_cells = 100

    area_width = maxx - minx
    area_height = maxy - miny

    if area_width <= 0 or area_height <= 0:
        raise ValueError("Invalid analysis area.")

    cell_size = (
        (area_width * area_height) / target_cells
    ) ** 0.5

    cell_size = max(cell_size, 1e-6)

    cells = []

    x = minx - margin_x

    while x < maxx + margin_x:
        y = miny - margin_y

        while y < maxy + margin_y:

            cell = box(
                x,
                y,
                x + cell_size,
                y + cell_size,
            )

            clipped = cell.intersection(analysis_area)

            if not clipped.is_empty:
                cells.append(clipped)

            y += cell_size

        x += cell_size

    if not cells:
        raise ValueError("Could not generate candidate parcel cells.")

    parcels = gpd.GeoDataFrame(
        {
            "parcel_id": [
                f"P-{i + 1:04d}"
                for i in range(len(cells))
            ],
            "source": [
                "building_road_candidate_delineation"
            ] * len(cells),
        },
        geometry=cells,
        crs=base.crs,
    )

    # --------------------------------------------------
    # Remove cells that contain no detected features
    # --------------------------------------------------

    feature_union = unary_union(all_geometries)

    keep = parcels.geometry.intersects(feature_union)

    parcels = parcels[keep].copy()

    # Remove extremely tiny geometries
    if not parcels.empty:
        areas = parcels.geometry.area
        minimum_area = areas.max() * 0.01

        parcels = parcels[
            areas >= minimum_area
        ].copy()

    # Re-number parcel IDs
    parcels["parcel_id"] = [
        f"P-{i + 1:04d}"
        for i in range(len(parcels))
    ]

    return parcels


def main():
    parser = argparse.ArgumentParser(
        description="Generate candidate parcel boundaries."
    )

    parser.add_argument(
        "--buildings",
        required=True,
        help="Building footprint GeoJSON",
    )

    parser.add_argument(
        "--roads",
        required=True,
        help="Road feature GeoJSON",
    )

    parser.add_argument(
        "--output",
        required=True,
        help="Output parcel GeoJSON",
    )

    args = parser.parse_args()

    building_path = Path(args.buildings)
    road_path = Path(args.roads)
    output_path = Path(args.output)

    print("Loading building footprints...")
    buildings = load_layer(building_path)

    print("Loading road features...")
    roads = load_layer(road_path)

    if buildings is None:
        raise ValueError(
            "Building GeoJSON could not be loaded."
        )

    if roads is None:
        raise ValueError(
            "Road GeoJSON could not be loaded."
        )

    print("Generating candidate parcel boundaries...")

    parcels = generate_candidate_parcels(
        buildings,
        roads,
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    parcels.to_file(
        output_path,
        driver="GeoJSON",
    )

    print(
        f"Candidate parcels generated: {len(parcels)}"
    )

    print(
        f"Saved parcel layer: {output_path}"
    )

    # Machine-readable result for backend
    result = {
        "parcel_count": int(len(parcels)),
        "output": str(output_path),
    }

    print(
        "PARCEL_RESULT="
        + json.dumps(result)
    )


if __name__ == "__main__":
    main()