import { useEffect, useRef, useState } from "react";
import Workflow from "../components/Workflow";
import StatusBadge from "../components/StatusBadge";
import MapPlaceholder from "../components/MapPlaceholder";
import { IconEye, IconDownload } from "../components/Icons";

const PIPELINE = [
  { label: "Input GeoTIFF" },
  { label: "Preprocessing" },
  { label: "U-Net" },
  { label: "Probability Mask" },
  { label: "Binary Mask" },
  { label: "Polygonization" },
  { label: "GeoJSON" },
];

const OUTPUT_FILES = [
  { label: "Building Mask", file: "building_mask.tif" },
  { label: "Building Footprints", file: "building_footprints.geojson" },
  { label: "Overlay", file: "building_overlay.png" },
];

export default function AIAnalysis() {
  const [status, setStatus] = useState("ready"); // ready | processing | completed | error
  const [progress, setProgress] = useState(0);
  const [threshold, setThreshold] = useState(0.5);
  const [minArea, setMinArea] = useState("20");
  const [note, setNote] = useState("");
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function runAnalysis() {
    setStatus("processing");
    setProgress(0);
    setNote("");
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 18 + 6;
        if (next >= 100) {
          clearInterval(timerRef.current);
          setStatus("completed");
          return 100;
        }
        return next;
      });
    }, 400);
  }

  function resetAnalysis() {
    clearInterval(timerRef.current);
    setStatus("ready");
    setProgress(0);
    setNote("");
  }

  const stepIndex = Math.min(PIPELINE.length - 1, Math.floor((progress / 100) * PIPELINE.length));
  const pipelineSteps = PIPELINE.map((s, i) => ({
    ...s,
    state:
      status === "completed" || i < stepIndex
        ? "done"
        : status === "processing" && i === stepIndex
        ? "active"
        : "pending",
  }));

  return (
    <div className="page">
      <div className="page-header">
        <h1>AI Building Footprint Extraction</h1>
        <p>
          Deep-learning-based semantic segmentation identifies building regions from high-resolution
          drone imagery using a U-Net model, then converts the resulting mask into cadastral-ready polygons.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Extraction Pipeline</h2>
          <StatusBadge tone={status === "completed" ? "success" : status === "processing" ? "info" : "neutral"}>
            {status === "ready" && "Ready"}
            {status === "processing" && "Processing"}
            {status === "completed" && "Completed"}
            {status === "error" && "Error"}
          </StatusBadge>
        </div>
        <Workflow steps={pipelineSteps} />
        {status === "processing" && (
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
      </div>

      <div className="two-col two-col--analysis">
        <div className="card">
          <div className="card-head">
            <h2>Input Imagery</h2>
            <StatusBadge tone="neutral">Preview</StatusBadge>
          </div>
          <MapPlaceholder variant="preview" layers={{ imagery: true, buildings: status === "completed", parcels: false, roads: false, landUse: false }} />
        </div>

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
              <dt>Output</dt>
              <dd>Building Footprint Mask</dd>
            </div>
          </dl>

          <label className="field">
            <span className="field-label">Threshold: {threshold.toFixed(2)}</span>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              disabled={status === "processing"}
            />
          </label>

          <label className="field">
            <span className="field-label">Minimum Polygon Area (m&sup2;)</span>
            <select value={minArea} onChange={(e) => setMinArea(e.target.value)} disabled={status === "processing"}>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>

          <div className="field-row">
            {status !== "processing" ? (
              <button className="btn btn--primary" onClick={runAnalysis}>
                Run AI Analysis
              </button>
            ) : (
              <button className="btn btn--disabled" disabled>
                Processing&hellip;
              </button>
            )}
            {status === "completed" && (
              <button className="btn btn--ghost" onClick={resetAnalysis}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Results</h2>
        </div>
        <div className="stat-grid stat-grid--3">
          <div className="result-tile">
            <span className="result-tile-label">Buildings Detected</span>
            <span className="result-tile-value">{status === "completed" ? "37" : "--"}</span>
          </div>
          <div className="result-tile">
            <span className="result-tile-label">Average Confidence</span>
            <span className="result-tile-value">{status === "completed" ? "0.87" : "--"}</span>
          </div>
          <div className="result-tile">
            <span className="result-tile-label">Processing Time</span>
            <span className="result-tile-value">{status === "completed" ? "42.3s" : "--"}</span>
          </div>
        </div>
        {status === "completed" && (
          <p className="card-subtext" style={{ marginTop: "12px" }}>
            Demo values shown for this prototype run. Connect the Python inference service to populate
            these results from a real U-Net pass.
          </p>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Output Files</h2>
          {status !== "completed" && <StatusBadge tone="neutral">Awaiting run</StatusBadge>}
        </div>
        <ul className="file-list">
          {OUTPUT_FILES.map((f) => (
            <li key={f.file} className="file-list-item">
              <div>
                <div className="file-list-name">{f.label}</div>
                <div className="file-list-path">{f.file}</div>
              </div>
              <div className="field-row">
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={status !== "completed"}
                  onClick={() => setNote(`"${f.label}" preview is a UI prototype control — no backend file is connected yet.`)}
                >
                  <IconEye size={14} /> View
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={status !== "completed"}
                  onClick={() => setNote(`Download of "${f.file}" is a UI prototype control — connect the inference pipeline to enable it.`)}
                >
                  <IconDownload size={14} /> Download
                </button>
              </div>
            </li>
          ))}
        </ul>
        {note && <p className="inline-note">{note}</p>}
      </div>
    </div>
  );
}
