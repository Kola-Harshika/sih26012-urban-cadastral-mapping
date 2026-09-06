# SIH26012 — Stage 1: AI Building-Footprint Extraction

**Scope of this repository:** Stage 1 ONLY — building-footprint segmentation
on the SpaceNet 2 dataset. This is the foundation for the full "AI-Based
Automated Urban Parcel Mapping and Cadastral Feature Extraction System"
(PS ID SIH26012), which will add road extraction, parcel delineation,
land-use classification, topology validation, and a Web-GIS dashboard in
later stages — none of that is included here.

## What this does

1. Loads SpaceNet 2 aerial imagery + building-footprint labels.
2. Trains a U-Net to predict a pixel-level building mask.
3. Runs inference on a new image to produce a predicted mask.
4. Converts that mask into building-footprint polygons and saves GeoJSON.

Mask prediction and polygon extraction are deliberately separate steps —
see `src/infer.py` (model → mask) and `src/mask_to_polygons.py` (mask →
polygons).

## Requirements

- Python 3.10+
- No GPU required (auto-detected and used if available; CPU otherwise —
  training on CPU will be slow, which is expected for a first prototype)
- No paid APIs, no cloud services
- You must download SpaceNet 2 yourself — nothing here downloads data

## 1. Install

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

> **Note on GDAL/rasterio/geopandas:** these have native (non-pure-Python)
> dependencies. On most systems `pip install -r requirements.txt` handles
> it, but if `rasterio`/`geopandas` fail to install, use `conda`/`mamba`
> instead (`conda install -c conda-forge rasterio geopandas`), which
> resolves the underlying GDAL/GEOS/PROJ libraries more reliably.

## 2. Get the data in place

Download SpaceNet 2 (e.g. from the SpaceNet AWS Open Data buckets, or a
Kaggle mirror) and place it under:

```
data/raw/
```

Full details, including what to do if your label format differs, are in
`data/README.md`. **Read that before continuing** — it explains why you
may need to edit `configs/config.yaml`'s glob patterns to match your
actual downloaded filenames.

## 3. Build the image/label manifest

```bash
python src/build_manifest.py --config configs/config.yaml
```

This scans `data/raw/`, pairs each image with its label by tile ID, and
writes `data/manifest.csv`. **Open this file and sanity-check a few rows**
before training — if it's empty or pairs look wrong, fix the glob
patterns / regex in `configs/config.yaml` and re-run.

## 4. Train

```bash
python src/train.py --config configs/config.yaml
```

- Splits the manifest into train/val (ratio set by `data.val_split`).
- Trains the U-Net (BCE + Dice loss), printing train/val loss per epoch.
- Saves the best checkpoint (by validation loss) to
  `checkpoints/best_model.pt`.
- All hyperparameters (epochs, batch size, learning rate, patch size,
  model width) are in `configs/config.yaml` — edit there, not in code.

## 5. Run inference on a new image

```bash
python src/infer.py --config configs/config.yaml --image data/raw/<some_tile>.tif
```

Produces `outputs/<tile>_predicted_mask.tif`:
- If the input image had CRS/transform metadata, the output mask is a
  proper georeferenced GeoTIFF using that same CRS/transform.
- If not, a plain (non-georeferenced) PNG is written instead, with a
  console warning — geographic coordinates are never invented.

## 6. Convert the predicted mask into building polygons

```bash
python src/mask_to_polygons.py --mask outputs/<tile>_predicted_mask.tif --out outputs/predicted_footprints.geojson
```

Produces `outputs/predicted_footprints.geojson` — the final Stage 1
deliverable: vector building-footprint polygons (not cadastral parcels;
that's a later stage).

## Project structure

```
sih26012_stage1_building_footprint/
├── README.md
├── requirements.txt
├── configs/config.yaml          # all paths + hyperparameters, edit this first
├── data/
│   ├── README.md                # where/how to place SpaceNet 2 data
│   └── raw/                     # <- you create this, put SpaceNet 2 here
├── src/
│   ├── config.py                # config.yaml loader
│   ├── utils.py                 # device detection, seeding, logging
│   ├── build_manifest.py        # pairs images<->labels -> manifest.csv
│   ├── dataset.py                # PyTorch Dataset; rasterizes geojson labels
│   ├── transforms.py             # resize/normalize/augment
│   ├── model.py                    # U-Net architecture
│   ├── train.py                     # training loop + checkpointing
│   ├── infer.py                      # run model on one image -> mask
│   └── mask_to_polygons.py           # mask -> building polygons -> GeoJSON
├── checkpoints/                       # trained model weights land here
└── outputs/                            # predicted masks / geojson land here
```

## Why these choices (brief)

- **Model:** U-Net — the standard, well-understood baseline for aerial
  image segmentation, works without a pretrained backbone, trains on CPU,
  and is easy to later swap for a stronger encoder. See the docstring in
  `src/model.py` for more detail.
- **Manifest-based pairing instead of hardcoded paths:** SpaceNet 2's
  exact directory/file naming differs across AOI releases and mirrors, so
  `build_manifest.py` discovers files via configurable glob patterns and
  a regex, rather than assuming a fixed layout.
- **Separate mask vs. polygon steps:** a segmentation model produces
  pixel masks; polygons are a distinct geometric post-processing step
  (`rasterio.features.shapes` + `geopandas`). Conflating the two would
  misrepresent what the model actually outputs.

## Explicitly out of scope for this repository

Roads/pathways, cadastral parcel delineation, land-use classification,
DSM/DTM handling, GNSS/CORS integration, topology validation, and the
Web-GIS dashboard — all planned for later stages, not started here.
