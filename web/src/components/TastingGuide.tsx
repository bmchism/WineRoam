import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppBar from "./AppBar";
import { articleBySlug, wineTypeGuides } from "../data/learn";

// Rich, interactive version of the "How to Taste Wine" article. Text comes
// from learn.ts (single source); this adds visuals + interactivity on top.

const STEP_ICONS = ["🥃", "🍸", "👁️", "👃", "👅"]; // pour, glass, look, smell, taste
const STEP_TINTS = ["#7FA15A", "#C9A24B", "#9AA7B2", "#C28A3D", "#B5654D"];

import { FLAVOR_GROUPS as FLAVORS } from "./FlavorWheel";

const GLASSES = [
  { emoji: "🥃", name: "Copita / Glencairn", verdict: "best", note: "Narrow rim funnels aroma straight to your nose." },
  { emoji: "🍷", name: "Tulip wine glass", verdict: "ok", note: "Works in a pinch — concentrates aroma reasonably well." },
  { emoji: "🧪", name: "Caballito (shot)", verdict: "avoid", note: "Built for shots, not tasting. Skip it." },
];
const V_COLOR: Record<string, string> = { best: "var(--agave-deep)", ok: "var(--amber)", avoid: "#a3392f" };
const V_BG: Record<string, string> = { best: "#e9f0e4", ok: "#fdeede", avoid: "#fcefec" };
const V_LABEL: Record<string, string> = { best: "Best", ok: "OK", avoid: "Avoid" };

function Photo({ file, alt }: { file: string; alt: string }) {
  return (
    <img
      src={`https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=900`}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => { (e.currentTarget.closest(".tg-photo") as HTMLElement)?.classList.add("noimg"); }}
    />
  );
}

export default function TastingGuide() {
  const a = articleBySlug("how-to-taste-wine")!;
  const steps = a.sections.slice(0, 5); // Pour, Glass, Look, Smell, Taste
  const profiles = a.sections.find((s) => s.heading.startsWith("Flavor"));
  const additives = a.sections.find((s) => s.heading.startsWith("Spotting"));
  const notesSection = a.sections.find((s) => s.heading.startsWith("Score"));

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (n: string) =>
    setPicked((p) => { const x = new Set(p); x.has(n) ? x.delete(n) : x.add(n); return x; });

  return (
    <>
      <AppBar title="Learn" back />
      <main className="screen tg">
        {/* Hero */}
        <div className="tg-hero">
          <div className="tg-photo">
            <Photo file="Vignoble_de_Lavaux_en_automne.jpg" alt="Vineyard landscape" />
          </div>
          <div className="tg-hero-text">
            <span className="kicker">Do a tasting</span>
            <h1>{a.title}</h1>
            <p>{a.subtitle}</p>
          </div>
        </div>

        {/* The ritual — illustrated steps */}
        <div className="section-head"><span className="kicker">Five steps</span><h2>The Ritual</h2></div>
        <div className="tg-steps">
          {steps.map((s, i) => (
            <motion.div
              key={s.heading}
              className="tg-step"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="tg-step-badge" style={{ background: STEP_TINTS[i] }}>
                <span className="tg-step-emoji">{STEP_ICONS[i]}</span>
                <span className="tg-step-n">{i + 1}</span>
              </div>
              <div>
                <h3>{s.heading}</h3>
                <p>{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Color -> aging interactive strip */}
        <div className="section-head"><span className="kicker">What the color tells you</span><h2>Read the Pour</h2></div>
        <div className="tg-colorstrip">
          {wineTypeGuides.map((g) => (
            <div className="tg-swatch" key={g.wineType} style={{ ["--sw" as string]: g.accent }}>
              <span className="tg-swatch-chip" style={{ background: g.accent }} />
              <span className="tg-swatch-name">{g.wineType}</span>
              <div className="tg-swatch-pop">
                <strong>{g.wineType}</strong>
                <span>{g.description}</span>
                <em>{g.profile}</em>
              </div>
            </div>
          ))}
        </div>
        <p className="muted tg-note">Tip: additive‑free añejos are often paler than mass brands that add caramel colour — don't judge richness by colour alone.</p>

        {/* Glassware comparison */}
        <div className="section-head"><span className="kicker">Gear</span><h2>The Right Glass</h2></div>
        <div className="tg-glasses">
          {GLASSES.map((g) => (
            <div className={`tg-glass tg-glass-${g.verdict}`} key={g.name}>
              <span className="tg-glass-emoji">{g.emoji}</span>
              <span className="tg-glass-name">{g.name}</span>
              <span className="tg-glass-badge" style={{ background: V_BG[g.verdict], color: V_COLOR[g.verdict] }}>{V_LABEL[g.verdict]}</span>
              <span className="tg-glass-note">{g.note}</span>
            </div>
          ))}
        </div>

        {/* Interactive flavor wheel */}
        <div className="section-head"><span className="kicker">Train your palate</span><h2>Flavors to Hunt</h2></div>
        <p className="muted tg-note">{profiles?.body}</p>
        <div className="tg-flavors">
          {FLAVORS.map((grp) => (
            <div className="tg-fgroup" key={grp.label}>
              <div className="tg-fgroup-label" style={{ color: grp.color }}>{grp.label}</div>
              <div className="tg-chips">
                {grp.notes.map((n) => {
                  const on = picked.has(n);
                  return (
                    <button
                      key={n}
                      className={`tg-chip${on ? " on" : ""}`}
                      style={on ? { background: grp.color, borderColor: grp.color, color: "#fff" } : { ["--c" as string]: grp.color }}
                      onClick={() => toggle(n)}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {picked.size > 0 && (
          <motion.div className="tg-picked" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            You flagged <strong>{picked.size}</strong> note{picked.size > 1 ? "s" : ""} — that's your tasting profile starting to form. 🌿
          </motion.div>
        )}

        {/* Additives warning */}
        {additives && (
          <div className="tg-warn">
            <div className="tg-warn-head">⚠ {additives.heading}</div>
            <p>{additives.body}</p>
          </div>
        )}

        {/* CTA */}
        <Link to="/tastings" className="journey-cta tap" style={{ marginTop: 18 }}>
          <div className="journey-scene" style={{ display: "grid", placeItems: "center", fontSize: 44 }}>🥂</div>
          <div className="journey-body">
            <div className="journey-title">Put it into practice</div>
            <p>{notesSection?.body ?? "Run a guided flight and save your notes automatically."}</p>
            <span className="journey-go">Start a tasting →</span>
          </div>
        </Link>
      </main>
    </>
  );
}
