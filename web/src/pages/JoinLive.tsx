import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import AppBar from "../components/AppBar";
import RatingControl from "../components/RatingControl";
import {
  joinSession,
  getSession,
  submitRatingApi,
  answerQuizApi,
  subscribeSessionAdvanced,
} from "../lib/api";
import { enqueue } from "../lib/offline";
import { buildQuiz } from "../lib/quiz";
import { track } from "../lib/analytics";
import { flightById, loadCustomFlight, bottlesForFlight } from "../data/flights";
import { allowGuestBottles } from "../lib/guestAccess";
import type { Bottle } from "../types";

// Guest view of a live tasting. Joins by code, then follows the host's current
// pour in real time and submits ratings. No account required.
export default function JoinLive() {
  const { code } = useParams();
  const [name, setName] = useState("");
  const [joined, setJoined] = useState<{ sessionId: string; participantId: string } | null>(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("live");
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [score, setScore] = useState(0);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const subRef = useRef<{ unsubscribe?: () => void } | null>(null);

  useEffect(() => () => subRef.current?.unsubscribe?.(), []);

  const join = async () => {
    setErr("");
    try {
      const p = await joinSession(code!, name || "Guest");
      setJoined({ sessionId: p.sessionId, participantId: p.participantId });
      const s = await getSession(p.sessionId);
      if (s) {
        setStep(s.currentStep);
        setStatus(s.status);
        const flight = flightById(s.tastingId) ?? loadCustomFlight();
        const fb = flight ? bottlesForFlight(flight) : [];
        setBottles(fb);
        allowGuestBottles(fb.map((b) => b.id));
      }
      subRef.current = subscribeSessionAdvanced(p.sessionId, (adv) => {
        setStep(adv.currentStep);
        setStatus(adv.status);
        setScore(0);
        setSent(false);
      });
    } catch (e) {
      setErr((e as Error).message || "Couldn't join — check the code.");
    }
  };

  if (!joined) {
    return (
      <>
        <AppBar title="Join tasting" />
        <main className="screen">
          <div className="page-title">
            <span className="kicker">Code {code}</span>
            <h1>Join the Tasting</h1>
            <p>Pop in a name and you'll follow along with the table.</p>
          </div>
          <div className="card stack">
            <input className="field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            {err && <div style={{ color: "#b23b2c", fontSize: 13.5 }}>{err}</div>}
            <button className="btn block" onClick={join}>Join →</button>
          </div>
        </main>
      </>
    );
  }

  if (status === "quiz") return <LiveQuiz session={joined} bottles={bottles} />;

  const bottle = bottles[step];
  const rate = async (v: number) => {
    setScore(v);
    if (!bottle) return;
    const input = { sessionId: joined.sessionId, participantId: joined.participantId, bottleId: bottle.id, overall: v };
    try {
      await submitRatingApi(input);
    } catch {
      // Offline / failed — queue it; flushes automatically on reconnect.
      enqueue("rating", input);
    }
    setSent(true);
  };

  return (
    <>
      <AppBar title="Live tasting" />
      <main className="screen">
        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
          Pour {step + 1}{bottles.length ? ` of ${bottles.length}` : ""} · following the host
        </div>
        {bottle ? (
          <>
            <div className="hero" style={{ background: `linear-gradient(150deg, ${bottle.accent}, ${bottle.accent})`, marginTop: 12 }}>
              <span className="pill" style={{ background: "rgba(255,255,255,.22)" }}><span className="dot" />{bottle.wineType}</span>
              <div className="brand">{bottle.name}</div>
              <div className="nom">{bottle.producer} · {bottle.abv}% · {bottle.region}</div>
            </div>
            <div className="section-head"><span className="kicker">Your score</span><h2>Rate this pour</h2></div>
            <div className="card">
              <RatingControl label="Overall" value={score} max={10} accent={bottle.accent} onChange={rate} />
              {sent && <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>✓ Sent to the table</div>}
            </div>
          </>
        ) : (
          <div className="stub">
            <div className="icn">🥃</div>
            <h3>Waiting for the host</h3>
            <p>The next pour will appear here automatically.</p>
          </div>
        )}
      </main>
    </>
  );
}

// Live quiz phase — host has flipped the session to status "quiz". Each guest
// runs the same deterministic quiz locally and posts answers to the leaderboard.
function LiveQuiz({
  session,
  bottles,
}: {
  session: { sessionId: string; participantId: string };
  bottles: Bottle[];
}) {
  const quiz = useRef(buildQuiz(bottles)).current;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(quiz.length === 0);
  const shownAt = useRef<number>(Date.now());

  useEffect(() => {
    shownAt.current = Date.now();
  }, [i]);

  if (quiz.length === 0) {
    return (
      <>
        <AppBar title="Quiz" />
        <main className="screen">
          <div className="stub">
            <div className="icn">🧠</div>
            <h3>No quiz for this flight</h3>
            <p>Hang tight — the host will bring you back to the table.</p>
          </div>
        </main>
      </>
    );
  }

  if (done) {
    return (
      <>
        <AppBar title="Quiz" />
        <main className="screen">
          <div className="stub">
            <div className="icn">🏁</div>
            <h3>Answers in!</h3>
            <p>You scored {score} of {quiz.length}. The host is showing the live leaderboard.</p>
          </div>
        </main>
      </>
    );
  }

  const q = quiz[i];
  const answer = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const right = idx === q.correctIndex;
    if (right) setScore((s) => s + 1);
    track("quiz_answer");
    const ms = Date.now() - shownAt.current;
    answerQuizApi({
      sessionId: session.sessionId,
      participantId: session.participantId,
      questionId: q.id,
      choiceIndex: idx,
      correct: right,
      ms,
    }).catch(() => {
      // Best-effort — a dropped answer just doesn't score on the board.
    });
  };
  const next = () => {
    if (i + 1 >= quiz.length) setDone(true);
    else {
      setI(i + 1);
      setPicked(null);
    }
  };

  return (
    <>
      <AppBar title="Live quiz" />
      <main className="screen">
        <div className="progress" style={{ marginTop: 6 }}>
          {quiz.map((_, n) => (
            <span key={n} className={`pdot${n === i ? " cur" : ""}${n < i ? " done" : ""}`} />
          ))}
        </div>
        <div className="page-title" style={{ marginTop: 14 }}>
          <span className="kicker">Question {i + 1} of {quiz.length}</span>
          <h1 style={{ fontSize: 24 }}>{q.text}</h1>
        </div>
        <div className="list" style={{ marginTop: 18 }}>
          {q.options.map((opt, idx) => {
            const state =
              picked === null
                ? ""
                : idx === q.correctIndex
                ? " right"
                : idx === picked
                ? " wrong"
                : " dim";
            return (
              <button key={idx} className={`opt tap${state}`} disabled={picked !== null} onClick={() => answer(idx)}>
                <span className="opt-key">{String.fromCharCode(65 + idx)}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <>
            <div className="card" style={{ marginTop: 16 }}>
              <p className="lead" style={{ margin: 0 }}>
                {picked === q.correctIndex ? "✅ Correct. " : "❌ Not quite. "}
                {q.explanation}
              </p>
            </div>
            <button className="btn block" style={{ marginTop: 14 }} onClick={next}>
              {i + 1 >= quiz.length ? "Finish →" : "Next question →"}
            </button>
          </>
        )}
      </main>
    </>
  );
}
