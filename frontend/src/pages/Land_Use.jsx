import React, { useState } from "react";

export default function Land_Use() {
  const [status, setStatus] = useState("ready");
  const [classified, setClassified] = useState(false);

  const classifyLandUse = () => {
    setStatus("processing");

    setTimeout(() => {
      setClassified(true);
      setStatus("completed");
    }, 1500);
  };

  const landTypes = [
    { name: "Residential", percentage: 38, icon: "🏠" },
    { name: "Commercial", percentage: 17, icon: "🏢" },
    { name: "Vegetation", percentage: 24, icon: "🌳" },
    { name: "Transportation", percentage: 13, icon: "🛣️" },
    { name: "Other", percentage: 8, icon: "⬜" },
  ];

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Land Use Classification</h1>
          <p>
            AI-assisted classification of urban land-use categories
            from high-resolution imagery.
          </p>
        </div>

        <span className="prototype-badge">
          Prototype
        </span>
      </div>

      <div className="landuse-grid">

        {/* Control panel */}
        <div className="panel">

          <div className="panel-title">
            <span>🌍</span>

            <div>
              <h2>Land Use Analysis</h2>
              <p>
                Identify major land-use categories in the
                analyzed urban area.
              </p>
            </div>
          </div>

          <div className="landuse-workflow">

            <div className="landuse-step completed">
              <div className="landuse-number">1</div>

              <div>
                <strong>Input Imagery</strong>
                <span>High-resolution GeoTIFF</span>
              </div>
            </div>

            <div className="landuse-line" />

            <div
              className={`landuse-step ${
                classified ? "completed" : ""
              }`}
            >
              <div className="landuse-number">2</div>

              <div>
                <strong>Feature Analysis</strong>
                <span>Spatial feature extraction</span>
              </div>
            </div>

            <div className="landuse-line" />

            <div
              className={`landuse-step ${
                status === "completed" ? "completed" : ""
              }`}
            >
              <div className="landuse-number">3</div>

              <div>
                <strong>Land Use Classification</strong>
                <span>Category assignment</span>
              </div>
            </div>

          </div>

          <button
            className="primary-button"
            onClick={classifyLandUse}
            disabled={status === "processing"}
          >
            {status === "processing"
              ? "Classifying Land Use..."
              : status === "completed"
              ? "Re-run Classification"
              : "Classify Land Use"}
          </button>

        </div>

        {/* Map / Results */}
        <div className="panel">

          <div className="panel-heading">
            <div>
              <h2>Land Use Map</h2>
              <p>
                Spatial classification preview
              </p>
            </div>

            <span
              className={`status-badge ${
                status === "completed"
                  ? "status-success"
                  : "status-ready"
              }`}
            >
              {status === "completed"
                ? "Completed"
                : "Ready"}
            </span>
          </div>

          <div className="landuse-map">

            <div className="landuse-map-grid" />

            {/* Map zones */}
            <div className="land-zone residential">
              <span>Residential</span>
            </div>

            <div className="land-zone commercial">
              <span>Commercial</span>
            </div>

            <div className="land-zone vegetation">
              <span>Vegetation</span>
            </div>

            <div className="land-zone transportation">
              <span>Transportation</span>
            </div>

            <div className="land-zone other">
              <span>Other</span>
            </div>

            {status === "processing" && (
              <div className="landuse-overlay">
                <div className="spinner" />
                <span>
                  Analyzing land-use features...
                </span>
              </div>
            )}

            {status === "ready" && (
              <div className="landuse-message">
                Click <strong>Classify Land Use</strong> to
                generate the classification.
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Classification results */}
      <div className="panel landuse-results">

        <div className="panel-heading">
          <div>
            <h2>Classification Results</h2>
            <p>
              Estimated distribution of land-use categories.
            </p>
          </div>
        </div>

        <div className="landuse-stat-grid">

          {landTypes.map((type) => (
            <div
              className="landuse-stat"
              key={type.name}
            >
              <div className="landuse-stat-icon">
                {type.icon}
              </div>

              <div>
                <span>{type.name}</span>

                <strong>
                  {classified
                    ? `${type.percentage}%`
                    : "--"}
                </strong>
              </div>
            </div>
          ))}

        </div>

      </div>

      {/* Explanation */}
      <div className="panel landuse-info">

        <div className="info-item">
          <span className="info-icon">🏠</span>

          <div>
            <h3>Built-up Areas</h3>
            <p>
              Buildings and developed areas can be used as
              spatial indicators for residential and
              commercial zones.
            </p>
          </div>
        </div>

        <div className="info-item">
          <span className="info-icon">🌳</span>

          <div>
            <h3>Vegetation</h3>
            <p>
              Vegetated regions can be identified from
              spectral and spatial characteristics.
            </p>
          </div>
        </div>

        <div className="info-item">
          <span className="info-icon">🛣️</span>

          <div>
            <h3>Transportation</h3>
            <p>
              Road and access-corridor extraction supports
              transportation land-use identification.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}