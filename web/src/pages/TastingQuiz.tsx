import { useMemo, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppBar from "../components/AppBar";
import CountUp from "../components/CountUp";
import {
  flightById,
  loadCustomFlight,
  bottlesForFlight,
  type Flight,
} from "../data/flights";
import { buildQuiz } from "../lib/quiz";

export default function TastingQuiz() {
  const { id } = useParams();
  const nav = useNavigate();
  const flight: Flight | null =
    id === "custom" ? loadCustomFlight() : id ? flightById(id) ?? null : null;
  if (!flight) return <Navigate to="/tastings" replace />;

  const bottles = bottlesForFlight(flight);
  const quiz = useMemo(() => buildQuiz(bottles), [flight.id]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(quiz.length === 0);

  if (quiz.length === 0) {
    return (
      <>
        <AppBar title="Quiz" back />
        <main className="screen">
          <div className="stub">
            <div className="icn">🧠</div>
            <h3>Add a couple more pours</h3>
            <p>The quiz needs at least two bottles to generate questions.</p>
            <button className="btn block" style={{ marginTop: 18 }} onClick={() => nav(`/flight/${flight.id}`)}>
              Back to flight
            </button>
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
    if (navigator.vibrate) navigator.vibrate(right ? 30 : [18, 40, 18]);
  };
  const next = () => {
    if (i + 1 >= quiz.length) setDone(true);
    else {
      setI(i + 1);
      setPicked(null);
    }
  };

  if (done) return <Leaderboard flight={flight} score={score} total={quiz.length} onReplay={() => nav(`/taste/${flight.id}/recap`)} />;

  return (
    <>
      <AppBar title="Quiz" back />
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
                ? " right pop-in"
                : idx === picked
                ? " wrong shake"
                : " dim";
            return (
              <button key={idx} className={`opt tap${state}`} onClick={() => answer(idx)}>
                <span className="opt-key">{String.fromCharCode(65 + idx)}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card" style={{ marginTop: 16 }}>
              <p className="lead" style={{ margin: 0 }}>
                {picked === q.correctIndex ? "✅ Correct. " : "❌ Not quite. "}
                {q.explanation}
              </p>
            </div>
            <button className="btn block" style={{ marginTop: 14 }} onClick={next}>
              {i + 1 >= quiz.length ? "See leaderboard →" : "Next question →"}
            </button>
          </motion.div>
        )}
      </main>
    </>
  );
}

function Leaderboard({
  flight,
  score,
  total,
  onReplay,
}: {
  flight: Flight;
  score: number;
  total: number;
  onReplay: () => void;
}) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  return (
    <>
      <AppBar title="Results" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">{flight.title}</span>
          <h1>Your Score</h1>
          <p>You got {score} of {total} right.</p>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 44, fontWeight: 600 }}><CountUp value={score} />/{total}</div>
          <span className="bar-track" style={{ marginTop: 14, display: "block" }}>
            <motion.span className="bar-fill" style={{ background: "var(--amber)" }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }} />
          </span>
          <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
            {pct === 100 ? "Perfect — you know your wine. 🍷" : pct >= 60 ? "Nicely done." : "A reason for another round."}
          </div>
        </div>
        <button className="btn block" style={{ marginTop: 18 }} onClick={onReplay}>
          See your recap →
        </button>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 10, textAlign: "center" }}>
          Hosting live? Everyone's scores rank on a shared leaderboard.
        </div>
      </main>
    </>
  );
}
