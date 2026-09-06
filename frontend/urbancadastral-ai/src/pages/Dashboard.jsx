import StatCard from "../components/StatCard";
import Workflow from "../components/Workflow";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import { IconDrone, IconCpu, IconBuilding, IconCheckSquare } from "../components/Icons";

const WORKFLOW_STEPS = [
  { label: "Drone Imagery", sub: "GeoTIFF input", state: "done" },
  { label: "Preprocessing", sub: "Tiling & normalization", state: "done" },
  { label: "U-Net Segmentation", sub: "Building probability mask", state: "active" },
  { label: "Building Footprints", sub: "Polygonized vectors", state: "pending" },
  { label: "GeoJSON", sub: "Export layer", state: "pending" },
];

const RECENT_ROWS = [
  { id: 1, dataset: "Ward-14 Orthomosaic", image: "ward14_ortho_01.tif", processing: "Not started", buildings: "--", status: "queued" },
  { id: 2, dataset: "Sector-9 Survey Block", image: "sector9_block_a.tif", processing: "Not started", buildings: "--", status: "queued" },
  { id: 3, dataset: "Old City Cadastral Zone", image: "oldcity_zone3.tif", processing: "Not started", buildings: "--", status: "queued" },
];

const MODULES = [
  { name: "Building Footprint Extraction", tone: "success", label: "ACTIVE" },
  { name: "Parcel Boundary Extraction", tone: "warning", label: "PLANNED" },
  { name: "Road Detection", tone: "warning", label: "PLANNED" },
  { name: "Land Use Classification", tone: "warning", label: "PLANNED" },
  { name: "Topology Validation", tone: "warning", label: "PLANNED" },
];

const statusTone = { queued: "neutral" };

export default function Dashboard() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Urban Cadastral Mapping Dashboard</h1>
        <p>Monitor drone imagery, AI extraction and cadastral mapping workflows.</p>
      </div>

      <div className="stat-grid">
        <StatCard icon={IconDrone} label="Drone Images" value="1,012" hint="Ingested this project" />
        <StatCard icon={IconCpu} label="AI Processed" value="0" hint="Demo data — run analysis to populate" />
        <StatCard icon={IconBuilding} label="Buildings Detected" value="0" hint="Awaiting first inference run" />
        <StatCard icon={IconCheckSquare} label="Validation Issues" value="0" hint="No geometry checked yet" />
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>AI Processing Overview</h2>
            <p className="card-subtext">Current implemented pipeline: building footprint extraction from GeoTIFF imagery.</p>
          </div>
          <StatusBadge tone="info">Prototype Status</StatusBadge>
        </div>
        <Workflow steps={WORKFLOW_STEPS} />
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Recent Analysis</h2>
            <p className="card-subtext">Sample dataset queue — no imagery has been processed yet in this demo.</p>
          </div>
        </div>
        <DataTable
          columns={[
            { key: "dataset", label: "Dataset" },
            { key: "image", label: "Image" },
            { key: "processing", label: "Processing" },
            { key: "buildings", label: "Buildings" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge tone={statusTone[row.status] || "neutral"}>Demo · Queued</StatusBadge>,
            },
          ]}
          rows={RECENT_ROWS}
        />
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>System Modules</h2>
            <p className="card-subtext">Honest status of each capability required by SIH26012.</p>
          </div>
        </div>
        <ul className="module-list">
          {MODULES.map((m) => (
            <li key={m.name} className="module-list-item">
              <span>{m.name}</span>
              <StatusBadge tone={m.tone}>{m.label}</StatusBadge>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
