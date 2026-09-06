import { useState } from "react";
import { IconEye, IconDownload, IconFileText } from "../components/Icons";
import StatusBadge from "../components/StatusBadge";

const EXPORTS = [
  { name: "Building Footprints", format: "GeoJSON" },
  { name: "Building Mask", format: "GeoTIFF" },
  { name: "Analysis Overlay", format: "PNG" },
  { name: "Cadastral Report", format: "PDF" },
];

export default function Reports() {
  const [note, setNote] = useState("");

  return (
    <div className="page">
      <div className="page-header">
        <h1>Reports &amp; Export</h1>
        <p>Export cadastral extraction outputs once an AI analysis run has completed.</p>
      </div>

      <div className="export-grid">
        {EXPORTS.map((item) => (
          <div key={item.name} className="card export-card">
            <span className="export-card-icon">
              <IconFileText size={18} />
            </span>
            <div className="export-card-body">
              <div className="export-card-name">{item.name}</div>
              <div className="export-card-format">{item.format}</div>
            </div>
            <div className="field-row">
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setNote(`Viewing "${item.name}" is a UI prototype control — connect the backend to preview real output.`)}
              >
                <IconEye size={14} /> View
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setNote(`Exporting "${item.name}" (${item.format}) is a UI prototype control — not connected to a backend yet.`)}
              >
                <IconDownload size={14} /> Export
              </button>
            </div>
          </div>
        ))}
      </div>
      {note && <p className="inline-note">{note}</p>}

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Analysis Summary</h2>
          </div>
          <StatusBadge tone="neutral">Demo Values</StatusBadge>
        </div>
        <dl className="info-list">
          <div>
            <dt>Input Dataset</dt>
            <dd>Not yet selected</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>U-Net (building segmentation)</dd>
          </div>
          <div>
            <dt>Buildings Detected</dt>
            <dd>--</dd>
          </div>
          <div>
            <dt>Processing Status</dt>
            <dd>
              <StatusBadge tone="neutral">Not connected</StatusBadge>
            </dd>
          </div>
          <div>
            <dt>Output Coordinate System</dt>
            <dd>EPSG:32644 (WGS 84 / UTM zone 44N)</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
