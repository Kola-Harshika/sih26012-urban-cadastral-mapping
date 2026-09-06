import { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";

const SAMPLE_ROWS = [
  {
    id: "GEO-001",
    feature: "BLD-0145",
    issue: "Overlaps adjacent footprint",
    severity: "error",
    status: "Open",
  },
  {
    id: "GEO-002",
    feature: "BLD-0150",
    issue: "Boundary self-intersects",
    severity: "error",
    status: "Open",
  },
  {
    id: "GEO-003",
    feature: "PAR-0108",
    issue: "Sliver gap with parcel edge",
    severity: "warning",
    status: "Open",
  },
  {
    id: "GEO-004",
    feature: "BLD-0151",
    issue: "Duplicate footprint candidate",
    severity: "warning",
    status: "Open",
  },
];

const severityTone = {
  error: "error",
  warning: "warning",
};

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
      {/* HEADER */}
      <div className="page-header">
        <h1>Topology &amp; Geometry Validation</h1>

        <p>
          Validate extracted building footprints, parcel boundaries and road
          geometries by detecting overlaps, gaps, duplicate features,
          self-intersections and other geometric inconsistencies.
        </p>
      </div>

      {/* STATS */}
      <div className="stat-grid">
        <div className="result-tile">
          <span className="result-tile-label">Total Features</span>
          <span className="result-tile-value">
            {ran ? "37" : "--"}
          </span>
        </div>

        <div className="result-tile">
          <span className="result-tile-label">Valid Features</span>
          <span className="result-tile-value">
            {ran ? "33" : "--"}
          </span>
        </div>

        <div className="result-tile">
          <span className="result-tile-label">Warnings</span>
          <span className="result-tile-value">
            {ran ? "2" : "--"}
          </span>
        </div>

        <div className="result-tile">
          <span className="result-tile-label">Errors</span>
          <span className="result-tile-value">
            {ran ? "2" : "--"}
          </span>
        </div>
      </div>

      {/* VALIDATION CARD */}
      <div className="card">
        <div className="card-head">
          <div>
            <h2>Topology Validation</h2>

            <p className="card-subtext">
              Check spatial relationships and geometric consistency of
              extracted cadastral features.
            </p>
          </div>

          <button
            className="btn btn--primary"
            onClick={runValidation}
            disabled={running}
          >
            {running ? "Running Validation…" : "Run Validation"}
          </button>
        </div>

        {/* CHECK TYPES */}
        <div className="stat-grid" style={{ marginTop: "20px" }}>
          <div className="result-tile">
            <span className="result-tile-label">
              Overlap Detection
            </span>

            <span className="result-tile-value">
              {ran ? "Checked" : "Ready"}
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              Boundary Validation
            </span>

            <span className="result-tile-value">
              {ran ? "Checked" : "Ready"}
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              Gap Detection
            </span>

            <span className="result-tile-value">
              {ran ? "Checked" : "Ready"}
            </span>
          </div>

          <div className="result-tile">
            <span className="result-tile-label">
              Duplicate Detection
            </span>

            <span className="result-tile-value">
              {ran ? "Checked" : "Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div className="card">
        <div className="card-head">
          <div>
            <h2>Validation Results</h2>

            <p className="card-subtext">
              Detected topology and geometry inconsistencies.
            </p>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: "feature",
              label: "Feature ID",
            },

            {
              key: "issue",
              label: "Issue",
            },

            {
              key: "severity",
              label: "Severity",

              render: (row) => (
                <StatusBadge tone={severityTone[row.severity]}>
                  {row.severity === "error"
                    ? "Error"
                    : "Warning"}
                </StatusBadge>
              ),
            },

            {
              key: "status",
              label: "Status",
            },
          ]}
          rows={ran ? SAMPLE_ROWS : []}
          emptyLabel="Run validation to view detected topology issues."
        />
      </div>

      {/* INFORMATION */}
      <div className="card">
        <div className="card-head">
          <div>
            <h2>Validation Checks</h2>

            <p className="card-subtext">
              The topology module is designed to support quality control
              before cadastral data is exported to GIS formats.
            </p>
          </div>
        </div>

        <div className="info-grid">
          <div>
            <h3>Overlap Detection</h3>
            <p>
              Identifies building or parcel geometries that overlap
              neighboring features.
            </p>
          </div>

          <div>
            <h3>Geometry Validation</h3>
            <p>
              Detects invalid polygon geometries such as
              self-intersections and malformed boundaries.
            </p>
          </div>

          <div>
            <h3>Gap Detection</h3>
            <p>
              Highlights possible gaps or sliver regions between
              extracted spatial features.
            </p>
          </div>

          <div>
            <h3>Duplicate Detection</h3>
            <p>
              Identifies duplicate or highly similar feature
              geometries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}