// Renders a horizontal (wraps to vertical on narrow screens) pipeline of labelled steps.
// steps: [{ label, sub, state }]  state: "done" | "active" | "pending"
export default function Workflow({ steps }) {
  return (
    <div className="workflow">
      {steps.map((step, i) => (
        <div className="workflow-item" key={step.label}>
          <div className={`workflow-node workflow-node--${step.state || "pending"}`}>
            <span className="workflow-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="workflow-label">{step.label}</span>
            {step.sub && <span className="workflow-sub">{step.sub}</span>}
          </div>
          {i < steps.length - 1 && <span className="workflow-arrow">&rarr;</span>}
        </div>
      ))}
    </div>
  );
}
