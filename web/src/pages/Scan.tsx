import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppBar from "../components/AppBar";
import { CameraIcon, BottleIcon } from "../icons";
import { scanBottlePhoto, getScanResult, setShelf } from "../lib/api";
import { isApiConfigured } from "../lib/config";
import { track } from "../lib/analytics";
import { useAuth } from "../lib/auth";
import type { Bottle } from "../types";

type Phase = "idle" | "scanning" | "result" | "error";

// Real camera -> S3 -> recognize Step Function -> cached/enriched bottle flow.
// The pipeline is async: we upload the label, kick off recognize, then poll
// getScanResult against the image key until the bottle lands (or we time out).
export default function Scan() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [match, setMatch] = useState<Bottle | null>(null);
  const [fast, setFast] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [shelved, setShelved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhase("idle");
    setMatch(null);
    setErrMsg("");
    if (fileRef.current) fileRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhase("scanning");
    setErrMsg("");
    track("scan");
    try {
      const key = await scanBottlePhoto(file);
      const started = Date.now();
      // Poll up to ~45s. Cache hits resolve almost immediately; a fresh
      // identification runs tiered Claude and takes longer.
      const deadline = started + 45_000;
      const poll = async (): Promise<void> => {
        const b = await getScanResult(key);
        if (b) {
          setMatch(b);
          setFast(Date.now() - started < 4000);
          setPhase("result");
          if (navigator.vibrate) navigator.vibrate(30); // light success haptic
          return;
        }
        if (Date.now() > deadline) {
          setErrMsg("Couldn't identify that label. Try a clearer, straight-on shot of the front label.");
          setPhase("error");
          return;
        }
        setTimeout(poll, 2500);
      };
      await poll();
    } catch {
      setErrMsg("Upload failed. Check your connection and try again.");
      setPhase("error");
    }
  };

  if (!isApiConfigured) {
    return (
      <>
        <AppBar title="Scan a bottle" back />
        <main className="screen">
          <div className="stub">
            <div className="icn">📷</div>
            <h3>Scanning needs the live backend</h3>
            <p>Once the API is configured, snap a label to identify any bottle.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AppBar title="Scan a bottle" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">Point & shoot</span>
          <h1>Scan a Bottle</h1>
          <p>Snap a label or upload a photo to pull its full profile. Seen before? It's served instantly from cache.</p>
        </div>

        {!user ? (
          <div className="card" style={{ textAlign: "center" }}>
            <div className="muted" style={{ fontSize: 14.5 }}>
              Sign in to scan bottles — it keeps the AI identification costs in check.
            </div>
            <Link to="/profile" className="btn block" style={{ marginTop: 12, textAlign: "center" }}>
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
            <input ref={uploadRef} type="file" accept="image/*" hidden onChange={onFile} />

            <div className="viewfinder">
              {phase === "result" && match ? (
                <motion.div className="vf-result scan-reveal" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                  <span className={`badge pop-in ${fast ? "cached" : ""} dot`} style={!fast ? { background: "#fdeede", color: "var(--amber)" } : undefined}>
                    {fast ? "Served from cache" : "Identified by Claude"}
                  </span>
                  {match.imageKeys?.[0] ? (
                    <img src={match.imageKeys?.[0]} alt={match.name} className="bottle-photo" style={{ margin: "14px auto 0", maxHeight: 160 }} />
                  ) : (
                    <div className="vessel" style={{ color: match.accent, margin: "16px auto 0", width: 64, height: 80 }}>
                      <BottleIcon size={36} />
                    </div>
                  )}
                  <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 22, marginTop: 10 }}>{match.name}</div>
                  <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
                    {match.expression} · NOM {match.nom} · {match.abv}%
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="vf-inner"
                  animate={phase === "scanning" ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
                  transition={{ repeat: phase === "scanning" ? Infinity : 0, duration: 1.1 }}
                >
                  <CameraIcon size={54} />
                  <div className="muted" style={{ marginTop: 12, fontSize: 14 }}>
                    {phase === "scanning" ? "Reading the label…" : phase === "error" ? "No match" : "Camera preview"}
                  </div>
                </motion.div>
              )}
            </div>

            {phase === "error" && (
              <div className="muted" style={{ fontSize: 13.5, marginTop: 12, textAlign: "center" }}>{errMsg}</div>
            )}

            {phase === "result" && match ? (
              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                <Link to={`/bottle/${match.id}`} className="btn block" style={{ textAlign: "center" }}>
                  View full profile →
                </Link>
                <button
                  className={`btn ghost block${shelved ? " shelf-added" : ""}`}
                  disabled={shelved}
                  onClick={async () => {
                    try {
                      await setShelf(match.id, "owned");
                      setShelved(true);
                      if (navigator.vibrate) navigator.vibrate(20);
                    } catch { /* ignore */ }
                  }}
                >
                  {shelved ? "🏠 On your shelf ✓" : "🏠 Add to My Shelf"}
                </button>
                <button className="btn ghost block" onClick={() => { setShelved(false); reset(); }}>Scan another</button>
              </div>
            ) : (
              <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  className="btn block"
                  disabled={phase === "scanning"}
                  onClick={() => (phase === "error" ? reset() : fileRef.current?.click())}
                >
                  {phase === "scanning" ? "Scanning…" : phase === "error" ? "Try again" : "📷 Scan label"}
                </button>
                {phase !== "scanning" && (
                  <button className="btn ghost block" onClick={() => uploadRef.current?.click()}>
                    ⬆ Upload a photo
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
