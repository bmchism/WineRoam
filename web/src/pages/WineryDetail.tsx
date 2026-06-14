import { useParams, Link } from "react-router-dom";
import AppBar from "../components/AppBar";
import { wineries } from "../data/wineries";
import { bottles } from "../data/bottles";
import { GrapeIcon } from "../icons";

export default function WineryDetail() {
  const { id } = useParams<{ id: string }>();
  const winery = id ? wineries[id] : undefined;

  if (!winery) {
    return (
      <>
        <AppBar title="Winery" back />
        <main className="screen">
          <div className="stub">
            <div className="icn">🍇</div>
            <h3>Winery not found</h3>
            <p>We don't have this winery in our database yet.</p>
          </div>
        </main>
      </>
    );
  }

  const wineryBottles = bottles.filter((b) => b.wineryId === id);

  return (
    <>
      <AppBar title={winery.name} back />
      <main className="screen">
        <div className="hero" style={{ background: `linear-gradient(145deg, #722F37, #4a1c22)` }}>
          <span style={{ display: "inline-flex", background: "rgba(255,255,255,.15)", borderRadius: 10, padding: 8 }}>
            <GrapeIcon size={28} />
          </span>
          <div className="brand">{winery.name}</div>
          <div className="nom">{winery.region}{winery.country ? ` · ${winery.country}` : ""}</div>
        </div>

        {winery.notes && (
          <div className="notes">
            <span className="qt">"</span>
            {winery.notes}
          </div>
        )}

        <div className="spec-grid">
          {winery.appellation && <div className="spec"><div className="k">Appellation</div><div className="v">{winery.appellation}</div></div>}
          {winery.winemaker && <div className="spec"><div className="k">Winemaker</div><div className="v">{winery.winemaker}</div></div>}
          {winery.grapes && winery.grapes.length > 0 && (
            <div className="spec full"><div className="k">Key Grapes</div><div className="v">{winery.grapes.join(", ")}</div></div>
          )}
          {winery.website && (
            <div className="spec full"><div className="k">Website</div><div className="v"><a href={winery.website} target="_blank" rel="noreferrer" style={{ color: "var(--amber)" }}>{winery.website.replace(/https?:\/\//, "")}</a></div></div>
          )}
        </div>

        {wineryBottles.length > 0 && (
          <>
            <div className="section-head">
              <span className="kicker">In our collection</span>
              <h2>Wines from {winery.name}</h2>
            </div>
            <div className="list">
              {wineryBottles.map((b) => (
                <Link key={b.id} to={`/bottle/${b.id}`} className="card tap" style={{ display: "block" }}>
                  <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 16 }}>{b.name}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>
                    {b.wineType}{b.vintage ? ` · ${b.vintage}` : ""} · {b.region}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
