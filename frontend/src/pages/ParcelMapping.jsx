import React, { useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

export default function ParcelMapping() {
  const [status, setStatus] = useState("ready");
  const [parcelCount, setParcelCount] = useState(null);

  const generateParcels = async () => {
    setStatus("processing");

    try {
      // Prototype parcel generation.
      // In the complete system this will be replaced
      // by the cadastral parcel AI/GIS pipeline.

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Demo value for prototype presentation
      setParcelCount(18);
      setStatus("completed");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Parcel Mapping</h1>
          <p>
            AI-assisted urban parcel boundary extraction and cadastral
            mapping.
          </p>
        </div>

        <span className="prototype-badge">
          Prototype
        </span>
      </div>

      {/* Main content */}
      <div className="parcel-grid">

        {/* Left panel */}
        <div className="panel parcel-control-panel">
          <div className="panel-title">
            <span>🗺️</span>
            <div>
              <h2>Parcel Boundary Extraction</h2>
              <p>
                Generate parcel boundaries from extracted urban features.
              </p>
            </div>
          </div>

          <div className="workflow">

            <div className="workflow-step completed">
              <div className="step-number">1</div>
              <div>
                <strong>Input Imagery</strong>
                <span>High-resolution GeoTIFF</span>
              </div>
            </div>

            <div className="workflow-line" />

            <div className="workflow-step completed">
              <div className="step-number">2</div>
              <div>
                <strong>Building Extraction</strong>
                <span>U-Net segmentation</span>
              </div>
            </div>

            <div className="workflow-line" />

            <div className="workflow-step completed">
              <div className="step-number">3</div>
              <div>
                <strong>Road Detection</strong>
                <span>Road feature extraction</span>
              </div>
            </div>

            <div className="workflow-line" />

            <div
              className={`workflow-step ${
                status === "completed" ? "completed" : ""
              }`}
            >
              <div className="step-number">4</div>
              <div>
                <strong>Parcel Generation</strong>
                <span>Boundary estimation</span>
              </div>
            </div>

          </div>

          <button
            className="primary-button"
            onClick={generateParcels}
            disabled={status === "processing"}
          >
            {status === "processing"
              ? "Generating Parcels..."
              : status === "completed"
              ? "Regenerate Parcel Boundaries"
              : "Generate Parcel Boundaries"}
          </button>

          {status === "error" && (
            <div className="error-message">
              Unable to generate parcel boundaries.
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="panel parcel-result-panel">

          <div className="panel-heading">
            <div>
              <h2>Parcel Map Preview</h2>
              <p>GIS-style visualization of detected parcels.</p>
            </div>

            <span
              className={`status-badge ${
                status === "completed"
                  ? "status-success"
                  : "status-ready"
              }`}
            >
              {status === "completed" ? "Completed" : "Ready"}
            </span>
          </div>

          {/* Map */}
          <div className="parcel-map">

            <div className="map-grid" />

            {/* Roads */}
            <div className="road road-1" />
            <div className="road road-2" />
            <div className="road road-3" />

            {/* Buildings */}
            <div className="building building-1" />
            <div className="building building-2" />
            <div className="building building-3" />
            <div className="building building-4" />
            <div className="building building-5" />
            <div className="building building-6" />

            {/* Parcel boundaries */}
            <div className="parcel parcel-1">P-001</div>
            <div className="parcel parcel-2">P-002</div>
            <div className="parcel parcel-3">P-003</div>
            <div className="parcel parcel-4">P-004</div>
            <div className="parcel parcel-5">P-005</div>
            <div className="parcel parcel-6">P-006</div>

            {status === "processing" && (
              <div className="map-processing">
                <div className="spinner" />
                <span>Generating parcel boundaries...</span>
              </div>
            )}

            {status === "ready" && (
              <div className="map-message">
                Click <strong>Generate Parcel Boundaries</strong> to
                create the parcel layer.
              </div>
            )}

          </div>

          {/* Results */}
          <div className="parcel-stats">

            <div className="parcel-stat">
              <span>Parcels Detected</span>
              <strong>
                {parcelCount ?? "--"}
              </strong>
            </div>

            <div className="parcel-stat">
              <span>Boundary Status</span>
              <strong>
                {status === "completed"
                  ? "Validated"
                  : "--"}
              </strong>
            </div>

            <div className="parcel-stat">
              <span>GIS Output</span>
              <strong>
                {status === "completed"
                  ? "GeoJSON"
                  : "--"}
              </strong>
            </div>

          </div>

        </div>
      </div>

      {/* Information section */}
      <div className="panel info-panel">

        <div className="info-item">
          <span className="info-icon">🏠</span>
          <div>
            <h3>Building Footprints</h3>
            <p>
              Extracted building footprints provide important
              spatial evidence for parcel generation.
            </p>
          </div>
        </div>

        <div className="info-item">
          <span className="info-icon">🛣️</span>
          <div>
            <h3>Road & Access Corridors</h3>
            <p>
              Detected roads help identify boundaries and access
              corridors between urban parcels.
            </p>
          </div>
        </div>

        <div className="info-item">
          <span className="info-icon">📐</span>
          <div>
            <h3>Cadastral Boundaries</h3>
            <p>
              Parcel polygons can later be integrated with official
              cadastral GIS layers and survey data.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}