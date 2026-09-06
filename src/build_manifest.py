"""
Scans data/raw/ for image and label files using the glob patterns in
configs/config.yaml, extracts a shared "tile id" from each filename using
a configurable regex, and pairs them up into data/manifest.csv.

This exists specifically so the rest of the pipeline never has to guess
or hardcode SpaceNet's internal file naming -- you point this script at
your actual download, inspect the output, and fix the config if the
pairing looks wrong before you train anything.

Usage:
    python src/build_manifest.py --config configs/config.yaml
"""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path

from config import load_config
from utils import get_logger

logger = get_logger("build_manifest")


def find_files(raw_dir: Path, pattern: str) -> list[Path]:
    matches = sorted(raw_dir.glob(pattern))
    return matches


def extract_tile_id(path: Path, regex: re.Pattern) -> str | None:
    match = regex.search(path.name)
    if match is None:
        return None
    if match.groups():
        return match.group(1)
    return match.group(0)


def build_manifest(cfg) -> int:
    raw_dir = Path(cfg.data.raw_dir)
    if not raw_dir.exists():
        raise FileNotFoundError(
            f"data.raw_dir does not exist: {raw_dir}\n"
            "Place your SpaceNet 2 download there first (see data/README.md)."
        )

    regex = re.compile(cfg.data.tile_id_regex)

    image_paths = find_files(raw_dir, cfg.data.image_glob)
    label_paths = find_files(raw_dir, cfg.data.label_glob)

    logger.info(f"Found {len(image_paths)} candidate image file(s) under {raw_dir}")
    logger.info(f"Found {len(label_paths)} candidate label file(s) under {raw_dir}")

    if len(image_paths) == 0:
        logger.warning(
            "No image files matched data.image_glob. Check the pattern in "
            "configs/config.yaml against your actual folder layout."
        )
    if len(label_paths) == 0:
        logger.warning(
            "No label files matched data.label_glob. Check the pattern in "
            "configs/config.yaml against your actual folder layout."
        )

    label_by_id: dict[str, Path] = {}
    for label_path in label_paths:
        tile_id = extract_tile_id(label_path, regex)
        if tile_id is None:
            logger.warning(f"Could not extract tile id from label file: {label_path.name}")
            continue
        if tile_id in label_by_id:
            logger.warning(
                f"Duplicate tile id '{tile_id}' from label {label_path.name} "
                f"(already matched to {label_by_id[tile_id].name}); keeping first match."
            )
            continue
        label_by_id[tile_id] = label_path

    pairs: list[tuple[str, str, str]] = []
    unmatched_images: list[str] = []

    for image_path in image_paths:
        tile_id = extract_tile_id(image_path, regex)
        if tile_id is None:
            logger.warning(f"Could not extract tile id from image file: {image_path.name}")
            continue
        label_path = label_by_id.get(tile_id)
        if label_path is None:
            unmatched_images.append(image_path.name)
            continue
        pairs.append((tile_id, str(image_path), str(label_path)))

    if unmatched_images:
        logger.warning(
            f"{len(unmatched_images)} image(s) had no matching label and were skipped "
            f"(e.g. {unmatched_images[:3]})"
        )

    manifest_path = Path(cfg.data.manifest_path)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)

    with open(manifest_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["tile_id", "image_path", "label_path"])
        writer.writerows(pairs)

    logger.info(f"Wrote {len(pairs)} image/label pair(s) to {manifest_path}")
    if len(pairs) == 0:
        logger.error(
            "Manifest is empty. Nothing will be trainable until image_glob, "
            "label_glob, and tile_id_regex in configs/config.yaml actually "
            "match your downloaded SpaceNet 2 files."
        )
    return len(pairs)


def main():
    parser = argparse.ArgumentParser(description="Build image/label manifest for Stage 1.")
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    args = parser.parse_args()

    cfg = load_config(args.config)
    build_manifest(cfg)


if __name__ == "__main__":
    main()
