// Stylized wine-bottle illustration shown when a bottle has no photo.
// Original + trademark-safe (a generic bottle silhouette + brand initials),
// tinted by the expression accent so the catalog feels finished and vibrant.
function shade(hex: string, amt = -30) {
  const n = parseInt(hex.slice(1), 16);
  const c = (x: number) => Math.max(0, Math.min(255, x));
  return `rgb(${c((n >> 16) + amt)},${c(((n >> 8) & 0xff) + amt)},${c((n & 0xff) + amt)})`;
}

export default function BottleVisual({
  name,
  accent,
  size = 56,
}: {
  name: string;
  accent: string;
  size?: number;
}) {
  const initials = name
    .replace(/^(the|el|la|los|las)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const gid = `bv-${accent.replace("#", "")}`;
  const dark = shade(accent);

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      {/* soft backdrop */}
      <rect x="0" y="0" width="64" height="64" rx="12" fill={accent} opacity="0.12" />
      {/* bottle */}
      <path
        d="M28 8 h8 v4.5 c0 3 5 4 5 9.5 V52 a4 4 0 0 1 -4 4 H27 a4 4 0 0 1 -4 -4 V22 c0 -5.5 5 -6.5 5 -9.5 z"
        fill={`url(#${gid})`}
      />
      {/* cap */}
      <rect x="27.5" y="5" width="9" height="4" rx="1" fill={dark} />
      {/* highlight */}
      <rect x="26" y="22" width="3" height="30" rx="1.5" fill="#fff" opacity="0.18" />
      {/* label */}
      <rect x="25" y="32" width="14" height="13" rx="2" fill="#fbf7f0" opacity="0.96" />
      <text x="32" y="41.5" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={dark} fontFamily="Fraunces, Georgia, serif">
        {initials}
      </text>
    </svg>
  );
}
