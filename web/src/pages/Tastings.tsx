import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppBar from "../components/AppBar";
import { curatedFlights, bottlesForFlight, loadLibrary, saveToLibrary, type Flight } from "../data/flights";
import { useBottlesReady } from "../lib/bottleStore";
import { listMyFlightsApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ChevronRight } from "../icons";

function FlightCard({ id, title, subtitle, accents, count, tag }: { id: string; title: string; subtitle: string; accents: string[]; count: number; tag: string }) {
  return (
    <Link to={`/flight/${id}`} className="flight-card tap">
      <div className="ft">{title}</div>
      <div className="fs">{subtitle}</div>
      <div className="flight-foot">
        <div className="dotrow">
          {accents.map((a, i) => (
            <span key={i} className="edot" style={{ background: a }} />
          ))}
        </div>
        <span className="badge cached dot">{tag} · {count}</span>
      </div>
    </Link>
  );
}

export default function Tastings() {
  useBottlesReady();
  const { user } = useAuth();
  const [mine, setMine] = useState<Flight[]>(() => loadLibrary());

  // Merge cloud-saved flights (account) with local ones, dedup by id.
  useEffect(() => {
    if (!user) return;
    listMyFlightsApi()
      .then((cloud) => {
        if (!cloud.length) return;
        const local = loadLibrary();
        const byId = new Map<string, Flight>();
        [...cloud, ...local].forEach((f) => byId.set(f.id, f as Flight));
        const merged = [...byId.values()];
        cloud.forEach((f) => saveToLibrary(f as Flight)); // cache locally
        setMine(merged);
      })
      .catch(() => {});
  }, [user]);

  return (
    <>
      <AppBar />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">Host & Join</span>
          <h1>Live Tastings</h1>
          <p>Build a flight — any bottles, any number — or start from a curated set. Guests follow on their phones, rate each pour, then take the quiz.</p>
        </div>

        <Link to="/tastings/build" className="card tap" style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flex: "none", background: "var(--amber)", color: "#fff", display: "grid", placeItems: "center", fontSize: 24, fontWeight: 700 }}>+</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "var(--serif)", margin: 0, fontSize: 18 }}>Build your own flight</h3>
            <p className="muted" style={{ margin: "3px 0 0", fontSize: 14 }}>Pick any bottles, in any order.</p>
          </div>
          <span style={{ color: "var(--muted)", display: "flex" }}><ChevronRight size={20} /></span>
        </Link>

        {mine.length > 0 && (
          <>
            <div className="section-head"><span className="kicker">Saved by you</span><h2>Your Flights</h2></div>
            <div className="list">
              {mine.map((f) => {
                const bs = bottlesForFlight(f);
                return <FlightCard key={f.id} id={f.id} title={f.title} subtitle={f.subtitle} accents={bs.map((b) => b.accent)} count={bs.length} tag="Saved" />;
              })}
            </div>
          </>
        )}

        <div className="section-head"><span className="kicker">Ready to pour</span><h2>Curated Flights</h2></div>
        <div className="list">
          {curatedFlights.map((f, i) => {
            const bs = bottlesForFlight(f);
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04, duration: 0.3 }}>
                <FlightCard id={f.id} title={f.title} subtitle={f.subtitle} accents={bs.map((b) => b.accent)} count={bs.length} tag="Curated" />
              </motion.div>
            );
          })}
        </div>
      </main>
    </>
  );
}
