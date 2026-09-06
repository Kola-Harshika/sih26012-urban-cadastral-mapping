import { NavLink } from "react-router-dom";
import {
  IconGrid,
  IconDrone,
  IconCpu,
  IconMap,
  IconCheckSquare,
  IconTarget,
  IconFileText,
  IconX,
} from "./Icons";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: IconGrid, end: true },
  { to: "/drone-data", label: "Drone Data", icon: IconDrone },
  { to: "/ai-analysis", label: "AI Analysis", icon: IconCpu },
  { to: "/web-gis", label: "Web GIS Map", icon: IconMap },
  { to: "/validation", label: "Validation", icon: IconCheckSquare },
  { to: "/ground-truth", label: "Ground Truth", icon: IconTarget },
  { to: "/reports", label: "Reports & Export", icon: IconFileText },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} />}
      <aside className={"sidebar" + (open ? " sidebar--open" : "")}>
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark">UC</span>
            <div className="brand-text">
              <span className="brand-name">UrbanCadastral AI</span>
              <span className="brand-sub">Cadastral Mapping Suite</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <IconX size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                "sidebar-link" + (isActive ? " sidebar-link--active" : "")
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-status">
            <span className="status-dot status-dot--live" />
            <div>
              <div className="sidebar-status-title">System Status</div>
              <div className="sidebar-status-sub">AI Engine Ready</div>
            </div>
          </div>
          <div className="sidebar-meta">SIH26012 &middot; DoLR, MoRD</div>
        </div>
      </aside>
    </>
  );
}
