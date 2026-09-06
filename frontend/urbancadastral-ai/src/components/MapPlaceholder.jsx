import { useMemo } from "react";

// A static/mock aerial-cadastral scene rendered with SVG so the prototype
// never depends on a map API key. `layers` toggles which feature groups draw.
// `variant="preview"` renders a smaller, non-interactive version (Drone Data page).
// `onSelectBuilding(feature)` fires when a building footprint is clicked (Web GIS page).

const BUILDINGS = [
  { id: "BLD-0142", x: 120, y: 90, w: 46, h: 34, area: "182 m²", confidence: "0.94" },
  { id: "BLD-0143", x: 178, y: 92, w: 30, h: 30, area: "121 m²", confidence: "0.88" },
  { id: "BLD-0144", x: 250, y: 120, w: 54, h: 40, area: "246 m²", confidence: "0.91" },
  { id: "BLD-0145", x: 340, y: 110, w: 38, h: 46, area: "197 m²", confidence: "0.79" },
  { id: "BLD-0146", x: 420, y: 150, w: 60, h: 34, area: "231 m²", confidence: "0.86" },
  { id: "BLD-0147", x: 130, y: 200, w: 42, h: 42, area: "204 m²", confidence: "0.92" },
  { id: "BLD-0148", x: 210, y: 220, w: 34, h: 28, area: "108 m²", confidence: "0.83" },
  { id: "BLD-0149", x: 300, y: 240, w: 48, h: 36, area: "195 m²", confidence: "0.9" },
  { id: "BLD-0150", x: 470, y: 230, w: 40, h: 40, area: "179 m²", confidence: "0.77" },
  { id: "BLD-0151", x: 540, y: 200, w: 56, h: 30, area: "188 m²", confidence: "0.85" },
  { id: "BLD-0152", x: 150, y: 300, w: 44, h: 34, area: "168 m²", confidence: "0.89" },
  { id: "BLD-0153", x: 260, y: 320, w: 38, h: 38, area: "160 m²", confidence: "0.8" },
];

const PARCELS = [
  "M 90 70 L 240 70 L 240 260 L 90 260 Z",
  "M 240 70 L 400 70 L 400 200 L 240 200 Z",
  "M 400 70 L 620 70 L 620 260 L 400 260 Z",
  "M 90 260 L 400 260 L 400 380 L 90 380 Z",
  "M 400 260 L 620 260 L 620 380 L 400 380 Z",
];

const ROADS = [
  "M 0 70 H 700",
  "M 0 260 H 700",
  "M 0 380 H 700",
  "M 240 0 V 420",
  "M 400 0 V 420",
  "M 620 0 V 420",
];

export default function MapPlaceholder({ variant = "full", layers, onSelectBuilding, selectedId }) {
  const showImagery = layers ? layers.imagery : true;
  const showBuildings = layers ? layers.buildings : true;
  const showParcels = layers ? layers.parcels : false;
  const showRoads = layers ? layers.roads : false;
  const showLandUse = layers ? layers.landUse : false;

  const ticksX = useMemo(() => [0, 100, 200, 300, 400, 500, 600, 700], []);
  const ticksY = useMemo(() => [0, 70, 140, 210, 280, 350, 420], []);

  return (
    <div className={`gis-map gis-map--${variant}`}>
      <svg viewBox="0 0 700 420" className="gis-map-svg" preserveAspectRatio="xMidYMid slice">
        {showImagery && (
          <>
            <rect x="0" y="0" width="700" height="420" fill="url(#imageryFill)" />
            {ticksX.map((x) => (
              <line key={`gx-${x}`} x1={x} y1="0" x2={x} y2="420" className="gis-grid-line" />
            ))}
            {ticksY.map((y) => (
              <line key={`gy-${y}`} x1="0" y1={y} x2="700" y2={y} className="gis-grid-line" />
            ))}
          </>
        )}

        {showLandUse && (
          <>
            <rect x="0" y="0" width="240" height="260" className="gis-landuse gis-landuse--residential" />
            <rect x="400" y="0" width="220" height="260" className="gis-landuse gis-landuse--commercial" />
            <rect x="0" y="260" width="700" height="160" className="gis-landuse gis-landuse--mixed" />
          </>
        )}

        {showRoads &&
          ROADS.map((d, i) => <path key={i} d={d} className="gis-road" />)}

        {showParcels &&
          PARCELS.map((d, i) => <path key={i} d={d} className="gis-parcel" />)}

        {showBuildings &&
          BUILDINGS.map((b) => (
            <rect
              key={b.id}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx="1.5"
              className={
                "gis-building" + (selectedId === b.id ? " gis-building--selected" : "")
              }
              onClick={onSelectBuilding ? () => onSelectBuilding(b) : undefined}
            >
              {onSelectBuilding && <title>{b.id}</title>}
            </rect>
          ))}

        <defs>
          <pattern id="imageryFill" width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill="#dfe6ec" />
            <rect width="14" height="14" fill="#e7edf2" opacity="0.5" />
          </pattern>
        </defs>
      </svg>

      {variant === "full" && (
        <div className="gis-map-coords">
          <span>17.4239&deg; N</span>
          <span>78.4738&deg; E</span>
          <span>EPSG:32644</span>
        </div>
      )}
    </div>
  );
}
