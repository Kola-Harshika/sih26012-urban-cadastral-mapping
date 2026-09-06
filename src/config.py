"""
Loads configs/config.yaml into plain Python objects.

Kept intentionally simple (nested dict-like access via attribute lookup)
rather than a heavyweight config framework, since Stage 1 only needs a
handful of values shared across build_manifest.py, train.py, and infer.py.
"""

from __future__ import annotations

import yaml
from pathlib import Path
from types import SimpleNamespace


def _to_namespace(obj):
    """Recursively convert nested dicts into SimpleNamespace for dot access."""
    if isinstance(obj, dict):
        return SimpleNamespace(**{k: _to_namespace(v) for k, v in obj.items()})
    if isinstance(obj, list):
        return [_to_namespace(v) for v in obj]
    return obj


def load_config(config_path: str | Path) -> SimpleNamespace:
    """
    Load the YAML config file and return a nested SimpleNamespace so that
    values can be accessed as e.g. cfg.data.raw_dir instead of
    cfg["data"]["raw_dir"].

    Also resolves a couple of path-like fields to absolute paths relative
    to the config file's parent project root, so scripts work regardless
    of the current working directory they're launched from.
    """
    config_path = Path(config_path).resolve()
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with open(config_path, "r") as f:
        raw = yaml.safe_load(f)

    project_root = config_path.parent.parent  # configs/config.yaml -> project root
    cfg = _to_namespace(raw)

    # Resolve relative paths against the project root so this works whether
    # you run `python src/train.py` from the project root or elsewhere.
    cfg.data.raw_dir = str((project_root / cfg.data.raw_dir).resolve())
    cfg.data.manifest_path = str((project_root / cfg.data.manifest_path).resolve())
    cfg.training.checkpoint_dir = str((project_root / cfg.training.checkpoint_dir).resolve())
    cfg.inference.output_dir = str((project_root / cfg.inference.output_dir).resolve())

    cfg.project_root = str(project_root)
    return cfg
