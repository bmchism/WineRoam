import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "../components/AppBar";
import { SkeletonList } from "../components/Skeleton";
import { allBottles, useBottlesReady } from "../lib/bottleStore";
import { saveCustomFlight, saveToLibrary, type Flight } from "../data/flights";
import { saveMyFlightApi } from "../lib/api";

export default function FlightBuilder() {
  const nav = useNavigate();
  const ready = useBottlesReady();
  const [name, setName] = useState("My Tasting");
  const [picked, setPicked] = useState<string[]>([]); // selection order = pour order
  const [q, setQ] = useState("");

  const catalog = useMemo(() => {
    const list = allBottles();
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? list.filter((b) => `${b.name} ${b.brand} ${b.expression}`.toLowerCase().includes(needle))
      : list;
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
    // `ready` in deps so the list refreshes when the live catalog loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, ready]);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const build = (): Flight => ({
    id: "custom",
    title: name.trim() || "My Tasting",
    subtitle: `${picked.length} bottles · built by you`,
    bottleIds: picked,
    curated: false,
  });

  const start = () => {
    saveCustomFlight(build());
    nav("/flight/custom");
  };
  const save = () => {
    const id = `lib-${Date.now().toString(36)}`;
    const f = { ...build(), id };
    saveToLibrary(f);
    saveMyFlightApi({ id, title: f.title, subtitle: f.subtitle, bottleIds: f.bottleIds }).catch(() => {});
    saveCustomFlight({ ...f, id: "custom" });
    nav(`/flight/${id}`);
  };

  return (
    <>
      <AppBar title="Build a Flight" back />
      <main className="screen" style={{ paddingBottom: 150 }}>
        <div className="page-title">
          <span className="kicker">Host setup</span>
          <h1>Build a Flight</h1>
          <p>Add any bottles, in the order you'll pour them.</p>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="label">Tasting name</div>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Tasting" />
        </div>

        <div className="section-head">
          <span className="kicker">Choose bottles</span>
          <h2>The Catalog</h2>
        </div>
        <input className="field" placeholder="Search bottles…" value={q} onChange={(e) => setQ(e.target.value)} />

        <div className="list" style={{ marginTop: 10 }}>
          {!ready && <SkeletonList rows={5} />}
          {catalog.slice(0, 80).map((b) => {
            const idx = picked.indexOf(b.id);
            const on = idx !== -1;
            return (
              <button key={b.id} className={`select-row tap${on ? " on" : ""}`} onClick={() => toggle(b.id)}>
                <span className="check">{on ? "✓" : ""}</span>
                <span style={{ minWidth: 0 }}>
                  <div className="nm">{b.name}</div>
                  <div className="sub">{b.expression} · {b.abv}%</div>
                </span>
                {on && <span className="ord">#{idx + 1}</span>}
              </button>
            );
          })}
          {ready && catalog.length > 80 && (
            <div className="muted" style={{ padding: "8px 2px", fontSize: 13 }}>Showing 80 — search to narrow.</div>
          )}
        </div>
      </main>

      <div className="actionbar">
        <span className="sel">{picked.length === 0 ? "No bottles yet" : `${picked.length} selected`}</span>
        <button className="btn ghost" style={{ marginLeft: "auto" }} disabled={picked.length === 0} onClick={save}>Save</button>
        <button className="btn" style={{ marginLeft: 0 }} disabled={picked.length === 0} onClick={start}>Continue</button>
      </div>
    </>
  );
}
