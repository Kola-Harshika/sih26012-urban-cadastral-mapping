from pathlib import Path
import json
import logging
import re
import subprocess
import sys

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse


# ---------------------------------------------------------
# APP SETUP
# ---------------------------------------------------------

app = FastAPI(title="SIH26012 AI Cadastral Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

UPLOAD_DIR = PROJECT_ROOT / "uploads"
OUTPUT_DIR = PROJECT_ROOT / "outputs"

INFER_SCRIPT = PROJECT_ROOT / "src" / "infer.py"
ROAD_SCRIPT = PROJECT_ROOT / "src" / "road_extraction.py"
PARCEL_SCRIPT = PROJECT_ROOT / "src" / "parcel_extraction.py"

CONFIG_FILE = PROJECT_ROOT / "configs" / "config.yaml"
CHECKPOINT_FILE = PROJECT_ROOT / "checkpoints" / "best_model.pt"

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------
# BASIC ROUTE
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "running",
        "service": "SIH26012 AI Cadastral Analysis API",
    }


# ---------------------------------------------------------
# AI ANALYSIS
# ---------------------------------------------------------

@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):

    # -----------------------------------------------------
    # VALIDATE FILE
    # -----------------------------------------------------

    if not file.filename:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "No file selected.",
            },
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in [".tif", ".tiff"]:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": "Please upload a GeoTIFF (.tif or .tiff) file.",
            },
        )

    # -----------------------------------------------------
    # SAVE UPLOADED IMAGE
    # -----------------------------------------------------

    input_path = UPLOAD_DIR / Path(file.filename).name

    with open(input_path, "wb") as buffer:
        buffer.write(await file.read())

    logger.info("Uploaded file: %s", input_path)

    # -----------------------------------------------------
    # CHECK REQUIRED FILES
    # -----------------------------------------------------

    missing = []

    if not INFER_SCRIPT.exists():
        missing.append(str(INFER_SCRIPT))

    if not ROAD_SCRIPT.exists():
        missing.append(str(ROAD_SCRIPT))

    if not PARCEL_SCRIPT.exists():
        missing.append(str(PARCEL_SCRIPT))

    if not CONFIG_FILE.exists():
        missing.append(str(CONFIG_FILE))

    if not CHECKPOINT_FILE.exists():
        missing.append(str(CHECKPOINT_FILE))

    if missing:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Required project files are missing.",
                "missing": missing,
            },
        )

    # =====================================================
    # 1. BUILDING FOOTPRINT EXTRACTION
    # =====================================================

    building_command = [
        sys.executable,
        str(INFER_SCRIPT),
        "--config",
        str(CONFIG_FILE),
        "--checkpoint",
        str(CHECKPOINT_FILE),
        "--input",
        str(input_path),
    ]

    logger.info("RUNNING BUILDING AI INFERENCE")
    logger.info("Command: %s", building_command)

    try:
        building_process = subprocess.run(
            building_command,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
        )

    except Exception as exc:
        logger.exception("Building inference failed.")

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Could not start building inference: {exc}",
            },
        )

    logger.info(
        "BUILDING STDOUT:\n%s",
        building_process.stdout,
    )

    logger.info(
        "BUILDING STDERR:\n%s",
        building_process.stderr,
    )

    if building_process.returncode != 0:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Building AI inference failed.",
                "details": building_process.stderr[-4000:],
            },
        )

    # -----------------------------------------------------
    # PARSE BUILDING RESULT
    # -----------------------------------------------------

    building_result = {}

    match = re.search(
        r"INFERENCE_RESULT=(\{.*\})",
        building_process.stdout,
    )

    if match:
        try:
            building_result = json.loads(match.group(1))

        except json.JSONDecodeError:
            logger.warning(
                "Could not parse INFERENCE_RESULT."
            )

    building_count = int(
        building_result.get(
            "building_count",
            0,
        )
    )

    predicted_pixels = int(
        building_result.get(
            "predicted_pixels",
            0,
        )
    )

    average_confidence = float(
        building_result.get(
            "average_confidence",
            0,
        )
    )

    threshold = float(
        building_result.get(
            "threshold",
            0.5,
        )
    )

    logger.info(
        "FINAL BUILDING RESULT | buildings=%d | pixels=%d | confidence=%.4f",
        building_count,
        predicted_pixels,
        average_confidence,
    )

    # =====================================================
    # 2. ROAD EXTRACTION
    # =====================================================

    road_command = [
        sys.executable,
        str(ROAD_SCRIPT),
        "--input",
        str(input_path),
    ]

    logger.info("RUNNING ROAD EXTRACTION")
    logger.info("Command: %s", road_command)

    try:
        road_process = subprocess.run(
            road_command,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
        )

    except Exception as exc:
        logger.exception("Road extraction failed.")

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Could not start road extraction: {exc}",
            },
        )

    logger.info(
        "ROAD STDOUT:\n%s",
        road_process.stdout,
    )

    logger.info(
        "ROAD STDERR:\n%s",
        road_process.stderr,
    )

    if road_process.returncode != 0:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Road extraction failed.",
                "details": road_process.stderr[-4000:],
            },
        )

    # -----------------------------------------------------
    # PARSE ROAD RESULT
    # -----------------------------------------------------

    road_count = 0

    road_match = re.search(
        r"Road features detected:\s*(\d+)",
        road_process.stdout,
    )

    if road_match:
        road_count = int(
            road_match.group(1)
        )

    logger.info(
        "FINAL ROAD RESULT | roads=%d",
        road_count,
    )

    # -----------------------------------------------------
    # ROAD GEOJSON PATH
    # -----------------------------------------------------

    road_output = (
        OUTPUT_DIR
        / f"{input_path.stem}_road_features.geojson"
    )

    # =====================================================
    # 3. PARCEL CANDIDATE DELINEATION
    # =====================================================

    building_output = (
        OUTPUT_DIR
        / f"{input_path.stem}_building_footprints.geojson"
    )

    parcel_output = (
        OUTPUT_DIR
        / f"{input_path.stem}_parcels.geojson"
    )

    parcel_command = [
        sys.executable,
        str(PARCEL_SCRIPT),
        "--buildings",
        str(building_output),
        "--roads",
        str(road_output),
        "--output",
        str(parcel_output),
    ]

    logger.info("RUNNING PARCEL DELINEATION")
    logger.info("Command: %s", parcel_command)

    try:
        parcel_process = subprocess.run(
            parcel_command,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
        )

    except Exception as exc:
        logger.exception("Parcel extraction failed.")

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"Could not start parcel extraction: {exc}",
            },
        )

    logger.info(
        "PARCEL STDOUT:\n%s",
        parcel_process.stdout,
    )

    logger.info(
        "PARCEL STDERR:\n%s",
        parcel_process.stderr,
    )

    if parcel_process.returncode != 0:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Parcel extraction failed.",
                "details": parcel_process.stderr[-4000:],
            },
        )

    # -----------------------------------------------------
    # PARSE PARCEL RESULT
    # -----------------------------------------------------

    parcel_count = 0

    parcel_match = re.search(
        r"PARCEL_RESULT=(\{.*\})",
        parcel_process.stdout,
    )

    if parcel_match:
        try:
            parcel_result = json.loads(
                parcel_match.group(1)
            )

            parcel_count = int(
                parcel_result.get(
                    "parcel_count",
                    0,
                )
            )

        except json.JSONDecodeError:
            logger.warning(
                "Could not parse PARCEL_RESULT."
            )

    logger.info(
        "FINAL PARCEL RESULT | parcels=%d",
        parcel_count,
    )

    # =====================================================
    # FINAL RESPONSE
    # =====================================================

    return {
        "success": True,

        # Building results
        "building_count": building_count,
        "predicted_pixels": predicted_pixels,
        "average_confidence": average_confidence,
        "threshold": threshold,

        # Road results
        "road_count": road_count,

        # Parcel results
        "parcel_count": parcel_count,

        # Output files
        "files": {
            "building_mask": "/api/output/mask",
            "building_geojson": "/api/output/geojson",
            "building_overlay": "/api/output/overlay",
            "road_geojson": "/api/output/roads",
            "parcel_geojson": "/api/output/parcels",
        },

        "road_output_exists": road_output.exists(),
        "parcel_output_exists": parcel_output.exists(),
    }


