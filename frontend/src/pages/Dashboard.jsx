import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import {
  IconCheckSquare,
  IconCpu,
  IconFileText,
  IconMap,
} from "../components/Icons";

const WORKFLOW = [
  "Input Drone Imagery",
  "Preprocessing",
  "Building Extraction",
  "Road Detection",
  "Parcel Generation",
  "Land Use Classification",
  "Topology Validation",
  "GeoJSON Output",
];

const MODULES = [
  {
    title: "Building Footprint Extraction",
    description:
      "AI-based building footprint segmentation using a U-Net model.",
    status: "ACTIVE",
    tone: "success",
    icon: IconCpu,
  },
  {
    title: "Road Detection",
    description:
      "Prototype road-feature extraction from high-resolution imagery.",
    status: "ACTIVE",
    tone: "success",
    icon: IconMap,
  },
  {
    title: "Parcel Boundary Extraction",
    description:
      "Candidate parcel generation using detected buildings and road features.",
    status: "PROTOTYPE",
    tone: "warning",
    icon: IconMap,
  },
  {
    title: "Land Use Classification",
    description:
      "Prototype classification of residential, commercial, vegetation and transportation zones.",
    status: "PROTOTYPE",
    tone: "warning",
    icon: IconMap,
  },
  {
    title: "Topology Validation",
    description:
      "Prototype validation for overlaps, gaps, duplicates and boundary consistency.",
    status: "PROTOTYPE",
    tone: "warning",
    icon: IconCheckSquare,
  },
];

export default function Dashboard() {
  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">
        <h1>Urban Cadastral Mapping</h1>

        <p>
          AI-powered urban parcel mapping and cadastral feature
          extraction using high-resolution geospatial imagery.
        </p>
      </div>

      {/* STATS */}
      <div className="stat-grid stat-grid--4">

        <div className="result-tile">
          <span className="result-tile-label">
            Dataset Images
          </span>

          <span className="result-tile-value">
            1,012
          </span>

          <span className="card-subtext">
            High-resolution imagery
          </span>
        </div>

        <div className="result-tile">
          <span className="result-tile-label">
            AI Model
          </span>

          <span className="result-tile-value">
            U-Net
          </span>

          <span className="card-subtext">
            Building segmentation
          </span>
        </div>

        <div className="result-tile">
          <span className="result-tile-label">
            Processing
          </span>

          <span className="result-tile-value">
            Active
          </span>

          <span className="card-subtext">
            Analysis pipeline
          </span>
        </div>

        <div className="result-tile">
          <span className="result-tile-label">
            GIS Output
          </span>

          <span className="result-tile-value">
            GeoJSON
          </span>

          <span className="card-subtext">
            GIS-ready vector data
          </span>
        </div>

      </div>

      {/* COMPLETE WORKFLOW */}
      <div className="card">

        <div className="card-head">
          <div>
            <h2>Complete Processing Workflow</h2>

            <p className="card-subtext">
              Automated cadastral feature extraction pipeline.
            </p>
          </div>

          <StatusBadge tone="success">
            8 Stages
          </StatusBadge>
        </div>

        <div className="workflow-flow">

          {WORKFLOW.map((step, index) => (
            <div
              className="workflow-flow-group"
              key={step}
            >

              <div className="workflow-flow-item">

                <div className="workflow-flow-number">
                  {index + 1}
                </div>

                <strong>
                  {step}
                </strong>

              </div>

              {index < WORKFLOW.length - 1 && (
                <div className="workflow-arrow">
                  →
                </div>
              )}

            </div>
          ))}

        </div>

      </div>

      {/* PROCESSING MODULES */}
      <div className="card">

        <div className="card-head">

          <div>
            <h2>Processing Modules</h2>

            <p className="card-subtext">
              Current implementation status of the cadastral
              analysis components.
            </p>
          </div>

        </div>

        <div className="module-grid">

          {MODULES.map((module) => {
            const ModuleIcon = module.icon;

            return (
              <div
                className="module-card"
                key={module.title}
              >

                <div className="module-card-top">

                  <div className="module-icon">
                    <ModuleIcon size={20} />
                  </div>

                  <StatusBadge tone={module.tone}>
                    {module.status}
                  </StatusBadge>

                </div>

                <h3>
                  {module.title}
                </h3>

                <p>
                  {module.description}
                </p>

              </div>
            );
          })}

        </div>
      </div>

      {/* AI ANALYSIS + WEB GIS */}
      <div className="two-col">

        <div className="card">

          <div className="card-head">

            <div>
              <h2>AI Cadastral Analysis</h2>

              <p className="card-subtext">
                Run the imagery analysis pipeline.
              </p>
            </div>

            <IconCpu size={22} />

          </div>

          <p>
            Upload a high-resolution GeoTIFF image to perform
            building footprint extraction, road detection and
            candidate parcel generation.
          </p>

          <Link
            to="/ai-analysis"
            className="btn btn--primary"
          >
            Open AI Analysis
          </Link>

        </div>

        <div className="card">

          <div className="card-head">

            <div>
              <h2>Web GIS Map</h2>

              <p className="card-subtext">
                Visualize cadastral layers and GIS outputs.
              </p>
            </div>

            <IconMap size={22} />

          </div>

          <p>
            View imagery together with building footprints,
            roads, candidate parcels and prototype land-use
            layers.
          </p>

          <Link
            to="/web-gis"
            className="btn btn--ghost"
          >
            Open Web GIS
          </Link>

        </div>

      </div>

      {/* VALIDATION + REPORTS */}
      <div className="two-col">

        <div className="card">

          <div className="card-head">

            <div>
              <h2>Topology & Geometry Validation</h2>

              <p className="card-subtext">
                Validate GIS feature geometry and topology.
              </p>
            </div>

            <IconCheckSquare size={22} />

          </div>

          <p>
            Prototype checks include overlaps, gaps, duplicate
            geometries and boundary consistency.
          </p>

          <Link
            to="/validation"
            className="btn btn--ghost"
          >
            Open Validation
          </Link>

        </div>

        <div className="card">

          <div className="card-head">

            <div>
              <h2>Reports & Export</h2>

              <p className="card-subtext">
                Generate and export project results.
              </p>
            </div>

            <IconFileText size={22} />

          </div>

          <p>
            Access analysis summaries and GIS-ready outputs
            generated by the cadastral mapping pipeline.
          </p>

          <Link
            to="/reports"
            className="btn btn--ghost"
          >
            Open Reports
          </Link>

        </div>

      </div>

      {/* IMPLEMENTATION STATUS */}
      <div className="card">

        <div className="card-head">
          <h2>Prototype Implementation Status</h2>
        </div>

        <p className="card-subtext">
          The current prototype includes a connected AI
          building extraction pipeline with road detection
          and candidate parcel generation. Land-use
          classification and topology validation are
          demonstrated as prototype modules. The architecture
          is designed for georeferenced drone imagery and
          GIS integration.
        </p>

      </div>

    </div>
  );
}