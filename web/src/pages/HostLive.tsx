import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppBar from "../components/AppBar";
import CountUp from "../components/CountUp";
import Qr from "../components/Qr";
import { getSession, advanceSession, subscribeRating, sendInvite, leaderboardApi, type LeaderboardRow } from "../lib/api";
import { flightById, loadCustomFlight, bottlesForFlight } from "../data/flights";
import { hostScript, ritualSteps } from "../lib/talkTrack";
import { track } from "../lib/analytics";
import type { TastingSession, Rating, Bottle } from "../types";

// Host console for a live session: shows the join QR/code and drives the room.
export default function HostLive() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<TastingSession | null>(null);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [err, setErr] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [showScript, setShowScript] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    getSession(sessionId)
      .then((s) => {
        if (!s) return setErr(true);
        setSession(s);
        track("live_hosted");
        const flight = flightById(s.tastingId) ?? loadCustomFlight();
        setBottles(flight ? bottlesForFlight(flight) : []);
      })
      .catch(() => setErr(true));
    const sub = subscribeRating(sessionId, (r) => setRatings((prev) => [...prev, r]));
    return () => sub?.unsubscribe?.();
  }, [sessionId]);

  // While the quiz is live, poll the shared leaderboard so the host screen
  // reflects guests' answers as they come in.
  useEffect(() => {
    if (!sessionId || session?.status !== "quiz") return;
    let alive = true;
    const tick = () =>
      leaderboardApi(sessionId)
        .then((rows) => alive && setBoard(rows))
        .catch(() => {});
    tick();
    const t = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [sessionId, session?.status]);

  if (err) return <Navigate to="/tastings" replace />;
  if (!session) {
    return (
      <>
        <AppBar title="Host" back />
        <main className="screen"><div className="muted" style={{ padding: "40px 4px" }}>Starting session…</div></main>
      </>
    );
  }

  const joinUrl = `${window.location.origin}/join/${session.joinCode}`;
  const bottle = bottles[session.currentStep];
  const cur = ratings.filter((r) => bottle && r.bottleId === bottle.id && r.overall);
  const avg = cur.length ? Math.round((cur.reduce((s, r) => s + (r.overall || 0), 0) / cur.length) * 10) / 10 : 0;

  const next = async () => {
    const s = await advanceSession(session.sessionId, session.currentStep + 1, "live");
    setSession(s);
  };

  const startQuiz = async () => {
    const s = await advanceSession(session.sessionId, session.currentStep, "quiz");
    setSession(s);
  };
  const backToTasting = async () => {
    const s = await advanceSession(session.sessionId, session.currentStep, "live");
    setSession(s);
  };

  const quizMode = session.status === "quiz";

  const copy = () => navigator.clipboard?.writeText(joinUrl);

  const invite = async () => {
    if (!email && !phone) return;
    setSending(true);
    setInviteMsg("");
    try {
      const ok = await sendInvite(session.joinCode, { email, phone });
      setInviteMsg(ok ? "Invite sent ✓" : "Couldn't send — check the address/number or provider setup.");
      if (ok) { setEmail(""); setPhone(""); }
    } catch {
      setInviteMsg("Couldn't send right now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AppBar title="Hosting" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">Live · code {session.joinCode}</span>
          <h1>Scan to Join</h1>
          <p>Guests scan or open the link — no account needed.</p>
        </div>

        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ display: "grid", placeItems: "center", padding: "8px 0" }}>
            <Qr value={joinUrl} />
          </div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 26, letterSpacing: 4, marginTop: 8 }}>{session.joinCode}</div>
          <button className="btn ghost block" style={{ marginTop: 12 }} onClick={copy}>Copy join link</button>
        </div>

        <div className="card stack" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>Invite directly</div>
          <input className="field" type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field" type="tel" placeholder="Phone, e.g. +15551234567 (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="btn block" disabled={sending || (!email && !phone)} onClick={invite}>
            {sending ? "Sending…" : "Send invite"}
          </button>
          {inviteMsg && <div className="muted" style={{ fontSize: 13 }}>{inviteMsg}</div>}
        </div>

        {quizMode ? (
          <>
            <div className="section-head">
              <span className="kicker">Live quiz</span>
              <h2>Leaderboard</h2>
            </div>
            {board.length === 0 ? (
              <div className="card"><div className="muted" style={{ fontSize: 14 }}>Waiting for the first answers…</div></div>
            ) : (
              <div className="card stack">
                {board.map((row, n) => (
                  <motion.div
                    key={row.participantId}
                    layout
                    className="bar-row"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(n, 8) * 0.04 }}
                  >
                    <span className="bar-name">{n + 1}. {row.displayName}</span>
                    <span className="bar-track">
                      <span className="bar-fill" style={{ width: `${row.total ? (row.correct / row.total) * 100 : 0}%`, background: "var(--amber)" }} />
                    </span>
                    <span className="bar-score"><CountUp value={row.correct} duration={0.5} />/{row.total}</span>
                  </motion.div>
                ))}
              </div>
            )}
            <button className="btn ghost block" style={{ marginTop: 16 }} onClick={backToTasting}>
              ← Back to tasting
            </button>
          </>
        ) : (
          <>
            <div className="section-head">
              <span className="kicker">Pour {session.currentStep + 1} of {bottles.length}</span>
              <h2>{bottle ? bottle.name : "—"}</h2>
            </div>
            {bottle && (
              <div className="card">
                <div className="muted" style={{ fontSize: 14 }}>{bottle.wineType} · {bottle.producer} · {bottle.abv}%</div>
                <div className="bar-row" style={{ marginTop: 12 }}>
                  <span className="bar-name">Table</span>
                  <span className="bar-track"><span className="bar-fill" style={{ width: `${avg * 10}%`, background: bottle.accent }} /></span>
                  <span className="bar-score">{avg || "—"}</span>
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{cur.length} rating{cur.length === 1 ? "" : "s"} in</div>
              </div>
            )}

            {bottle && (
              <>
                <div className="section-head" style={{ marginBottom: 4 }}>
                  <span className="kicker">For the host</span>
                  <h2 style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Talk Track</span>
                    <button className="chip" style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13 }} onClick={() => setShowScript((s) => !s)}>
                      {showScript ? "Hide" : "Show"}
                    </button>
                  </h2>
                </div>
                {showScript && (
                  <>
                    <div className="card stack">
                      {hostScript(bottle, session.currentStep + 1, bottles.length).map((line, n) => (
                        <p key={n} className="lead" style={{ margin: 0, fontSize: 15 }}>{line}</p>
                      ))}
                    </div>
                    <div className="stack" style={{ marginTop: 10 }}>
                      {ritualSteps(bottle).map((step) => (
                        <div key={step.key} className="card" style={{ padding: 14 }}>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{step.emoji} {step.title}</div>
                          <p className="muted" style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.45 }}>{step.say}</p>
                          {step.hunt && step.hunt.length > 0 && (
                            <div className="tags" style={{ marginTop: 8 }}>
                              {step.hunt.map((h) => (
                                <span key={h} className="tag">{h}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            <button className="btn block" style={{ marginTop: 16 }} disabled={session.currentStep + 1 >= bottles.length} onClick={next}>
              {session.currentStep + 1 >= bottles.length ? "Last pour" : "Next pour →"}
            </button>
            <button className="btn ghost block" style={{ marginTop: 10 }} disabled={bottles.length < 2} onClick={startQuiz}>
              🧠 Start live quiz
            </button>
          </>
        )}
      </main>
    </>
  );
}