# =========================================================
# BUILDING OUTPUTS
# =========================================================

@app.get("/api/output/mask")
def get_mask():

    files = list(
        OUTPUT_DIR.glob("*_mask.tif")
    )

    if not files:
        return JSONResponse(
            status_code=404,
            content={
                "error": "Building mask not found."
            },
        )

    return FileResponse(
        files[-1],
        media_type="image/tiff",
        filename=files[-1].name,
    )


@app.get("/api/output/geojson")
def get_geojson():

    files = list(
        OUTPUT_DIR.glob("*_footprints.geojson")
    )

    if not files:
        return JSONResponse(
            status_code=404,
            content={
                "error": "Building GeoJSON not found."
            },
        )

    return FileResponse(
        files[-1],
        media_type="application/geo+json",
        filename=files[-1].name,
    )


@app.get("/api/output/overlay")
def get_overlay():

    files = list(
        OUTPUT_DIR.glob("*_overlay.png")
    )

    if not files:
        return JSONResponse(
            status_code=404,
            content={
                "error": "Building overlay not found."
            },
        )

    return FileResponse(
        files[-1],
        media_type="image/png",
        filename=files[-1].name,
    )


# =========================================================
# ROAD OUTPUT
# =========================================================

@app.get("/api/output/roads")
def get_roads():

    files = list(
        OUTPUT_DIR.glob("*_road_features.geojson")
    )

    if not files:
        return JSONResponse(
            status_code=404,
            content={
                "error": "Road GeoJSON not found."
            },
        )

    return FileResponse(
        files[-1],
        media_type="application/geo+json",
        filename=files[-1].name,
    )


# =========================================================
# PARCEL OUTPUT
# =========================================================

@app.get("/api/output/parcels")
def get_parcels():

    files = list(
        OUTPUT_DIR.glob("*_parcels.geojson")
    )

    if not files:
        return JSONResponse(
            status_code=404,
            content={
                "error": "Parcel GeoJSON not found."
            },
        )

    return FileResponse(
        files[-1],
        media_type="application/geo+json",
        filename=files[-1].name,
    )