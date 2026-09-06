# UrbanCadastral AI — Frontend Prototype

This is a set of source files meant to be dropped into your **existing** Vite + React
project (I don't have access to your actual project files here, so I built these in
an isolated workspace — copy them across rather than expecting them already merged).

## 1. Install the one extra dependency
This UI uses client-side routing between the 7 pages:
```
npm install react-router-dom
```
Everything else (React, Vite) is assumed to already be in your project.

## 2. Copy these files into your project's `src/`
Replace/add:
```
src/
  components/
    Icons.jsx
    Sidebar.jsx
    Topbar.jsx
    StatCard.jsx
    StatusBadge.jsx
    MapPlaceholder.jsx
    Workflow.jsx
    DataTable.jsx
  pages/
    Dashboard.jsx
    DroneData.jsx
    AIAnalysis.jsx
    WebGIS.jsx
    Validation.jsx
    GroundTruth.jsx
    Reports.jsx
  App.jsx
  main.jsx
  index.css
```
`App.jsx` and `main.jsx` are full replacements — if you already have custom logic in
either (analytics, providers, etc.), merge by hand rather than overwriting blindly.
`index.css` is also a full replacement; if you have prior global styles you want to
keep, merge the `:root` variables and rules in rather than concatenating both files.

## 3. Run it
```
npm run dev
```

## What's real vs. what's UI-only
- All 7 pages, navigation, layout, and interactions (uploads, sliders, layer toggles,
  map feature selection, table actions, the "Run AI Analysis" progress simulation) are
  fully wired up in React state — nothing here needs a backend to demo.
- No page calls a fake API. Every "View" / "Export" / "Download" button on results that
  would need your Python inference service is disabled until a run completes, and then
  shows an inline note explaining it's a prototype control, not a real file operation.
- The Web GIS map is a hand-built SVG scene (mock buildings/roads/parcels/grid) so the
  demo needs no map API key, Mapbox token, or internet connection.
- Only "Building Footprint Extraction" is marked ACTIVE; parcels, roads, land use,
  topology validation, and GNSS/CORS are labeled PLANNED / Integration Planned, matching
  what your Python/PyTorch backend actually implements today.

## Wiring up the real backend later
`AIAnalysis.jsx` is the page to modify first — replace the `setInterval` progress
simulation in `runAnalysis()` with a `fetch()` call to your Python API (per the
React → Python API → src/infer.py → U-Net → GeoJSON pipeline), and feed the returned
building count / confidence / GeoJSON into the same state variables that currently
hold demo values.
