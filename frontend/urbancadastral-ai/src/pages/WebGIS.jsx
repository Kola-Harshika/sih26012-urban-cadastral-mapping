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

export default function WebGIS() {
  const [activeTool, setActiveTool] = useState("select");
  const [layers, setLayers] = useState({
    imagery: true,
    buildings: true,
    parcels: false,
    roads: false,
    landUse: false,
  });
  const [selected, setSelected] = useState(null);

  function toggleLayer(key) {
    setLayers((l) => ({ ...l, [key]: !l[key] }));
  }

  return (
    <div className="page page--map">
      <div className="page-header">
        <h1>Web GIS Map</h1>
        <p>Visualize AI-extracted building footprints over the source imagery.</p>
      </div>

      <div className="gis-layout">
        <div className="gis-canvas">
          <MapPlaceholder
            layers={layers}
            onSelectBuilding={(f) => setSelected(f)}
            selectedId={selected?.id}
          />

          <div className="gis-toolbar">
            {TOOLS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={"gis-toolbar-btn" + (activeTool === id ? " gis-toolbar-btn--active" : "")}
                onClick={() => setActiveTool(id)}
                aria-label={label}
                title={label}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        <aside className="gis-side">
          <div className="card">
            <div className="card-head">
              <h2>Layers</h2>
            </div>
            <ul className="layer-list">
              <li>
                <label>
                  <input type="checkbox" checked={layers.imagery} onChange={() => toggleLayer("imagery")} />
                  Drone Imagery
                </label>
              </li>
              <li>
                <label>
                  <input type="checkbox" checked={layers.buildings} onChange={() => toggleLayer("buildings")} />
                  Building Footprints
                </label>
              </li>
              <li>
                <label>
                  <input type="checkbox" checked={layers.parcels} onChange={() => toggleLayer("parcels")} />
                  Parcel Boundaries
                </label>
                <StatusBadge tone="warning">Planned</StatusBadge>
              </li>
              <li>
                <label>
                  <input type="checkbox" checked={layers.roads} onChange={() => toggleLayer("roads")} />
                  Roads
                </label>
                <StatusBadge tone="warning">Planned</StatusBadge>
              </li>
              <li>
                <label>
                  <input type="checkbox" checked={layers.landUse} onChange={() => toggleLayer("landUse")} />
                  Land Use
                </label>
                <StatusBadge tone="warning">Planned</StatusBadge>
              </li>
            </ul>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Selected Feature</h2>
            </div>
            {selected ? (
              <dl className="info-list">
                <div>
                  <dt>Feature Type</dt>
                  <dd>Building</dd>
                </div>
                <div>
                  <dt>Area</dt>
                  <dd>{selected.area}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{selected.confidence}</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>AI Extraction</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge tone="warning">Pending Verification</StatusBadge>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="empty-note">Click a building footprint on the map to inspect it.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
