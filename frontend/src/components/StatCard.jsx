export default function StatCard({ icon: Icon, label, value, hint, tone = "default" }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <span className="stat-card-icon">
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {hint && <div className="stat-card-hint">{hint}</div>}
    </div>
  );
}
