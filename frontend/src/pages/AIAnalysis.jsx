import { useEffect, useRef, useState } from "react";
import Workflow from "../components/Workflow";
import StatusBadge from "../components/StatusBadge";
import MapPlaceholder from "../components/MapPlaceholder";
import { IconEye, IconDownload } from "../components/Icons";

const API_BASE = "http://127.0.0.1:8000";

const PIPELINE = [
  { label: "Input GeoTIFF" },
  { label: "Preprocessing" },
  { label: "U-Net" },
  { label: "Probability Mask" },
  { label: "Binary Mask" },
  { label: "Polygonization" },
  { label: "Road Detection" },
  { label: "Parcel Generation" },
  { label: "Land Use Classification" },
  { label: "Topology Validation" },
  { label: "GeoJSON" },
];

const OUTPUT_FILES = [
  {
    label: "Building Mask",
    file: "building_mask.tif",
    endpoint: "/api/output/mask",
    canView: false,
    type: "generated",
  },
  {
    label: "Building Footprints",
    file: "building_footprints.geojson",
    endpoint: "/api/output/geojson",
    canView: false,
    type: "generated",
  },
  {
    label: "Building Overlay",
    file: "building_overlay.png",
    endpoint: "/api/output/overlay",
    canView: true,
    type: "generated",
  },
  {
    label: "Road Features",
    file: "road_features.geojson",
    endpoint: "/api/output/roads",
    canView: false,
    type: "generated",
  },
  {
    label: "Parcel Boundaries",
    file: "parcels.geojson",
    endpoint: "/api/output/parcels",
    canView: false,
    type: "generated",
  },
  {
    label: "Land Use Classification",
    file: "land_use_classification.geojson",
    endpoint: null,
    canView: false,
    type: "prototype",
  },
  {
    label: "Topology Validation Report",
    file: "topology_validation_report.json",
    endpoint: null,
    canView: false,
    type: "prototype",
  },
];

