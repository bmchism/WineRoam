import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppBar from "../components/AppBar";
import ProcessScene from "../components/ProcessScene";
import { stages } from "../data/process";

const variants = {
  enter: (d: number) => ({ opacity: 0, x: d >= 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d >= 0 ? -60 : 60 }),
};

// Interactive "How It's Made" — swipe or tap through the 9 stages from field to
// glass, each with an animated original illustration.
export default function Process() {
  const [[idx, dir], setState] = useState<[number, number]>([0, 0]);
  const stage = stages[idx];

  const go = (d: number) => {
    const next = idx + d;
    if (next < 0 || next >= stages.length) return;
    setState([next, d]);
  };

  return (
    <>
      <AppBar title="How It's Made" back />
      <main className="screen process">
        <div className="proc-progress">
          <div className="proc-bar"><span style={{ width: `${((idx + 1) / stages.length) * 100}%`, background: stage.accent }} /></div>
          <div className="proc-count">{stage.n} / {stages.length}</div>
        </div>

        <div className="proc-stage">
          <AnimatePresence custom={dir} mode="wait">
            <motion.div
              key={stage.id}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(1);
                else if (info.offset.x > 60) go(-1);
              }}
            >
              <div
                className="proc-scene-wrap"
                style={{ background: `radial-gradient(120% 90% at 50% 8%, ${tint(stage.accent)}, var(--surface) 75%)` }}
                onClick={() => go(1)}
              >
                <ProcessScene id={stage.id} accent={stage.accent} />
                <span className="proc-stepnum" style={{ background: stage.accent }}>{stage.n}</span>
              </div>

              {stage.photo && (
                <figure className="proc-photo">
                  <img
                    src={stage.photo}
                    alt={stage.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget.closest("figure") as HTMLElement).style.display = "none"; }}
                  />
                  {stage.credit && <figcaption>{stage.credit}</figcaption>}
                </figure>
              )}

              <span className="kicker" style={{ marginTop: 18, display: "block", color: stage.accent }}>{stage.tagline}</span>
              <h1 className="proc-title">{stage.title}</h1>
              <p className="proc-body">{stage.body}</p>

              <div className="tags" style={{ marginTop: 14 }}>
                {stage.facts.map((f) => (
                  <span key={f} className="tag">{f}</span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="proc-dots">
          {stages.map((s, i) => (
            <button
              key={s.id}
              className={`pdot${i === idx ? " cur" : ""}${i < idx ? " done" : ""}`}
              style={i === idx ? { background: stage.accent } : undefined}
              onClick={() => setState([i, i > idx ? 1 : -1])}
              aria-label={s.title}
            />
          ))}
        </div>

        <div className="proc-nav">
          <button className="btn ghost" style={{ marginLeft: 0, flex: 1 }} disabled={idx === 0} onClick={() => go(-1)}>← Back</button>
          <button className="btn" style={{ flex: 1, background: stage.accent }} disabled={idx === stages.length - 1} onClick={() => go(1)}>
            {idx === stages.length - 1 ? "Done" : "Next →"}
          </button>
        </div>
      </main>
    </>
  );
}

// Soft tint of the accent for the scene backdrop.
function tint(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * 0.78);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}
