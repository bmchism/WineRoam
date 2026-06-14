// Segmented rating input (1-5 or 1-10). Big touch targets for mobile.
export default function RatingControl({
  label,
  value,
  max = 5,
  accent,
  onChange,
}: {
  label: string;
  value: number;
  max?: number;
  accent: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rate">
      <div className="rate-head">
        <span className="rate-label">{label}</span>
        <span className="rate-val" style={{ color: value ? accent : "var(--muted)" }}>
          {value || "—"}
          {max === 10 ? "/10" : ""}
        </span>
      </div>
      <div className="rate-track">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`rate-dot${n <= value ? " on" : ""}`}
            style={n <= value ? { background: accent, borderColor: accent } : undefined}
            onClick={() => onChange(n)}
            aria-label={`${label} ${n}`}
          />
        ))}
      </div>
    </div>
  );
}
