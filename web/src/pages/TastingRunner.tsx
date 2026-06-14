import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppBar from "../components/AppBar";
import RatingControl from "../components/RatingControl";
import { flightById, loadCustomFlight, bottlesForFlight, type Flight } from "../data/flights";
import { loadRatings, saveRating, emptyRating, loadOptions, type PourRating } from "../lib/tasting";
import { hostScript, ritualSteps } from "../lib/talkTrack";
import { track } from "../lib/analytics";
import { allowGuestBottles } from "../lib/guestAccess";


type Phase = "guide" | "rate" | "reveal";

export default function TastingRunner() {
  const { id } = useParams();
  const nav = useNavigate();
  const flight: Flight | null = id === "custom" ? loadCustomFlight() : id ? flightById(id) ?? null : null;

  useEffect(() => {
    if (flight) {
      track("tasting_started");
      // Unlock full bottle pages for this flight's bottles (guest tasting access).
      allowGuestBottles(bottlesForFlight(flight).map((b) => b.id));
    }
  }, [flight?.id]);

  if (!flight) return <Navigate to="/tastings" replace />;

  const bottles = bottlesForFlight(flight);
  const options = loadOptions(flight.id);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("guide");
  const [ritual, setRitual] = useState(0);
  const [scriptOpen, setScriptOpen] = useState(true);
  const bottle = bottles[step];
  const [r, setR] = useState<PourRating>(loadRatings(flight.id)[bottle.id] || emptyRating(bottle.id));

  const set = (k: keyof PourRating, v: number | string) => setR((prev) => ({ ...prev, [k]: v }));
  const goto = (i: number) => {
    const next = bottles[i];
    setStep(i);
    setPhase("guide");
    setRitual(0);
    setScriptOpen(true);
    setR(loadRatings(flight.id)[next.id] || emptyRating(next.id));
  };
  const lockIn = () => {
    saveRating(flight.id, r);
    setPhase("reveal");
  };

  const isLast = step === bottles.length - 1;
  const steps = ritualSteps(bottle);
  const script = hostScript(bottle, step + 1, bottles.length);
  const rs = steps[ritual];

  return (
    <>
      <AppBar title={flight.title} back />
      <main className="screen" style={{ paddingBottom: 40 }}>
        <div className="progress">
          {bottles.map((b, i) => (
            <span key={b.id} className={`pdot${i === step ? " cur" : ""}${loadRatings(flight.id)[b.id] ? " done" : ""}`}
              style={i === step ? { background: bottle.accent } : undefined} onClick={() => goto(i)} />
          ))}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>Pour {step + 1} of {bottles.length}</div>

        <motion.div key={bottle.id} className="hero" style={{ background: `linear-gradient(150deg, ${bottle.accent}, ${shade(bottle.accent)})` }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <span className="pill" style={{ background: "rgba(255,255,255,.22)" }}><span className="dot" />{bottle.wineType}</span>
          <div className="brand">{bottle.name}</div>
          <div className="nom">{bottle.producer} · {bottle.abv}% · {bottle.region}</div>
        </motion.div>
        <Link to={`/bottle/${bottle.id}`} className="linklike" style={{ display: "block", margin: "10px auto 0", textAlign: "center" }}>
          View bottle details →
        </Link>

        <AnimatePresence mode="wait">
          {phase === "guide" && (
            <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Host talk track */}
              <button className="script-toggle" onClick={() => setScriptOpen((o) => !o)}>
                <span>🎙️ Host script</span><span>{scriptOpen ? "▾" : "▸"}</span>
              </button>
              {scriptOpen && (
                <div className="script-card">
                  {script.map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}

              {/* Interactive ritual */}
              <div className="section-head"><span className="kicker">Guided tasting · {ritual + 1} of {steps.length}</span><h2>{rs.emoji} {rs.title}</h2></div>
              <AnimatePresence mode="wait">
                <motion.div key={rs.key} className="ritual-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                  <div className="ritual-emoji" style={{ background: bottle.accent }}>{rs.emoji}</div>
                  <p className="ritual-say">{rs.say}</p>
                  {rs.hunt && (
                    <div className="tags" style={{ marginTop: 12, justifyContent: "center" }}>
                      {rs.hunt.map((h) => <span key={h} className="tag">{h}</span>)}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="ritual-dots">
                {steps.map((s, i) => <span key={s.key} className={`pdot${i === ritual ? " cur" : ""}${i < ritual ? " done" : ""}`} style={i === ritual ? { background: bottle.accent } : undefined} onClick={() => setRitual(i)} />)}
              </div>

              <div className="proc-nav">
                <button className="btn ghost" style={{ marginLeft: 0, flex: 1 }} disabled={ritual === 0} onClick={() => setRitual(ritual - 1)}>← Back</button>
                {ritual < steps.length - 1 ? (
                  <button className="btn" style={{ flex: 1, background: bottle.accent }} onClick={() => setRitual(ritual + 1)}>Next →</button>
                ) : (
                  <button className="btn" style={{ flex: 1, background: bottle.accent }} onClick={() => setPhase("rate")}>Score it →</button>
                )}
              </div>
              <button className="linklike" style={{ display: "block", margin: "12px auto 0" }} onClick={() => setPhase("rate")}>Skip to scoring</button>
            </motion.div>
          )}

          {phase === "rate" && (
            <motion.div key="rate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="section-head"><span className="kicker">Score this pour</span><h2>Your Rating</h2></div>
              <div className="card stack">
                <RatingControl label="Color" value={r.color} accent={bottle.accent} onChange={(v) => set("color", v)} />
                <RatingControl label="Aroma" value={r.aroma} accent={bottle.accent} onChange={(v) => set("aroma", v)} />
                <RatingControl label="Flavor" value={r.flavor} accent={bottle.accent} onChange={(v) => set("flavor", v)} />
                <RatingControl label="Finish" value={r.finish} accent={bottle.accent} onChange={(v) => set("finish", v)} />
                <RatingControl label="Overall" value={r.overall} max={10} accent={bottle.accent} onChange={(v) => set("overall", v)} />
                <textarea className="field" rows={2} placeholder="Tasting note (optional)…" value={r.note} onChange={(e) => set("note", e.target.value)} />
              </div>
              <button className="btn block" style={{ marginTop: 16, background: bottle.accent }} onClick={lockIn}>Lock it in →</button>
              <button className="linklike" style={{ display: "block", margin: "10px auto 0" }} onClick={() => setPhase("guide")}>← Back to the ritual</button>
            </motion.div>
          )}

          {phase === "reveal" && (
            <motion.div key="reveal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="section-head"><span className="kicker">Locked in</span><h2>Your Pour</h2></div>
              <div className="card stack">
                {([["Color", r.color, 5], ["Aroma", r.aroma, 5], ["Flavor", r.flavor, 5], ["Finish", r.finish, 5], ["Overall", r.overall, 10]] as const).map(([label, val, max]) => (
                  <div key={label} className="bar-row">
                    <span className="bar-name me">{label}</span>
                    <span className="bar-track"><span className="bar-fill" style={{ width: `${(val / max) * 100}%`, background: bottle.accent }} /></span>
                    <span className="bar-score">{val || "—"}{max === 10 ? "/10" : ""}</span>
                  </div>
                ))}
                {r.note && <div className="muted" style={{ fontSize: 13.5 }}>“{r.note}”</div>}
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Hosting live? The table's scores reveal together on everyone's phones.</div>

              {!isLast ? (
                <button className="btn block" style={{ marginTop: 16 }} onClick={() => goto(step + 1)}>Next pour →</button>
              ) : options.quiz ? (
                <button className="btn block" style={{ marginTop: 16 }} onClick={() => nav(`/taste/${flight.id}/quiz`)}>Finish & start the quiz →</button>
              ) : (
                <button className="btn block" style={{ marginTop: 16 }} onClick={() => nav(`/taste/${flight.id}/recap`)}>Finish & see recap →</button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

function shade(hex: string, amt = -28) {
  const n = parseInt(hex.slice(1), 16);
  const c = (x: number) => Math.max(0, Math.min(255, x));
  return `rgb(${c((n >> 16) + amt)},${c(((n >> 8) & 0xff) + amt)},${c((n & 0xff) + amt)})`;
}
