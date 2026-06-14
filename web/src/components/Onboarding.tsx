import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// First-run 3-step intro. Shown once (localStorage flag); never blocks return
// visits. Purely client-side.
const KEY = "wine.onboarded.v1";

const STEPS = [
  { emoji: "🍇", title: "Explore world wines", body: "Browse wines by type, region, and producer. We highlight organic, biodynamic, and natural wines — look for the green badge." },
  { emoji: "📷", title: "Scan any bottle", body: "Point your camera at a label to identify it instantly and pull its full profile — region, grapes, and tasting notes, cached for next time." },
  { emoji: "🥂", title: "Build & host a tasting", body: "Assemble a flight, run a guided tasting solo, or host friends live with a QR code, shared ratings, and a quiz. Keep notes as you go." },
];

export default function Onboarding() {
  const [done, setDone] = useState(() => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return true; }
  });
  const [i, setI] = useState(0);
  if (done) return null;

  const finish = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setDone(true);
  };
  const last = i === STEPS.length - 1;
  const s = STEPS[i];

  return (
    <div className="onb-overlay" role="dialog" aria-modal="true" aria-label="Welcome">
      <motion.div className="onb-card" initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <button className="onb-skip" onClick={finish}>Skip</button>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
            <div className="onb-emoji">{s.emoji}</div>
            <h2 className="onb-title">{s.title}</h2>
            <p className="onb-body">{s.body}</p>
          </motion.div>
        </AnimatePresence>
        <div className="onb-dots">
          {STEPS.map((_, n) => <span key={n} className={`onb-dot${n === i ? " on" : ""}`} />)}
        </div>
        <button className="btn block" onClick={() => (last ? finish() : setI(i + 1))}>
          {last ? "Start exploring →" : "Next"}
        </button>
      </motion.div>
    </div>
  );
}
