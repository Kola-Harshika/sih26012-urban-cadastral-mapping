"""
Trains the U-Net on the manifest built by build_manifest.py.

Usage:
    python src/train.py --config configs/config.yaml

Requires:
    - data/manifest.csv to exist and be non-empty (run build_manifest.py first)
    - the actual image/label files it references to be present on disk
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import torch
from torch.utils.data import DataLoader
from sklearn.model_selection import train_test_split
from tqdm import tqdm

from config import load_config
from dataset import SpaceNetBuildingDataset
from model import build_model
from utils import get_device, get_logger, set_seed

logger = get_logger("train")


def load_manifest(manifest_path: str) -> list[dict]:
    path = Path(manifest_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Manifest not found at {manifest_path}. Run "
            f"'python src/build_manifest.py --config configs/config.yaml' first."
        )
    with open(path, "r") as f:
        rows = list(csv.DictReader(f))
    if len(rows) == 0:
        raise ValueError(
            f"Manifest at {manifest_path} is empty. Nothing to train on -- "
            f"check data.image_glob / data.label_glob / data.tile_id_regex "
            f"in configs/config.yaml against your actual SpaceNet 2 files."
        )
    return rows


def dice_loss(logits: torch.Tensor, targets: torch.Tensor, eps: float = 1e-6) -> torch.Tensor:
    """Soft Dice loss, used alongside BCE to help with the class imbalance
    typical in building-footprint masks (buildings are usually a minority
    of pixels vs. background)."""
    probs = torch.sigmoid(logits)
    probs_flat = probs.view(probs.size(0), -1)
    targets_flat = targets.view(targets.size(0), -1)
    intersection = (probs_flat * targets_flat).sum(dim=1)
    union = probs_flat.sum(dim=1) + targets_flat.sum(dim=1)
    dice = (2 * intersection + eps) / (union + eps)
    return 1 - dice.mean()


def run_epoch(model, loader, optimizer, bce_loss_fn, device, train: bool) -> float:
    model.train(mode=train)
    total_loss = 0.0
    context = torch.enable_grad() if train else torch.no_grad()
    with context:
        for images, masks in tqdm(loader, leave=False):
            images = images.to(device)
            masks = masks.to(device)

            logits = model(images)
            loss = bce_loss_fn(logits, masks) + dice_loss(logits, masks)

            if train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * images.size(0)

    return total_loss / len(loader.dataset)


def main():
    parser = argparse.ArgumentParser(description="Train Stage 1 building-footprint model.")
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    args = parser.parse_args()

    cfg = load_config(args.config)
    set_seed(cfg.data.split_seed)
    device = get_device()
    logger.info(f"Using device: {device}")

    rows = load_manifest(cfg.data.manifest_path)
    train_rows, val_rows = train_test_split(
        rows, test_size=cfg.data.val_split, random_state=cfg.data.split_seed
    )
    logger.info(f"Train samples: {len(train_rows)} | Val samples: {len(val_rows)}")

    train_dataset = SpaceNetBuildingDataset(train_rows, cfg, augment=True)
    val_dataset = SpaceNetBuildingDataset(val_rows, cfg, augment=False)

    train_loader = DataLoader(
        train_dataset,
        batch_size=cfg.training.batch_size,
        shuffle=True,
        num_workers=cfg.training.num_workers,
    )
    val_loader = DataLoader(
        val_dataset,
        batch_size=cfg.training.batch_size,
        shuffle=False,
        num_workers=cfg.training.num_workers,
    )

    model = build_model(cfg).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=cfg.training.learning_rate)
    bce_loss_fn = torch.nn.BCEWithLogitsLoss()

    checkpoint_dir = Path(cfg.training.checkpoint_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    best_ckpt_path = checkpoint_dir / cfg.training.best_checkpoint_name

    best_val_loss = float("inf")

    for epoch in range(1, cfg.training.num_epochs + 1):
        train_loss = run_epoch(model, train_loader, optimizer, bce_loss_fn, device, train=True)
        val_loss = run_epoch(model, val_loader, optimizer, bce_loss_fn, device, train=False)

        logger.info(
            f"Epoch {epoch}/{cfg.training.num_epochs} | "
            f"train_loss={train_loss:.4f} | val_loss={val_loss:.4f}"
        )

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "val_loss": val_loss,
                    "config": {
                        "in_channels": cfg.model.in_channels,
                        "out_channels": cfg.model.out_channels,
                        "base_channels": cfg.model.base_channels,
                        "patch_size": cfg.preprocessing.patch_size,
                        "mean": cfg.preprocessing.mean,
                        "std": cfg.preprocessing.std,
                    },
                },
                best_ckpt_path,
            )
            logger.info(f"Saved new best checkpoint (val_loss={val_loss:.4f}) -> {best_ckpt_path}")

    logger.info(f"Training complete. Best val_loss={best_val_loss:.4f}")


if __name__ == "__main__":
    main()
