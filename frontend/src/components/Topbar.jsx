import { IconBell, IconUser, IconMenu } from "./Icons";

export default function Topbar({ title, onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <IconMenu size={20} />
        </button>
        <div>
          <span className="topbar-title">{title}</span>
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-pill">
          <span className="status-dot status-dot--live" />
          AI Engine Ready
        </span>
        <button className="icon-btn" aria-label="Notifications">
          <IconBell size={18} />
          <span className="icon-btn-dot" />
        </button>
        <button className="topbar-profile">
          <span className="avatar">
            <IconUser size={16} />
          </span>
          <span className="topbar-profile-text">
            <span className="topbar-profile-name">SIH Team</span>
            <span className="topbar-profile-role">Field Demo Account</span>
          </span>
        </button>
      </div>
    </header>
  );
}
