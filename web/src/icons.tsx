// Minimal line icons (wine motif). Stroke inherits currentColor.
type P = { className?: string; size?: number };
const base = (size = 24) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

// Wine glass / grape cluster mark (brand icon)
export const WineMark = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 2c0 0-5 3-5 7a5 5 0 0 0 5 5 5 5 0 0 0 5-5c0-4-5-7-5-7Z" />
    <path d="M12 14v7" />
    <path d="M9 21h6" />
  </svg>
);

// Keep AgaveMark as alias for backward compat during transition
export const AgaveMark = WineMark;

export const BookIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
  </svg>
);

export const GlassIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M8 2h8l-.5 5a3.5 3.5 0 0 1-7 0Z" />
    <path d="M12 10v8" />
    <path d="M8 22h8" />
    <path d="M8 5h8" />
  </svg>
);

export const UsersIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3 3 0 0 1 0 5.6" />
    <path d="M17 14.2A5.5 5.5 0 0 1 20.5 19" />
  </svg>
);

export const UserIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

export const BottleIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M10 2h4v3l1.2 2.4A4 4 0 0 1 15.6 9L15.5 20a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2L8.4 9a4 4 0 0 1 .4-1.6L10 5Z" />
    <path d="M8.5 13h7" />
  </svg>
);

export const CameraIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
);

export const HomeIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

export const ChevronRight = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

// Grape cluster icon (for wineries page)
export const GrapeIcon = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="10" cy="8" r="2" />
    <circle cx="14" cy="8" r="2" />
    <circle cx="8" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="16" cy="12" r="2" />
    <circle cx="10" cy="16" r="2" />
    <circle cx="14" cy="16" r="2" />
    <path d="M12 2c1-1 3-1 4 0" />
  </svg>
);

// Brand marks (fill-based, official colors) for federated sign-in buttons.
export const GoogleMark = ({ className, size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" className={className} aria-hidden>
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
    <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
  </svg>
);
export const AppleMark = ({ className, size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" className={className} aria-hidden>
    <path d="M13.62 9.6c-.02-1.77 1.45-2.62 1.51-2.66-.82-1.2-2.1-1.37-2.56-1.39-1.09-.11-2.13.64-2.68.64-.55 0-1.41-.62-2.32-.6-1.19.02-2.29.69-2.9 1.76-1.24 2.15-.32 5.32.89 7.06.59.85 1.29 1.8 2.21 1.77.89-.04 1.22-.57 2.3-.57 1.07 0 1.37.57 2.31.55.95-.02 1.56-.87 2.14-1.72.67-.99.95-1.94.96-1.99-.02-.01-1.85-.71-1.86-2.8ZM11.86 4.4c.49-.6.82-1.42.73-2.25-.71.03-1.56.47-2.07 1.06-.45.52-.85 1.36-.74 2.16.79.06 1.6-.4 2.08-.97Z" />
  </svg>
);
