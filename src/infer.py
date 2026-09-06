import argparse
import json
import logging
import re
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
import torch
import torch.nn.functional as F
import yaml
from PIL import Image, ImageDraw
from rasterio.features import shapes
from shapely.geometry import shape

from model import UNet


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | infer | %(message)s",
    datefmt="%H:%M:%S",
)

logger = logging.getLogger("infer")


config_patch_size = 512


def load_config(config_path):
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def normalize_image_for_model(image, mean, std):
    """
    Convert image to float32 and normalize it for the U-Net.

    Handles both uint8 and uint16 GeoTIFF imagery.
    """
    image = image.astype(np.float32)

    # Convert uint16 / high dynamic range imagery to 0-1.
    max_value = np.max(image)

    if max_value > 1.0:
        image = image / max_value

    mean = np.array(mean, dtype=np.float32).reshape(1, 1, 3)
    std = np.array(std, dtype=np.float32).reshape(1, 1, 3)

    image = (image - mean) / std

    return image


def stretch_to_uint8(image):
    """
    Convert high-dynamic-range RGB imagery into a visually useful
    8-bit RGB image for the overlay.

    Uses percentile stretching independently per band.
    """
    image = image.astype(np.float32)

    output = np.zeros_like(image, dtype=np.uint8)

    for band in range(image.shape[2]):
        channel = image[:, :, band]

        low = np.percentile(channel, 2)
        high = np.percentile(channel, 98)

        if high <= low:
            low = np.min(channel)
            high = np.max(channel)

        if high <= low:
            output[:, :, band] = 0
            continue

        stretched = (channel - low) / (high - low)
        stretched = np.clip(stretched, 0, 1)

        output[:, :, band] = (stretched * 255).astype(np.uint8)

    return output


def resize_for_model(image, patch_size):
    """
    Resize HWC image to the square input size required by U-Net.
    """
    tensor = torch.from_numpy(image.transpose(2, 0, 1)).float()
    tensor = tensor.unsqueeze(0)

    tensor = F.interpolate(
        tensor,
        size=(patch_size, patch_size),
        mode="bilinear",
        align_corners=False,
    )

    return tensor


def predict(model, image, device, mean, std):
    """
    Run U-Net inference and return a probability mask at the
    original image resolution.
    """
    original_height, original_width = image.shape[:2]

    normalized = normalize_image_for_model(
        image,
        mean,
        std,
    )

    input_tensor = resize_for_model(
        normalized,
        config_patch_size,
    ).to(device)

    with torch.no_grad():
        logits = model(input_tensor)
        probabilities = torch.sigmoid(logits)

    probabilities = F.interpolate(
        probabilities,
        size=(original_height, original_width),
        mode="bilinear",
        align_corners=False,
    )

    probability_mask = probabilities[0, 0].cpu().numpy()

    return probability_mask


def create_overlay(image_uint8, binary_mask):
    """
    Create a visible RGB overlay.

    Original imagery remains visible and predicted building regions
    are highlighted.
    """
    overlay = image_uint8.copy()

    mask = binary_mask.astype(bool)

    if np.any(mask):
        # Blend predicted regions with a highlight color.
        highlight = np.zeros_like(overlay)
        highlight[:, :, 0] = 255
        highlight[:, :, 1] = 80
        highlight[:, :, 2] = 80

        alpha = 0.45

        overlay[mask] = (
            overlay[mask].astype(np.float32) * (1 - alpha)
            + highlight[mask].astype(np.float32) * alpha
        ).astype(np.uint8)

    return overlay


def polygonize_mask(binary_mask, transform, crs):
    """
    Convert the binary raster mask into georeferenced polygons.
    """
    records = []

    for geom, value in shapes(
        binary_mask.astype(np.uint8),
        mask=binary_mask.astype(bool),
        transform=transform,
    ):
        if value != 1:
            continue

        polygon = shape(geom)

        if polygon.is_empty:
            continue

        if polygon.geom_type == "Polygon":
            records.append(
                {
                    "geometry": polygon,
                    "class": "building",
                }
            )

        elif polygon.geom_type == "MultiPolygon":
            for part in polygon.geoms:
                if not part.is_empty:
                    records.append(
                        {
                            "geometry": part,
                            "class": "building",
                        }
                    )

    if records:
        return gpd.GeoDataFrame(
            records,
            geometry="geometry",
            crs=crs,
        )

    return gpd.GeoDataFrame(
        {
            "geometry": [],
            "class": [],
        },
        geometry="geometry",
        crs=crs,
    )


def load_model(checkpoint_path, config, device):
    model = UNet(
        in_channels=config["model"]["in_channels"],
        out_channels=config["model"]["out_channels"],
        base_channels=config["model"]["base_channels"],
    )

    checkpoint = torch.load(
        checkpoint_path,
        map_location=device,
    )

    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
        epoch = checkpoint.get("epoch", "?")
        val_loss = checkpoint.get("val_loss", "?")
    else:
        model.load_state_dict(checkpoint)
        epoch = "?"
        val_loss = "?"

    model.to(device)
    model.eval()

    logger.info(
        "Loaded checkpoint: %s (epoch=%s, val_loss=%s)",
        checkpoint_path,
        epoch,
        val_loss,
    )

    return model


