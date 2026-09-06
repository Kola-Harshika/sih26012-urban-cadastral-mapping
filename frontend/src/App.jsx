import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Land_Use from "./pages/Land_Use";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import DroneData from "./pages/DroneData";
import AIAnalysis from "./pages/AIAnalysis";
import ParcelMapping from "./pages/ParcelMapping";
import WebGIS from "./pages/WebGIS";
import Validation from "./pages/Validation";
import GroundTruth from "./pages/GroundTruth";
import Reports from "./pages/Reports";

const TITLES = {
  "/": "Urban Cadastral Mapping",
  "/drone-data": "Urban Cadastral Mapping",
  "/ai-analysis": "Urban Cadastral Mapping",
  "/parcel-mapping": "Urban Cadastral Mapping",
  "/land-use": "Urban Cadastral Mapping",
  "/web-gis": "Urban Cadastral Mapping",
  "/validation": "Urban Cadastral Mapping",
  "/ground-truth": "Urban Cadastral Mapping",
  "/reports": "Urban Cadastral Mapping",
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = TITLES[location.pathname] || "Urban Cadastral Mapping";

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/drone-data" element={<DroneData />} />
            <Route path="/ai-analysis" element={<AIAnalysis />} />
            <Route path="/parcel-mapping" element={<ParcelMapping />} />
            <Route path="/land-use" element={<Land_Use />} />
            <Route path="/web-gis" element={<WebGIS />} />
            <Route path="/validation" element={<Validation />} />
            <Route path="/ground-truth" element={<GroundTruth />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
