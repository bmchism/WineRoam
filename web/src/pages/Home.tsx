import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppBar from "../components/AppBar";
import { useAuth } from "../lib/auth";
import { loadProfile } from "../lib/profile";
import { curatedFlights, bottlesForFlight } from "../data/flights";
import { useBottlesReady } from "../lib/bottleStore";
import { BookIcon, GlassIcon, UsersIcon, CameraIcon, WineMark, GrapeIcon } from "../icons";

const ACTIONS = [
  { to: "/catalog", title: "Explore Wines", sub: "Browse the collection", Icon: GlassIcon, c: "#722F37", c2: "#4a1c22", big: true },
  { to: "/tastings", title: "Host a Tasting", sub: "Build a flight, invite friends", Icon: UsersIcon, c: "#5c7a5a", c2: "#3a5438", big: true },
  { to: "/scan", title: "Scan a Bottle", sub: "Identify it instantly", Icon: CameraIcon, c: "#5E8C7D", c2: "#3c6457" },
  { to: "/learn/process", title: "How It's Made", sub: "The winemaking journey", Icon: WineMark, c: "#A66A33", c2: "#79491f" },
  { to: "/learn/wineries", title: "Wineries", sub: "Meet the producers", Icon: GrapeIcon, c: "#8A6D3B", c2: "#5f4a24" },
  { to: "/learn", title: "Learn the Basics", sub: "Wine 101", Icon: BookIcon, c: "#9AA7B2", c2: "#6b7a85" },
];

const HERO = "https://commons.wikimedia.org/wiki/Special:FilePath/Vignoble_de_Lavaux_en_automne.jpg?width=1000";

export default function Home() {
  const { user } = useAuth();
  useBottlesReady();
  const name = (user ? loadProfile(user.username).displayName : "") || user?.name || "";
  const featured = curatedFlights[0];
  const fb = bottlesForFlight(featured);

  return (
    <>
      <AppBar />
      <main className="screen home">
        {/* Photo hero with greeting */}
        <motion.div className="home-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="home-hero-photo">
            <img src={HERO} alt="Terraced vineyards at sunset" loading="eager" referrerPolicy="no-referrer"
              onError={(e) => { (e.currentTarget.closest(".home-hero-photo") as HTMLElement)?.classList.add("noimg"); }} />
          </div>
          <div className="home-hero-text">
            <img src="/logo.svg" alt="Wine Roam" className="home-hero-logo" />
            <span className="kicker">{user ? "Welcome back" : "Welcome"}</span>
            <h1>{name ? `Cheers, ${name}` : "What are we tasting?"}</h1>
            <p>Learn it, explore it, host it — start anywhere.</p>
          </div>
        </motion.div>

        {/* Vibrant action grid */}
        <div className="home-grid2">
          {ACTIONS.map((a, i) => (
            <motion.div
              key={a.to}
              className={a.big ? "hcell-big" : "hcell"}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.05 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link to={a.to} className="htile" style={{ background: `linear-gradient(145deg, ${a.c}, ${a.c2})` }}>
                <span className="htile-icn"><a.Icon size={a.big ? 26 : 22} /></span>
                <div className="htile-body">
                  <div className="htile-t">{a.title}</div>
                  <div className="htile-s">{a.sub}</div>
                </div>
                <span className="htile-go">→</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Featured flight */}
        {featured && (
          <>
            <div className="section-head"><span className="kicker">Try this</span><h2>Featured Flight</h2></div>
            <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.99 }}>
              <Link to={`/flight/${featured.id}`} className="flight-card tap home-flight">
                <div className="ft">{featured.title}</div>
                <div className="fs">{featured.subtitle}</div>
                <div className="flight-foot">
                  <div className="dotrow">{fb.map((b) => <span key={b.id} className="edot" style={{ background: b.accent }} />)}</div>
                  <span className="badge cached dot">Curated · {fb.length} pours</span>
                </div>
              </Link>
            </motion.div>
          </>
        )}
      </main>
    </>
  );
}
