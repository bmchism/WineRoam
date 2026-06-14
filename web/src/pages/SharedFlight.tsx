import { useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppBar from "../components/AppBar";
import { useBottlesReady, getBottleSync } from "../lib/bottleStore";
import { saveCustomFlight } from "../data/flights";
import { allowGuestBottles } from "../lib/guestAccess";


// Read-only public view of a flight shared by link. The flight is encoded in the
// URL (?d=base64), so no backend or auth is needed — anyone can open it.
interface SharedData { t: string; s?: string; b: string[] }

export function encodeFlight(title: string, subtitle: string, bottleIds: string[]): string {
  return btoa(encodeURIComponent(JSON.stringify({ t: title, s: subtitle, b: bottleIds })));
}
function decodeFlight(d: string | null): SharedData | null {
  if (!d) return null;
  try {
    const obj = JSON.parse(decodeURIComponent(atob(d)));
    if (obj && typeof obj.t === "string" && Array.isArray(obj.b)) return obj;
  } catch { /* ignore */ }
  return null;
}

export default function SharedFlight() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const ready = useBottlesReady();
  const data = useMemo(() => decodeFlight(params.get("d")), [params]);

  // Unlock full bottle pages for the shared flight's bottles (guest access).
  useEffect(() => {
    if (data?.b?.length) allowGuestBottles(data.b);
  }, [data]);

  if (!data) {
    return (
      <>
        <AppBar title="Shared flight" back />
        <main className="screen">
          <div className="stub"><div className="icn">🔗</div><h3>That link looks broken</h3>
            <Link to="/tastings" className="btn block" style={{ marginTop: 16, textAlign: "center" }}>Browse flights</Link>
          </div>
        </main>
      </>
    );
  }

  const bottles = data.b.map((id) => getBottleSync(id)).filter(Boolean) as NonNullable<ReturnType<typeof getBottleSync>>[];
  const start = () => {
    saveCustomFlight({ id: "custom", title: data.t, subtitle: data.s ?? "Shared with you", bottleIds: data.b, curated: false });
    nav("/taste/custom/setup");
  };

  return (
    <>
      <AppBar title="Shared flight" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">Shared with you</span>
          <h1>{data.t}</h1>
          {data.s && <p>{data.s}</p>}
        </div>
        <div className="card stack">
          {ready && bottles.length === 0 && <div className="muted">Couldn't resolve these bottles.</div>}
          {bottles.map((b, i) => (
            <motion.div key={`${b.id}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="pn" style={{ background: b.accent }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pnm">{b.name}</div>
                <div className="psub">{b.wineType}{b.vintage ? ` ${b.vintage}` : ""} · {b.region} · {b.abv}%</div>
              </div>
            </motion.div>
          ))}
        </div>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn block" disabled={bottles.length === 0} onClick={start}>Start this tasting →</button>
          <Link to="/home" className="btn ghost block" style={{ textAlign: "center" }}>Explore Wine Roam</Link>
        </div>
      </main>
    </>
  );
}
