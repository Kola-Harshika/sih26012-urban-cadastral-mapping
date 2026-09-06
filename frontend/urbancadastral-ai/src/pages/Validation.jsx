import { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";

const SAMPLE_ROWS = [
  { id: "GEO-001", feature: "BLD-0145", issue: "Overlaps adjacent footprint", severity: "error", status: "Open" },
  { id: "GEO-002", feature: "BLD-0150", issue: "Boundary self-intersects", severity: "error", status: "Open" },
  { id: "GEO-003", feature: "BLD-0148", issue: "Sliver gap with parcel edge", severity: "warning", status: "Open" },
  { id: "GEO-004", feature: "BLD-0151", issue: "Duplicate footprint candidate", severity: "warning", status: "Open" },
];

const severityTone = { error: "error", warning: "warning" };

export default function Validation() {
  const [ran, setRan] = useState(false);
  const [running, setRunning] = useState(false);

  function runValidation() {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setRan(true);
    }, 1400);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Topology &amp; Geometry Validation</h1>
        <p>
          This module is intended to flag overlapping geometries, inconsistent boundaries, invalid
          polygons, gaps and duplicate features across extracted footprints. It runs against demo records
          in this prototype until connected to a live validation backend.
        </p>
      </div>

      <div className="stat-grid">
        <div className="result-tile">
          <span className="result-tile-label">Total Features</span>
          <span className="result-tile-value">{ran ? "37" : "--"}</span>
        </div>
        <div className="result-tile">
          <span className="result-tile-label">Valid Features</span>
          <span className="result-tile-value">{ran ? "33" : "--"}</span>
        </div>
        <div className="result-tile">
          <span className="result-tile-label">Warnings</span>
          <span className="result-tile-value">{ran ? "2" : "--"}</span>
        </div>
        <div className="result-tile">
          <span className="result-tile-label">Errors</span>
          <span className="result-tile-value">{ran ? "2" : "--"}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Validation Results</h2>
            <p className="card-subtext">Sample/demo records — replace with live output once the topology checker is connected.</p>
          </div>
          <button className="btn btn--primary" onClick={runValidation} disabled={running}>
            {running ? "Running Validation…" : "Run Validation"}
          </button>
        </div>
        <DataTable
          columns={[
            { key: "feature", label: "Feature ID" },
            { key: "issue", label: "Issue" },
            {
              key: "severity",
              label: "Severity",
              render: (row) => (
                <StatusBadge tone={severityTone[row.severity]}>
                  {row.severity === "error" ? "Error" : "Warning"}
                </StatusBadge>
              ),
            },
            { key: "status", label: "Status" },
          ]}
          rows={ran ? SAMPLE_ROWS : []}
          emptyLabel="Run validation to view sample findings."
        />
      </div>
    </div>
  );
}