export default function AIAnalysis() {
  const [status, setStatus] = useState("ready");
  const [progress, setProgress] = useState(0);
  const [threshold, setThreshold] = useState(0.5);
  const [minArea, setMinArea] = useState("20");
  const [note, setNote] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const timerRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setStatus("ready");
    setProgress(0);
    setResult(null);
    setError("");
    setNote("");
  }

  async function runAnalysis() {
    if (!selectedFile) {
      setNote("Please select a GeoTIFF image first.");
      return;
    }

    setStatus("processing");
    setProgress(5);
    setResult(null);
    setError("");
    setNote("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    timerRef.current = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 90) {
          return previous;
        }

        return previous + 3;
      });
    }, 500);

    const startTime = performance.now();

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      clearInterval(timerRef.current);

      const processingTime = (
        (performance.now() - startTime) /
        1000
      ).toFixed(1);

      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI analysis failed.");
      }

      setProgress(100);
      setStatus("completed");

      setResult({
        ...data,
        processingTime,
      });
    } catch (err) {
      clearInterval(timerRef.current);

      setStatus("error");
      setProgress(0);
      setError(err.message || "Unable to connect to the AI backend.");
    }
  }

  function resetAnalysis() {
    clearInterval(timerRef.current);

    setStatus("ready");
    setProgress(0);
    setResult(null);
    setError("");
    setNote("");
  }

  function getOutputUrl(endpoint) {
    return `${API_BASE}${endpoint}`;
  }

  function handleView(file) {
    if (!result) return;

    if (file.type === "prototype") {
      setNote(
        `"${file.label}" is currently a prototype module and does not have a live backend file.`
      );
      return;
    }

    const url = getOutputUrl(file.endpoint);

    if (file.canView) {
      window.open(url, "_blank", "noopener,noreferrer");
      setNote(`Opening "${file.label}" in a new tab.`);
    } else {
      setNote(
        `"${file.label}" is a GIS output file. Use Download to save it.`
      );
    }
  }

  function handleDownload(file) {
    if (!result) return;

    if (file.type === "prototype") {
      setNote(
        `"${file.label}" is currently a prototype output and is not connected to a downloadable backend file.`
      );
      return;
    }

    const url = getOutputUrl(file.endpoint);

    const link = document.createElement("a");
    link.href = url;
    link.download = file.file;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNote(`Downloading "${file.label}"...`);
  }

  const stepIndex =
    status === "completed"
      ? PIPELINE.length - 1
      : Math.min(
          PIPELINE.length - 1,
          Math.floor((progress / 100) * PIPELINE.length)
        );

  const pipelineSteps = PIPELINE.map((step, index) => ({
    ...step,
    state:
      status === "completed" || index < stepIndex
        ? "done"
        : status === "processing" && index === stepIndex
        ? "active"
        : "pending",
  }));

  return (
    <div className="page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <h1>AI Cadastral Analysis</h1>

        <p>
          AI-powered extraction and GIS processing pipeline for
          building footprints, roads, candidate parcel boundaries,
          land-use classification and topology validation from
          high-resolution GeoTIFF imagery.
        </p>
      </div>

      {/* PIPELINE */}
      <div className="card">
        <div className="card-head">
          <h2>Analysis Pipeline</h2>

          <StatusBadge
            tone={
              status === "completed"
                ? "success"
                : status === "processing"
                ? "info"
                : status === "error"
                ? "danger"
                : "neutral"
            }
          >
            {status === "ready" && "Ready"}
            {status === "processing" && "Processing"}
            {status === "completed" && "Completed"}
            {status === "error" && "Error"}
          </StatusBadge>
        </div>

        <Workflow steps={pipelineSteps} />

        {status === "processing" && (
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* PROCESSING MODULES */}
      <div className="card">
        <div className="card-head">
          <div>
            <h2>Processing Modules</h2>

            <p className="card-subtext">
              Current implementation status of the cadastral
              processing pipeline.
            </p>
          </div>
        </div>

        <div className="stat-grid">
          <div className="result-tile">
            <span className="result-tile-label">
              Building Extraction
            </span>

            <span className="result-tile-value">
              AI Model
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              Road Detection
            </span>

            <span className="result-tile-value">
              Prototype
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              Parcel Generation
            </span>

            <span className="result-tile-value">
              Prototype
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              Land Use
            </span>

            <span className="result-tile-value">
              Prototype
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              Topology
            </span>

            <span className="result-tile-value">
              Prototype
            </span>
          </div>
        </div>
      </div>

      {/* INPUT + CONFIGURATION */}
      <div className="two-col two-col--analysis">

        {/* INPUT */}
        <div className="card">
          <div className="card-head">
            <h2>Input Imagery</h2>

            <StatusBadge tone="neutral">
              GeoTIFF
            </StatusBadge>
          </div>

          <label className="field">
            <span className="field-label">
              Select RGB GeoTIFF
            </span>

            <input
              type="file"
              accept=".tif,.tiff"
              onChange={handleFileChange}
              disabled={status === "processing"}
            />
          </label>

          {selectedFile && (
            <p className="card-subtext">
              Selected: <strong>{selectedFile.name}</strong>
            </p>
          )}

          <MapPlaceholder
            variant="preview"
            layers={{
              imagery: true,
              buildings: status === "completed",
              parcels: status === "completed",
              roads: status === "completed",
              landUse: status === "completed",
            }}
          />
        </div>

        {/* CONFIGURATION */}
        <div className="card">
          <div className="card-head">
            <h2>Analysis Configuration</h2>
          </div>

          <dl className="info-list">
            <div>
              <dt>Model</dt>
              <dd>U-Net</dd>
            </div>

            <div>
              <dt>Input</dt>
              <dd>RGB GeoTIFF</dd>
            </div>

            <div>
              <dt>Primary AI Output</dt>
              <dd>Building Footprints</dd>
            </div>

            <div>
              <dt>GIS Processing</dt>
              <dd>
                Roads + Parcels + Land Use + Topology
              </dd>
            </div>
          </dl>

          <label className="field">
            <span className="field-label">
              Threshold: {threshold.toFixed(2)}
            </span>

            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) =>
                setThreshold(parseFloat(e.target.value))
              }
              disabled={status === "processing"}
            />
          </label>

          <label className="field">
            <span className="field-label">
              Minimum Polygon Area (m²)
            </span>

            <select
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
              disabled={status === "processing"}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>

          <div className="field-row">
            {status !== "processing" ? (
              <button
                className="btn btn--primary"
                onClick={runAnalysis}
              >
                Run AI Analysis
              </button>
            ) : (
              <button
                className="btn btn--disabled"
                disabled
              >
                Processing…
              </button>
            )}

            {(status === "completed" || status === "error") && (
              <button
                className="btn btn--ghost"
                onClick={resetAnalysis}
              >
                Reset
              </button>
            )}
          </div>

          {error && (
            <p className="inline-note">
              <strong>Error:</strong> {error}
            </p>
          )}
        </div>
      </div>

      {/* RESULTS */}
      <div className="card">
        <div className="card-head">
          <div>
            <h2>Analysis Results</h2>

            <p className="card-subtext">
              Results from the connected extraction pipeline and
              prototype GIS modules.
            </p>
          </div>
        </div>

        <div className="stat-grid stat-grid--4">

          {/* BUILDINGS */}
          <div className="result-tile">
            <span className="result-tile-label">
              Buildings Detected
            </span>

            <span className="result-tile-value">
              {result?.building_count ?? "--"}
            </span>
          </div>

          {/* CONFIDENCE */}
          <div className="result-tile">
            <span className="result-tile-label">
              Average Confidence
            </span>

            <span className="result-tile-value">
              {result?.average_confidence != null
                ? result.average_confidence.toFixed(2)
                : "--"}
            </span>
          </div>

          {/* ROADS */}
          <div className="result-tile">
            <span className="result-tile-label">
              Roads Detected
            </span>

            <span className="result-tile-value">
              {result?.road_count ?? "--"}
            </span>
          </div>

          {/* PARCELS */}
          <div className="result-tile">
            <span className="result-tile-label">
              Parcels Detected
            </span>

            <span className="result-tile-value">
              {result?.parcel_count ?? "--"}
            </span>
          </div>
        </div>

        {/* LAND USE + TOPOLOGY */}
        <div
          className="stat-grid"
          style={{ marginTop: "12px" }}
        >
          <div className="result-tile">
            <span className="result-tile-label">
              Land Use Classification
            </span>

            <span className="result-tile-value">
              {status === "completed"
                ? "Prototype"
                : "--"}
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              Topology Validation
            </span>

            <span className="result-tile-value">
              {status === "completed"
                ? "Prototype"
                : "--"}
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              GIS Output
            </span>

            <span className="result-tile-value">
              {status === "completed"
                ? "GeoJSON"
                : "--"}
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              Processing Time
            </span>

            <span className="result-tile-value">
              {result?.processingTime
                ? `${result.processingTime}s`
                : "--"}
            </span>
          </div>
        </div>

        {status === "completed" && (
          <p
            className="card-subtext"
            style={{ marginTop: "12px" }}
          >
            Building extraction, road detection and candidate
            parcel generation are connected to the current
            processing pipeline. Land-use classification and
            topology validation are presented as prototype modules.
          </p>
        )}
      </div>

      {/* AI PREDICTION PREVIEW */}
      {status === "completed" && result && (
        <div className="card">
          <div className="card-head">
            <div>
              <h2>AI Prediction Preview</h2>

              <p className="card-subtext">
                Building footprint segmentation result.
              </p>
            </div>

            <StatusBadge tone="success">
              U-Net
            </StatusBadge>
          </div>

          <div
            style={{
              width: "100%",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid var(--border-color, #ddd)",
              marginTop: "12px",
              background: "#f5f5f5",
            }}
          >
            <img
              src={`${API_BASE}/api/output/overlay`}
              alt="AI building footprint prediction overlay"
              style={{
                width: "100%",
                display: "block",
                maxHeight: "600px",
                objectFit: "contain",
              }}
            />
          </div>

          <p
            className="card-subtext"
            style={{ marginTop: "12px" }}
          >
            The overlay shows the building regions detected by
            the current U-Net segmentation model.
          </p>
        </div>
      )}

      {/* OUTPUT FILES */}
      <div className="card">
        <div className="card-head">
          <div>
            <h2>Output Files</h2>

            <p className="card-subtext">
              GIS-ready outputs and prototype processing results.
            </p>
          </div>

          {status !== "completed" && (
            <StatusBadge tone="neutral">
              Awaiting run
            </StatusBadge>
          )}
        </div>

        <ul className="file-list">
          {OUTPUT_FILES.map((file) => (
            <li
              key={file.file}
              className="file-list-item"
            >
              <div>
                <div className="file-list-name">
                  {file.label}
                </div>

                <div className="file-list-path">
                  {file.file}
                </div>
              </div>

              <div className="field-row">

                {file.type === "prototype" ? (
                  <StatusBadge tone="warning">
                    Prototype
                  </StatusBadge>
                ) : (
                  <>
                    {/* VIEW */}
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={
                        status !== "completed" ||
                        !result
                      }
                      onClick={() => handleView(file)}
                    >
                      <IconEye size={14} />
                      View
                    </button>

                    {/* DOWNLOAD */}
                    <button
                      className="btn btn--ghost btn--sm"
                      disabled={
                        status !== "completed" ||
                        !result
                      }
                      onClick={() => handleDownload(file)}
                    >
                      <IconDownload size={14} />
                      Download
                    </button>
                  </>
                )}

              </div>
            </li>
          ))}
        </ul>

        {note && (
          <p className="inline-note">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}