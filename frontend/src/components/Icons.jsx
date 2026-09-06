// Lightweight hand-drawn icon set (no external icon library required).
// Each icon accepts a `size` and forwards other props (className, style, onClick...).

const base = (size) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export function IconGrid({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconDrone({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="2.4" />
      <path d="M5 5l3.2 3.2M19 5l-3.2 3.2M5 19l3.2-3.2M19 19l-3.2-3.2" />
      <circle cx="4.2" cy="4.2" r="1.6" />
      <circle cx="19.8" cy="4.2" r="1.6" />
      <circle cx="4.2" cy="19.8" r="1.6" />
      <circle cx="19.8" cy="19.8" r="1.6" />
    </svg>
  );
}

export function IconCpu({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  );
}

export function IconMap({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export function IconCheckSquare({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M8 12l2.5 2.5L16.5 9" />
    </svg>
  );
}

export function IconTarget({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.7" fill="currentColor" />
    </svg>
  );
}

export function IconFileText({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M6 2.5h8L19 7v14.5H6z" />
      <path d="M14 2.5V7h5" />
      <path d="M9 13h6M9 16.5h6" />
    </svg>
  );
}

export function IconBell({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconUser({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M4.7 19.5a7.3 7.3 0 0 1 14.6 0" />
    </svg>
  );
}

export function IconUpload({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  );
}

export function IconDownload({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 4v11M8 11l4 4 4-4" />
      <path d="M4.5 16.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2.5" />
    </svg>
  );
}

export function IconEye({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function IconPlus({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMinus({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconMaximize({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M9 3.5H3.5V9M15 3.5h5.5V9M9 20.5H3.5V15M15 20.5h5.5V15" />
    </svg>
  );
}

export function IconLayers({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M12 3.5l8.5 4.5L12 12.5 3.5 8z" />
      <path d="M3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />
    </svg>
  );
}

export function IconRuler({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="3" y="8.5" width="18" height="7" rx="1" transform="rotate(-8 12 12)" />
      <path d="M7 9.5l.7 2M11 9l.7 2M15 8.5l.7 2" />
    </svg>
  );
}

export function IconCursor({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M5 3l6 16 2.2-6.3L19.5 10.4 5 3z" />
    </svg>
  );
}

export function IconChevronDown({ size = 16, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconMenu({ size = 20, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
  );
}

export function IconX({ size = 16, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function IconBuilding({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="5" y="3.5" width="9" height="17" />
      <rect x="14" y="9" width="5" height="11.5" />
      <path d="M7.5 7h1M10.5 7h1M7.5 10.5h1M10.5 10.5h1M7.5 14h1M10.5 14h1" />
    </svg>
  );
}

export function IconSatellite({ size = 18, ...p }) {
  return (
    <svg {...base(size)} {...p}>
      <rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)" />
      <path d="M4 4l3 3M20 4l-3 3M2 14l4.5 1.5M22 14l-4.5 1.5" />
    </svg>
  );
}
