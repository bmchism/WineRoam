// Organic / Biodynamic / Natural Wine badge. Shown on any bottle
// confirmed organic, biodynamic, or natural. Links to the
// "what is wine" explainer when interactive.
import { Link } from "react-router-dom";

interface Props {
  size?: "sm" | "md";
  asLink?: boolean;
  label?: string;
}

export default function AfBadge({ size = "sm", asLink = true, label = "Organic" }: Props) {
  const inner = (
    <>
      <span className="af-icon" aria-hidden>🍇</span>
      <span>{label}</span>
    </>
  );
  if (asLink) {
    return (
      <Link to="/learn/what-is-wine" className={`af-badge af-${size}`} title={`${label} — sustainably produced wine. Tap to learn more.`}>
        {inner}
      </Link>
    );
  }
  return <span className={`af-badge af-${size}`}>{inner}</span>;
}
