import { Link } from "react-router-dom";

// Shared footer with links to the public info pages. Used on the landing page,
// each info page, and Profile so they're reachable signed-in or out.
const LINKS: { to: string; label: string }[] = [
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/responsible", label: "Responsible Drinking" },
  { to: "/contact", label: "Contact" },
];

export default function LegalFooter() {
  return (
    <footer className="legal-foot">
      <nav className="legal-links" aria-label="Site information">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to}>{l.label}</Link>
        ))}
      </nav>
      <div className="legal-fine">
        🍇 Explore responsibly. Must be 21+ to use. Please drink responsibly.
        <br />© {YEAR} Wine Roam · Independent and not affiliated with any brand shown.
      </div>
    </footer>
  );
}

// App ships from a deterministic build; a fixed year avoids relying on the
// client clock and keeps the footer copy stable.
const YEAR = 2026;
