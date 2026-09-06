"""
A compact U-Net for binary building-footprint segmentation.

Why U-Net for this first prototype:
  - It's the standard, well-understood baseline for pixel-level semantic
    segmentation on aerial/satellite imagery, including building
    extraction specifically (this is the architecture family SpaceNet
    baseline solutions are usually built on).
  - The encoder-decoder + skip-connection design preserves the fine
    spatial detail needed for building edges, which a plain
    classification CNN would lose through pooling.
  - It has no dependency on a pretrained backbone or large batch sizes,
    so it trains (slowly) on CPU -- important since this must run
    without assuming a GPU.
  - It's intentionally shallow/narrow here (base_channels default 32,
    4 encoder stages) specifically so it's easy to later swap in a
    stronger encoder (e.g. a ResNet/EfficientNet backbone via
    segmentation_models_pytorch) without changing the training/inference
    pipeline around it.
"""

from __future__ import annotations

import torch
import torch.nn as nn


class DoubleConv(nn.Module):
    """(Conv -> BatchNorm -> ReLU) x 2 -- the basic U-Net building block."""

    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class Down(nn.Module):
    """Downscale then double conv."""

    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.pool_conv = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_channels, out_channels),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.pool_conv(x)


class Up(nn.Module):
    """Upscale, concatenate with encoder skip connection, then double conv."""

    def __init__(self, in_channels: int, skip_channels: int, out_channels: int):
        super().__init__()
        self.up = nn.ConvTranspose2d(in_channels, in_channels // 2, kernel_size=2, stride=2)
        self.conv = DoubleConv(in_channels // 2 + skip_channels, out_channels)

    def forward(self, x: torch.Tensor, skip: torch.Tensor) -> torch.Tensor:
        x = self.up(x)
        # Handle any off-by-one size mismatch from odd input dimensions.
        diff_h = skip.shape[2] - x.shape[2]
        diff_w = skip.shape[3] - x.shape[3]
        x = nn.functional.pad(x, [diff_w // 2, diff_w - diff_w // 2, diff_h // 2, diff_h - diff_h // 2])
        x = torch.cat([skip, x], dim=1)
        return self.conv(x)


class UNet(nn.Module):
    """
    Standard 4-level U-Net.

    in_channels: number of input image channels (3 for RGB).
    out_channels: number of output classes (1 for binary building mask;
                  the raw logits are meant to be passed through
                  BCEWithLogitsLoss during training, and sigmoid at
                  inference time).
    base_channels: width of the first encoder stage; each stage doubles.
    """

    def __init__(self, in_channels: int = 3, out_channels: int = 1, base_channels: int = 32):
        super().__init__()
        c1, c2, c3, c4, c5 = (
            base_channels,
            base_channels * 2,
            base_channels * 4,
            base_channels * 8,
            base_channels * 16,
        )

        self.inc = DoubleConv(in_channels, c1)
        self.down1 = Down(c1, c2)
        self.down2 = Down(c2, c3)
        self.down3 = Down(c3, c4)
        self.down4 = Down(c4, c5)

        self.up1 = Up(c5, c4, c4)
        self.up2 = Up(c4, c3, c3)
        self.up3 = Up(c3, c2, c2)
        self.up4 = Up(c2, c1, c1)

        self.outc = nn.Conv2d(c1, out_channels, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)

        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)

        logits = self.outc(x)
        return logits


def build_model(cfg) -> UNet:
    return UNet(
        in_channels=cfg.model.in_channels,
        out_channels=cfg.model.out_channels,
        base_channels=cfg.model.base_channels,
    )