def main():
    parser = argparse.ArgumentParser(
        description="Run U-Net building footprint extraction."
    )

    parser.add_argument(
        "--config",
        required=True,
        help="Path to configuration YAML.",
    )

    parser.add_argument(
        "--checkpoint",
        required=True,
        help="Path to trained model checkpoint.",
    )

    parser.add_argument(
        "--input",
        required=True,
        help="Input RGB GeoTIFF.",
    )

    args = parser.parse_args()

    config = load_config(args.config)

    global config_patch_size
    config_patch_size = config["preprocessing"]["patch_size"]

    output_dir = Path(
        config["inference"]["output_dir"]
    )
    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    device = torch.device(
        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )

    logger.info(
        "Using device: %s",
        device,
    )

    input_path = Path(args.input)

    logger.info(
        "Running inference on: %s",
        input_path,
    )

    # ---------------------------------------------------------
    # LOAD IMAGE
    # ---------------------------------------------------------

    with rasterio.open(input_path) as src:
        image = src.read(
            indexes=[1, 2, 3]
        )

        transform = src.transform
        crs = src.crs

        profile = src.profile.copy()

    image = np.transpose(
        image,
        (1, 2, 0),
    )

    logger.info(
        "Input image shape=%s dtype=%s",
        image.shape,
        image.dtype,
    )

    # ---------------------------------------------------------
    # PREPARE VISUAL IMAGE
    # ---------------------------------------------------------

    visual_image = stretch_to_uint8(image)

    # ---------------------------------------------------------
    # LOAD MODEL
    # ---------------------------------------------------------

    model = load_model(
        args.checkpoint,
        config,
        device,
    )

    # ---------------------------------------------------------
    # PREDICTION
    # ---------------------------------------------------------

    probability_mask = predict(
        model=model,
        image=image,
        device=device,
        mean=config["preprocessing"]["mean"],
        std=config["preprocessing"]["std"],
    )

    threshold = config["inference"]["mask_threshold"]

    binary_mask = (
        probability_mask >= threshold
    ).astype(np.uint8)

    predicted_pixels = int(
        np.sum(binary_mask)
    )

    if predicted_pixels > 0:
        average_confidence = float(
            np.mean(
                probability_mask[
                    binary_mask == 1
                ]
            )
        )
    else:
        average_confidence = 0.0

    # ---------------------------------------------------------
    # OUTPUT NAMES
    # ---------------------------------------------------------

    stem = input_path.stem

    mask_path = (
        output_dir
        / f"{stem}_predicted_mask.tif"
    )

    geojson_path = (
        output_dir
        / f"{stem}_building_footprints.geojson"
    )

    overlay_path = (
        output_dir
        / f"{stem}_prediction_overlay.png"
    )

    # ---------------------------------------------------------
    # SAVE GEOREFERENCED MASK
    # ---------------------------------------------------------

    mask_profile = profile.copy()

    mask_profile.update(
        driver="GTiff",
        dtype=rasterio.uint8,
        count=1,
        height=binary_mask.shape[0],
        width=binary_mask.shape[1],
        transform=transform,
        crs=crs,
        compress="lzw",
    )

    with rasterio.open(
        mask_path,
        "w",
        **mask_profile,
    ) as dst:
        dst.write(
            binary_mask,
            1,
        )

    logger.info(
        "Saved georeferenced mask (CRS=%s) -> %s",
        crs,
        mask_path,
    )

    # ---------------------------------------------------------
    # POLYGONIZATION
    # ---------------------------------------------------------

    gdf = polygonize_mask(
        binary_mask=binary_mask,
        transform=transform,
        crs=crs,
    )

    building_count = len(gdf)

    logger.info(
        "Created %d records",
        building_count,
    )

    logger.info(
        "Detected building polygons: %d",
        building_count,
    )

    gdf.to_file(
        geojson_path,
        driver="GeoJSON",
    )

    logger.info(
        "Saved building footprints -> %s",
        geojson_path,
    )

    # ---------------------------------------------------------
    # CREATE OVERLAY
    # ---------------------------------------------------------

    overlay = create_overlay(
        visual_image,
        binary_mask,
    )

    overlay_image = Image.fromarray(
        overlay,
        mode="RGB",
    )

    # Draw a simple legend.
    draw = ImageDraw.Draw(
        overlay_image
    )

    legend_x = 15
    legend_y = 15

    draw.rectangle(
        [
            legend_x,
            legend_y,
            legend_x + 25,
            legend_y + 25,
        ],
        fill=(255, 80, 80),
    )

    draw.text(
        (
            legend_x + 35,
            legend_y + 5,
        ),
        "AI Building Prediction",
        fill=(255, 255, 255),
    )

    overlay_image.save(
        overlay_path
    )

    logger.info(
        "Saved prediction overlay -> %s",
        overlay_path,
    )

    # ---------------------------------------------------------
    # MACHINE-READABLE RESULT
    # ---------------------------------------------------------

    result = {
        "success": True,
        "building_count": building_count,
        "average_confidence": average_confidence,
        "predicted_pixels": predicted_pixels,
        "threshold": threshold,
        "mask_path": str(mask_path),
        "geojson_path": str(geojson_path),
        "overlay_path": str(overlay_path),
    }

    print(
        "INFERENCE_RESULT="
        + json.dumps(result)
    )

    logger.info(
        "Predicted building pixels: %d",
        predicted_pixels,
    )

    logger.info(
        "Average building confidence: %.4f",
        average_confidence,
    )

    logger.info(
        "Inference completed successfully."
    )


if __name__ == "__main__":
    main()