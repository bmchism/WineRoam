import { SpiritsNav } from "@agave/shared/components";
import { useSpiritAuth } from "@agave/shared/auth";

const SPIRITS = [
  {
    id: "wine",
    name: "Wine Roam",
    href: "https://wine.roamthrough.com",
    color: "#722F37",
    emoji: "🍷",
    desc: "Explore wines from around the world. Learn WSET tasting, host flights, scan bottles.",
  },
  {
    id: "gin",
    name: "Gin Roam",
    href: "https://gin.roamthrough.com",
    color: "#4A7C59",
    emoji: "🍸",
    desc: "Discover botanicals, distillation styles, and craft gin from every corner of the globe.",
  },
  {
    id: "bourbon",
    name: "Bourbon Roam",
    href: "https://bourbon.roamthrough.com",
    color: "#B5651D",
    emoji: "🥃",
    desc: "From Bottled-in-Bond to Single Barrel — taste, rate, and learn American whiskey.",
  },
  {
    id: "tequila",
    name: "Tequila Roam",
    href: "https://tequila.roamthrough.com",
    color: "#2E86AB",
    emoji: "🌵",
    desc: "Blanco to Extra Añejo — explore agave expressions, NOMs, and additive-free spirits.",
  },
  {
    id: "scotch",
    name: "Scotch Roam",
    href: "https://scotch.roamthrough.com",
    color: "#C28A3D",
    emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    desc: "Single malts, blends, and cask-strength expressions from Scotland's regions.",
  },
];

export default function App() {
  const { user, loading, signInWithSSO, signOut } = useSpiritAuth();

  return (
    <div className="spirits-app">
      <SpiritsNav user={user} onSignOut={signOut} />

      <main className="spirits-main">
        <header className="spirits-header">
          <h1>🥃 Spirit Roam</h1>
          <p className="spirits-tagline">
            One account. Five spirit worlds. Sign in once, explore everywhere.
          </p>
        </header>

        {/* If not logged in, show sign-in CTA */}
        {!loading && !user && (
          <section className="spirits-auth-section">
            <div className="auth-form">
              <h3>Sign in to Spirit Roam</h3>
              <p style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
                One account works across all spirit apps.
              </p>
              <button onClick={signInWithSSO} className="sso-button">
                Sign In / Create Account
              </button>
            </div>
          </section>
        )}

        {/* Welcome message when signed in */}
        {!loading && user && (
          <section className="spirits-welcome">
            <p>Welcome back, <strong>{user.name || user.email || user.username}</strong>. Pick a spirit to explore:</p>
          </section>
        )}

        {/* Spirit app cards */}
        <section className="spirits-grid">
          {SPIRITS.map((s) => (
            <a
              key={s.id}
              href={s.href}
              className="spirit-card"
              style={{ borderColor: s.color }}
            >
              <span className="spirit-card-emoji">{s.emoji}</span>
              <div className="spirit-card-body">
                <h2 style={{ color: s.color }}>{s.name}</h2>
                <p>{s.desc}</p>
              </div>
              <span className="spirit-card-arrow" style={{ color: s.color }}>→</span>
            </a>
          ))}
        </section>

        <footer className="spirits-footer">
          <p>© 2026 Spirit Roam. All apps share a single account — sign up on any app and you're in everywhere.</p>
        </footer>
      </main>
    </div>
  );
}
