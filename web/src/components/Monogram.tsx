// Brand-initial monogram used when a bottle has no photo. Original, trademark-safe
// (just initials + the expression accent), so every bottle looks finished.
export default function Monogram({
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
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: `linear-gradient(150deg, ${accent}, ${shade(accent)})`,
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--serif)",
        fontWeight: 600,
        fontSize: size * 0.34,
        letterSpacing: 0.5,
      }}
    >
      {initials}
    </div>
  );
}

function shade(hex: string, amt = -26) {
  const n = parseInt(hex.slice(1), 16);
  const c = (x: number) => Math.max(0, Math.min(255, x));
  return `rgb(${c((n >> 16) + amt)},${c(((n >> 8) & 0xff) + amt)},${c((n & 0xff) + amt)})`;
}
