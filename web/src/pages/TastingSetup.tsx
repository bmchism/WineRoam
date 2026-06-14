import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import AppBar from "../components/AppBar";
import {
  flightById,
  loadCustomFlight,
  bottlesForFlight,
  type Flight,
} from "../data/flights";
import { loadOptions, saveOptions, type SessionOptions } from "../lib/tasting";
import { startSession } from "../lib/api";
import { allowGuestBottles } from "../lib/guestAccess";
import { isApiConfigured } from "../lib/config";

// Host setup: choose how this session runs before pouring. Default is the
// recommended host-paced + social reveal; the host can switch per session.
export default function TastingSetup() {
  const { id } = useParams();
  const nav = useNavigate();
  const flight: Flight | null =
    id === "custom" ? loadCustomFlight() : id ? flightById(id) ?? null : null;
  // Unlock full bottle pages for this flight's bottles (guest tasting access).
  useEffect(() => {
    if (flight) allowGuestBottles(bottlesForFlight(flight).map((b) => b.id));
  }, [flight?.id]);
  if (!flight) return <Navigate to="/tastings" replace />;

  const [opts, setOpts] = useState<SessionOptions>(loadOptions(flight.id));
  const bottles = bottlesForFlight(flight);

  const [hosting, setHosting] = useState(false);

  const begin = () => {
    saveOptions(flight.id, opts);
    nav(`/taste/${flight.id}`);
  };

  const hostLive = async () => {
    saveOptions(flight.id, opts);
    setHosting(true);
    try {
      const s = await startSession(flight.id, opts.pacing, opts.visibility);
      nav(`/host/${s.sessionId}`);
    } catch {
      setHosting(false);
      // Fall back to solo runner if the live backend isn't reachable.
      nav(`/taste/${flight.id}`);
    }
  };

  return (
    <>
      <AppBar title="Host setup" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">{flight.title}</span>
          <h1>Set the Room</h1>
          <p>{bottles.length} pours. Choose how this tasting runs — you can change it any time.</p>
        </div>

        <Choice
          label="Pacing"
          help="Host-paced keeps everyone on the same pour."
          value={opts.pacing}
          options={[
            { v: "host", t: "Host-paced", d: "You advance the room" },
            { v: "self", t: "Self-paced", d: "Guests move freely" },
          ]}
          onPick={(v) => setOpts((o) => ({ ...o, pacing: v as SessionOptions["pacing"] }))}
        />

        <Choice
          label="Ratings"
          help="Social reveals the table's scores together after each pour."
          value={opts.visibility}
          options={[
            { v: "social", t: "Social reveal", d: "Show the table" },
            { v: "private", t: "Private", d: "Keep scores to each guest" },
          ]}
          onPick={(v) => setOpts((o) => ({ ...o, visibility: v as SessionOptions["visibility"] }))}
        />

        <div className="card" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>End with a quiz</div>
            <div className="muted" style={{ fontSize: 13 }}>Auto-built from these bottles</div>
          </div>
          <button
            className={`toggle${opts.quiz ? " on" : ""}`}
            onClick={() => setOpts((o) => ({ ...o, quiz: !o.quiz }))}
            aria-pressed={opts.quiz}
          >
            <span className="knob" />
          </button>
        </div>

        <button className="btn block" style={{ marginTop: 18 }} onClick={begin}>
          Begin solo tasting →
        </button>
        {isApiConfigured && flight.curated && (
          <button className="btn ghost block" style={{ marginTop: 10 }} disabled={hosting} onClick={hostLive}>
            {hosting ? "Starting…" : "Host live (multi-device) →"}
          </button>
        )}
      </main>
    </>
  );
}

function Choice({
  label,
  help,
  value,
  options,
  onPick,
}: {
  label: string;
  help: string;
  value: string;
  options: { v: string; t: string; d: string }[];
  onPick: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <div className="label">{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {options.map((o) => (
          <button
            key={o.v}
            className={`pick tap${value === o.v ? " on" : ""}`}
            onClick={() => onPick(o.v)}
          >
            <div className="pick-t">{o.t}</div>
            <div className="pick-d">{o.d}</div>
          </button>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{help}</div>
    </div>
  );
}
