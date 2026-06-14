import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { WineMark, BookIcon, CameraIcon, UsersIcon, GlassIcon } from "../icons";
import AuthForm from "../components/AuthForm";
import LegalFooter from "../components/LegalFooter";
import { useAuth } from "../lib/auth";

// Vineyard hero image (Wikimedia Commons, CC).
const HERO_IMG =
  "https://commons.wikimedia.org/wiki/Special:FilePath/Vignoble_de_Lavaux_en_automne.jpg?width=1100";

// Positioned as a group activity first — the app is the excuse to gather.
const OCCASIONS = [
  { emoji: "🍽️", title: "Dinner parties", body: "A built-in icebreaker between courses — pour, score, and debate.", c: "#722F37", c2: "#4a1c22" },
  { emoji: "🤝", title: "Team building", body: "A relaxed, hands-on activity that actually gets people talking.", c: "#5E8C7D", c2: "#3c6457" },
  { emoji: "🥂", title: "Friends night", body: "Skip the same old bar — host a guided flight right on the couch.", c: "#9c5bb0", c2: "#6d3a80" },
];

const FEATURES = [
  { Icon: BookIcon, title: "Learn about Wine", body: "Grape varieties, regions, tasting technique — no snobbery required.", c: "#5c7a5a", c2: "#3a5438" },
  { Icon: UsersIcon, title: "Host live tastings", body: "Everyone joins by QR on their phones, rates each pour together, and scores reveal at once.", c: "#722F37", c2: "#4a1c22" },
  { Icon: GlassIcon, title: "Score & quiz", body: "Rate appearance, nose, palate, and finish — then a quick quiz crowns the night's sommelier.", c: "#5E8C7D", c2: "#3c6457" },
  { Icon: CameraIcon, title: "Scan any bottle", body: "Snap a label to pull up its full profile and drop it straight into your flight.", c: "#9AA7B2", c2: "#6b7a85" },
];

export default function Landing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/home";
  const done = () => nav(next, { replace: true });

  useEffect(() => {
    if (user) nav(next, { replace: true });
  }, [user, nav, next]);

  return (
    <div className="landing">
      <motion.header
        className="land-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="land-hero-photo">
          <img
            src={HERO_IMG}
            alt="Terraced vineyards at golden hour in Lavaux, Switzerland"
            loading="eager"
            referrerPolicy="no-referrer"
            onError={(e) => (e.currentTarget.closest(".land-hero-photo") as HTMLElement)?.classList.add("noimg")}
          />
        </div>
        <div className="land-hero-overlay">
          <div className="land-mark"><WineMark size={30} /> <span>Wine Roam</span></div>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }}>
            Learn it.<br />Taste it.<br />Host it.
          </motion.h1>
          <p className="land-hero-sub">
            Turn any get-together into a guided wine tasting — pour, score each
            sip together, and crown a winner. No expertise needed.
          </p>
          <a href="#join" className="btn land-hero-cta">Start your free tasting →</a>
        </div>
      </motion.header>

      <section className="land-occasions">
        <div className="section-head land-center">
          <span className="kicker">Bring the table together</span>
          <h2>Made for a group</h2>
        </div>
        <div className="occ-grid">
          {OCCASIONS.map((o, i) => (
            <motion.div
              key={o.title}
              className="occ-tile"
              style={{ background: `linear-gradient(150deg, ${o.c}, ${o.c2})` }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="occ-emoji" aria-hidden>{o.emoji}</span>
              <div className="occ-title">{o.title}</div>
              <div className="occ-body">{o.body}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="land-features">
        <div className="section-head land-center">
          <span className="kicker">How a night runs</span>
          <h2>Everything you need</h2>
        </div>
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            className="land-feature"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
            whileHover={{ y: -3 }}
          >
            <span className="land-ficon" style={{ background: `linear-gradient(150deg, ${f.c}, ${f.c2})` }}>
              <f.Icon size={22} />
            </span>
            <div>
              <div className="land-ftitle">{f.title}</div>
              <div className="land-fbody">{f.body}</div>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="land-about">
        <div className="section-head land-center">
          <span className="kicker">What it is</span>
          <h2>Your wine companion</h2>
        </div>
        <p className="land-sub land-center-text">
          Wine Roam is a guided home for wine exploration. Build a flight,
          pour with friends, and let the app walk the table through appearance, nose,
          palate, and finish — then test what everyone learned with a quiz. Keep
          private notes on every bottle and publish reviews to the community when
          you're ready. An account keeps your cellar, history, and notes in sync
          across devices.
        </p>
      </section>

      <section id="join" className="land-auth">
        {user ? (
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 20 }}>Welcome back{user.name ? `, ${user.name}` : ""}.</div>
            <button className="btn block" style={{ marginTop: 14 }} onClick={done}>Enter the app →</button>
          </div>
        ) : (
          <>
            <div className="section-head" style={{ textAlign: "center" }}>
              <span className="kicker">Log in or sign up</span>
              <h2>Get started</h2>
            </div>
            <AuthForm onDone={done} />
            <p className="muted" style={{ textAlign: "center", fontSize: 13, marginTop: 12 }}>
              Invited to a tasting? Just open the link or scan the QR code your host
              shared — no account needed to taste along.
            </p>
          </>
        )}
      </section>

      <LegalFooter />
    </div>
  );
}
