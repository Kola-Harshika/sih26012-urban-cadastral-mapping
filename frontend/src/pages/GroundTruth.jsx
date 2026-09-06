import { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import DataTable from "../components/DataTable";

const INITIAL_ROWS = [
  { id: 1, feature: "BLD-0142", aiResult: "Building, 0.94", groundTruth: "—", verification: "pending" },
  { id: 2, feature: "BLD-0143", aiResult: "Building, 0.88", groundTruth: "—", verification: "pending" },
  { id: 3, feature: "BLD-0146", aiResult: "Building, 0.86", groundTruth: "—", verification: "pending" },
  { id: 4, feature: "BLD-0150", aiResult: "Building, 0.77", groundTruth: "—", verification: "pending" },
];

const verificationTone = { pending: "neutral", verified: "success", rejected: "error" };
const verificationLabel = { pending: "Pending", verified: "Verified", rejected: "Rejected" };

export default function GroundTruth() {
  const [rows, setRows] = useState(INITIAL_ROWS);

  function setVerification(id, verification) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, verification } : r)));
  }

  const verified = rows.filter((r) => r.verification === "verified").length;
  const rejected = rows.filter((r) => r.verification === "rejected").length;
  const pending = rows.length - verified - rejected;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Ground Truth &amp; Field Verification</h1>
        <p>Compare AI-extracted footprints against field-verified survey data.</p>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <h2>Survey Status</h2>
          </div>
          <StatusBadge tone="neutral">Pending</StatusBadge>
          <p className="card-subtext" style={{ marginTop: "10px" }}>
            No field survey has been imported for this demo dataset yet.
          </p>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Verification Statistics</h2>
          </div>
          <div className="stat-grid stat-grid--4-tight">
            <div className="result-tile">
              <span className="result-tile-label">Total Features</span>
              <span className="result-tile-value">{rows.length}</span>
            </div>
            <div className="result-tile">
              <span className="result-tile-label">Verified</span>
              <span className="result-tile-value">{verified}</span>
            </div>
            <div className="result-tile">
              <span className="result-tile-label">Pending</span>
              <span className="result-tile-value">{pending}</span>
            </div>
            <div className="result-tile">
              <span className="result-tile-label">Rejected</span>
              <span className="result-tile-value">{rejected}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Feature Verification</h2>
        </div>
        <DataTable
          columns={[
            { key: "feature", label: "Feature" },
            { key: "aiResult", label: "AI Result" },
            { key: "groundTruth", label: "Ground Truth" },
            {
              key: "verification",
              label: "Verification",
              render: (row) => (
                <StatusBadge tone={verificationTone[row.verification]}>
                  {verificationLabel[row.verification]}
                </StatusBadge>
              ),
            },
            {
              key: "action",
              label: "Action",
              render: (row) => (
                <div className="field-row">
                  <button className="btn btn--ghost btn--sm" onClick={() => setVerification(row.id, "verified")}>
                    Verify
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setVerification(row.id, "rejected")}>
                    Reject
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setVerification(row.id, "pending")}>
                    Review
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>GNSS / CORS Survey Data</h2>
          <StatusBadge tone="warning">Integration Planned</StatusBadge>
        </div>
        <p className="card-subtext">
          Live GNSS / CORS survey ingestion is not yet connected in this prototype. Ground-truth
          coordinates shown elsewhere on this page are placeholders.
        </p>
      </div>
    </div>
  );
}
