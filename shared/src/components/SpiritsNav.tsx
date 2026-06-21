/** Spirit apps with their display names, domains, and accent colors. */
const SPIRITS = [
  { id: "wine", label: "Wine", href: "https://wine.roamthrough.com", color: "#722F37" },
  { id: "gin", label: "Gin", href: "https://gin.roamthrough.com", color: "#4A7C59" },
  { id: "bourbon", label: "Bourbon", href: "https://bourbon.roamthrough.com", color: "#B5651D" },
  { id: "tequila", label: "Tequila", href: "https://tequila.roamthrough.com", color: "#2E86AB" },
  { id: "scotch", label: "Scotch", href: "https://scotch.roamthrough.com", color: "#C28A3D" },
] as const;

const HUB_URL = "https://spirits.roamthrough.com";

interface SpiritsNavProps {
  /** Which spirit app is active (highlights the current link). */
  currentApp?: string;
  /** Optional className for the nav wrapper. */
  className?: string;
  /** Current user (pass from your app's auth context). */
  user?: { name?: string; email?: string; username?: string } | null;
  /** Sign out handler (pass from your app's auth context). */
  onSignOut?: () => void;
}

/**
 * Cross-app navigation bar for all Spirit Roam apps. Shows links to each spirit
 * domain (using href, not client routing) and auth state.
 *
 * Can be used standalone (provide user/onSignOut props) or within a
 * SpiritAuthProvider context.
 */
export function SpiritsNav({ currentApp, className, user, onSignOut }: SpiritsNavProps) {
  return (
    <nav
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        background: "rgba(0,0,0,0.03)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        fontSize: 14,
        fontFamily: "system-ui, sans-serif",
        flexWrap: "wrap",
      }}
      aria-label="Spirit apps navigation"
    >
      {/* Hub link */}
      <a
        href={HUB_URL}
        style={{
          fontWeight: 700,
          textDecoration: "none",
          color: "#333",
          marginRight: 8,
        }}
      >
        🥃 Spirits
      </a>

      {/* Spirit app links */}
      <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
        {SPIRITS.map((s) => (
          <a
            key={s.id}
            href={s.href}
            style={{
              textDecoration: "none",
              padding: "4px 10px",
              borderRadius: 6,
              color: currentApp === s.id ? "#fff" : s.color,
              background: currentApp === s.id ? s.color : "transparent",
              fontWeight: currentApp === s.id ? 600 : 400,
              transition: "background 0.15s, color 0.15s",
            }}
            aria-current={currentApp === s.id ? "page" : undefined}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Auth section */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
        {user ? (
          <>
            <span style={{ color: "#555", fontSize: 13 }}>
              {user.name || user.email || user.username}
            </span>
            {onSignOut && (
              <button
                onClick={onSignOut}
                style={{
                  background: "none",
                  border: "1px solid #ccc",
                  borderRadius: 5,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#555",
                }}
              >
                Sign Out
              </button>
            )}
          </>
        ) : (
          <a
            href={HUB_URL}
            style={{
              textDecoration: "none",
              padding: "4px 12px",
              borderRadius: 5,
              background: "#333",
              color: "#fff",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Log In
          </a>
        )}
      </div>
    </nav>
  );
}
