import { useMemo, useState } from "react";
import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppBar from "../components/AppBar";
import { flightById, saveCustomFlight, saveToLibrary, type Flight } from "../data/flights";
import { allBottles, getBottleSync, useBottlesReady } from "../lib/bottleStore";
import { saveMyFlightApi } from "../lib/api";

import { encodeFlight } from "./SharedFlight";
import { useToast } from "../components/Toast";

export default function FlightDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const ready = useBottlesReady();

  const base = id ? flightById(id) : undefined;
  const [ids, setIds] = useState<string[]>(base ? base.bottleIds : []);
  const [edited, setEdited] = useState(false);
  const [picker, setPicker] = useState<{ at: number | "add" } | null>(null);
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState(false);
  const toast = useToast();

  if (!base) return <Navigate to="/tastings" replace />;

  const share = async () => {
    const url = `${location.origin}/shared?d=${encodeFlight(base.title, base.subtitle, ids)}`;
    try {
      if (navigator.share) await navigator.share({ title: base.title, text: "Taste this flight on Wine Roam", url });
      else { await navigator.clipboard.writeText(url); toast.show("Share link copied", "ok"); }
    } catch { /* user cancelled */ }
  };

  const bs = ids.map((bid) => getBottleSync(bid)).filter(Boolean) as ReturnType<typeof allBottles>;

  const pickList = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allBottles()
      .filter((b) => !needle || `${b.name} ${b.brand} ${b.expression}`.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, ready, picker]);

  const applyPick = (bid: string) => {
    setIds((prev) => {
      if (picker?.at === "add") return [...prev, bid];
      if (typeof picker?.at === "number") {
        const next = [...prev];
        next[picker.at] = bid;
        return next;
      }
      return prev;
    });
    setEdited(true);
    setPicker(null);
    setQ("");
  };
  const removeAt = (i: number) => {
    setIds((prev) => prev.filter((_, x) => x !== i));
    setEdited(true);
  };
  const move = (i: number, dir: -1 | 1) => {
    setIds((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setEdited(true);
  };

  const flight: Flight = { ...base, bottleIds: ids };

  const startTasting = () => {
    if (edited) {
      saveCustomFlight({ ...flight, id: "custom" });
      nav("/taste/custom/setup");
    } else {
      nav(`/taste/${base.id}/setup`);
    }
  };
  const saveMine = () => {
    const newId = base.curated || base.id === "custom" ? `lib-${Date.now().toString(36)}` : base.id;
    const title = base.curated ? `${base.title} (my copy)` : base.title;
    saveToLibrary({ ...flight, id: newId, curated: false, title });
    saveMyFlightApi({ id: newId, title, subtitle: base.subtitle, bottleIds: ids }).catch(() => {});
    setSaved(true);
  };

  return (
    <>
      <AppBar title="Flight" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">{base.curated && !edited ? "Curated flight" : "Your flight"}</span>
          <h1>{base.title}</h1>
          <p>{base.subtitle}</p>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <span className="badge cached dot">{bs.length} pours</span>
          {edited && <span className="badge" style={{ background: "#fdeede", color: "var(--amber)" }}>edited</span>}
        </div>

        <div className="section-head">
          <span className="kicker">Pour order · ▲▼ reorder · ⇄ swap</span>
          <h2>The Lineup</h2>
        </div>
        <div className="card">
          <div className="stack">
            {bs.map((b, i) => (
              <motion.div key={`${b.id}-${i}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link to={`/bottle/${b.id}`} className="pour-row tap" style={{ flex: 1 }}>
                  <span className="pn" style={{ background: b.accent }}>{i + 1}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <div className="pnm">{b.name}</div>
                    <div className="psub">{b.wineType}{b.vintage ? ` ${b.vintage}` : ""} · {b.region} · {b.abv}%</div>
                  </span>
                </Link>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <button className="move-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">▲</button>
                  <button className="move-btn" disabled={i === bs.length - 1} onClick={() => move(i, 1)} aria-label="Move down">▼</button>
                </div>
                <button className="swap-btn" onClick={() => setPicker({ at: i })} aria-label="Swap">⇄</button>
                <button className="swap-btn" onClick={() => removeAt(i)} aria-label="Remove">✕</button>
              </motion.div>
            ))}
            <button className="btn ghost block" onClick={() => setPicker({ at: "add" })}>+ Add a pour</button>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn block" disabled={bs.length === 0} onClick={startTasting}>Start tasting →</button>
          <button className="btn ghost block" disabled={bs.length === 0 || saved} onClick={saveMine}>
            {saved ? "Saved to your flights ✓" : "Save to my flights"}
          </button>
          <button className="btn ghost block" disabled={bs.length === 0} onClick={share}>🔗 Share this flight</button>
        </div>
      </main>

      {picker && (
        <div className="picker-sheet">
          <div className="picker-head">
            <span style={{ fontWeight: 600 }}>{picker.at === "add" ? "Add a pour" : `Swap pour ${(picker.at as number) + 1}`}</span>
            <button className="swap-btn" onClick={() => { setPicker(null); setQ(""); }}>✕</button>
          </div>
          <input className="field" placeholder="Search bottles…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <div className="picker-list">
            {pickList.map((b) => (
              <button key={b.id} className="select-row tap" onClick={() => applyPick(b.id)}>
                <span className="nm">{b.name}</span>
                <span className="ord" style={{ color: "var(--muted)" }}>{b.expression}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
