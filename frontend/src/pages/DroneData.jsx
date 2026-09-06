import { useRef, useState } from "react";
import { IconUpload } from "../components/Icons";
import StatusBadge from "../components/StatusBadge";
import MapPlaceholder from "../components/MapPlaceholder";

export default function DroneData() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  function handleFiles(fileList) {
    const f = fileList && fileList[0];
    if (!f) return;
    setFile({
      name: f.name,
      width: 8192,
      height: 6144,
      crs: "WGS 84 / UTM zone 44N",
      resolution: "5.2 cm/px",
      bands: "4 (R, G, B, NIR)",
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Drone Data</h1>
        <p>Upload high-resolution GeoTIFF or orthomosaic imagery for cadastral analysis.</p>
      </div>

      <div className="card">
        <div
          className={"upload-zone" + (dragOver ? " upload-zone--drag" : "")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <IconUpload size={28} />
          <h3>Upload GeoTIFF / Orthomosaic</h3>
          <p>Drag and drop a file here, or browse from your device.</p>
          <p className="upload-zone-formats">Supported formats: .tif, .tiff</p>
          <button className="btn btn--primary" onClick={() => inputRef.current?.click()}>
            Browse Files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".tif,.tiff"
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <h2>Image Information</h2>
            {!file && <StatusBadge tone="neutral">No file selected</StatusBadge>}
          </div>
          {file ? (
            <dl className="info-list">
              <div>
                <dt>File name</dt>
                <dd>{file.name}</dd>
              </div>
              <div>
                <dt>Width</dt>
                <dd>{file.width}px</dd>
              </div>
              <div>
                <dt>Height</dt>
                <dd>{file.height}px</dd>
              </div>
              <div>
                <dt>Coordinate Reference System</dt>
                <dd>{file.crs}</dd>
              </div>
              <div>
                <dt>Resolution</dt>
                <dd>{file.resolution}</dd>
              </div>
              <div>
                <dt>Bands</dt>
                <dd>{file.bands}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-note">
              Select a GeoTIFF above to preview its metadata. Metadata shown for the demo is illustrative
              until this page is connected to the backend ingestion service.
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Dataset Preview</h2>
            <StatusBadge tone="neutral">Demo Visualization</StatusBadge>
          </div>
          <MapPlaceholder variant="preview" layers={{ imagery: true, buildings: false, parcels: false, roads: false, landUse: false }} />
          <p className="card-subtext" style={{ marginTop: "10px" }}>
            Rendered locally for demonstration — no external map service is required.
          </p>
        </div>
      </div>
    </div>
  );
}
