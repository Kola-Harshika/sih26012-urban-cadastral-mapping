import { useState } from "react";
import MapPlaceholder from "../components/MapPlaceholder";
import StatusBadge from "../components/StatusBadge";
import {
  IconPlus,
  IconMinus,
  IconMaximize,
  IconLayers,
  IconRuler,
  IconCursor,
} from "../components/Icons";

const TOOLS = [
  { id: "zoom-in", icon: IconPlus, label: "Zoom in" },
  { id: "zoom-out", icon: IconMinus, label: "Zoom out" },
  { id: "fit", icon: IconMaximize, label: "Fit view" },
  { id: "layers", icon: IconLayers, label: "Layers" },
  { id: "measure", icon: IconRuler, label: "Measure" },
  { id: "select", icon: IconCursor, label: "Select" },
];

const LAYER_INFO = [
  {
    key: "imagery",
    label: "Source Imagery",
    status: "Available",
  },
  {
    key: "buildings",
    label: "Building Footprints",
    status: "AI Extracted",
  },
  {
    key: "roads",
    label: "Road Features",
    status: "Prototype",
  },
  {
    key: "parcels",
    label: "Parcel Boundaries",
    status: "Prototype",
  },
  {
    key: "landUse",
    label: "Land Use",
    status: "Prototype",
  },
];

export default function WebGIS() {
  const [activeTool, setActiveTool] = useState("select");

  const [layers, setLayers] = useState({
    imagery: true,
    buildings: true,
    roads: true,
    parcels: true,
    landUse: false,
  });

  const [selected, setSelected] = useState(null);

  function toggleLayer(key) {
    setLayers((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function handleToolClick(id) {
    setActiveTool(id);

    if (id === "select") {
      return;
    }

    if (id === "layers") {
      return;
    }

    if (id === "zoom-in") {
      return;
    }

    if (id === "zoom-out") {
      return;
    }

    if (id === "fit") {
      return;
    }

    if (id === "measure") {
      return;
    }
  }

  return (
    <div className="page page--map">
      {/* HEADER */}
      <div className="page-header">
        <h1>Web GIS Map</h1>

        <p>
          Interactive visualization of source imagery and AI-extracted
          cadastral features including buildings, roads and parcel
          boundaries.
        </p>
      </div>

      {/* MAIN GIS AREA */}
      <div className="gis-layout">
        {/* MAP */}
        <div className="gis-canvas">
          <MapPlaceholder
            layers={layers}
            onSelectBuilding={(feature) => setSelected(feature)}
            selectedId={selected?.id}
          />

          {/* MAP TOOLBAR */}
          <div className="gis-toolbar">
            {TOOLS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={
                  "gis-toolbar-btn" +
                  (activeTool === id
                    ? " gis-toolbar-btn--active"
                    : "")
                }
                onClick={() => handleToolClick(id)}
                aria-label={label}
                title={label}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          {/* MAP STATUS */}
          <div className="gis-map-status">
            <span>GIS Visualization</span>
            <span>•</span>
            <span>AI Cadastral Layers</span>
          </div>
        </div>

        {/* SIDE PANEL */}
        <aside className="gis-side">
          {/* LAYERS */}
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Map Layers</h2>

                <p className="card-subtext">
                  Toggle extracted GIS layers
                </p>
              </div>
            </div>

            <ul className="layer-list">
              {LAYER_INFO.map((layer) => (
                <li key={layer.key}>
                  <label>
                    <input
                      type="checkbox"
                      checked={layers[layer.key]}
                      onChange={() => toggleLayer(layer.key)}
                    />

                    <span>{layer.label}</span>
                  </label>

                  <StatusBadge
                    tone={
                      layer.status === "Available" ||
                      layer.status === "AI Extracted"
                        ? "success"
                        : "warning"
                    }
                  >
                    {layer.status}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </div>

          {/* SELECTED FEATURE */}
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Selected Feature</h2>

                <p className="card-subtext">
                  Feature information
                </p>
              </div>
            </div>

            {selected ? (
              <dl className="info-list">
                <div>
                  <dt>Feature Type</dt>
                  <dd>Building Footprint</dd>
                </div>

                <div>
                  <dt>Feature ID</dt>
                  <dd>{selected.id || "BLD-001"}</dd>
                </div>

                <div>
                  <dt>Area</dt>
                  <dd>{selected.area || "N/A"}</dd>
                </div>

                <div>
                  <dt>Confidence</dt>
                  <dd>{selected.confidence || "N/A"}</dd>
                </div>

                <div>
                  <dt>Source</dt>
                  <dd>AI Extraction</dd>
                </div>

                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge tone="warning">
                      Pending Verification
                    </StatusBadge>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="empty-note">
                Select a building footprint on the map to inspect
                its attributes.
              </p>
            )}
          </div>

          {/* GIS DATA SUMMARY */}
          <div className="card">
            <div className="card-head">
              <div>
                <h2>GIS Data Summary</h2>

                <p className="card-subtext">
                  Current prototype layers
                </p>
              </div>
            </div>

            <div className="info-list">
              <div>
                <dt>Buildings</dt>
                <dd>GeoJSON</dd>
              </div>

              <div>
                <dt>Roads</dt>
                <dd>GeoJSON</dd>
              </div>

              <div>
                <dt>Parcels</dt>
                <dd>GeoJSON</dd>
              </div>

              <div>
                <dt>Coordinate System</dt>
                <dd>Source CRS</dd>
              </div>

              <div>
                <dt>Validation</dt>
                <dd>
                  <StatusBadge tone="warning">
                    Prototype
                  </StatusBadge>
                </dd>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}