import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AppBar from "../components/AppBar";
import BottleCard from "../components/BottleCard";
import { SkeletonList } from "../components/Skeleton";
import Disclaimer from "../components/Disclaimer";
import { CameraIcon } from "../icons";
import { listBottles, bottlePopularity } from "../lib/api";
import { syncFavorites } from "../lib/favorites";
import { useAuth } from "../lib/auth";
import { EXPRESSIONS, type Bottle, type Expression } from "../types";

const filters: ("All" | Expression)[] = ["All", ...EXPRESSIONS];

type Sort = "az" | "za" | "abv-desc" | "abv-asc" | "expr" | "pop";
const SORTS: { v: Sort; label: string }[] = [
  { v: "pop", label: "Most popular" },
  { v: "az", label: "Name A–Z" },
  { v: "za", label: "Name Z–A" },
  { v: "abv-desc", label: "ABV high → low" },
  { v: "abv-asc", label: "ABV low → high" },
  { v: "expr", label: "By wine type" },
];

const exprIndex = (e: Expression) => EXPRESSIONS.indexOf(e);

export default function Catalog() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");
  const [all, setAll] = useState<Bottle[]>([]);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("pop");
  const [afOnly, setAfOnly] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [pop, setPop] = useState<Map<string, number>>(new Map());
  const { user } = useAuth();

  // Live favorite counts → popularity ranking (refreshes each visit).
  useEffect(() => {
    bottlePopularity().then(setPop).catch(() => {});
  }, []);

  useEffect(() => {
    let on = true;
    listBottles().then(({ bottles, live }) => {
      if (!on) return;
      setAll(bottles);
      setLive(live);
      setLoading(false);
    });
    return () => {
      on = false;
    };
  }, []);

  useEffect(() => {
    syncFavorites(!!user).then((ids) => setFavs(new Set(ids))).catch(() => {});
  }, [user]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = all.filter((b) => {
      const wineType = b.wineType || b.expression || "";
      if (active !== "All" && wineType !== active) return false;
      if (afOnly && !b.organic && !b.additiveFree) return false;
      if (favOnly && !favs.has(b.id)) return false;
      if (needle && !`${b.name} ${b.brand || ""} ${b.nom || ""} ${b.agaveRegion || ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (sort) {
        case "za": return b.name.localeCompare(a.name);
        case "abv-desc": return (b.abv || 0) - (a.abv || 0) || a.name.localeCompare(b.name);
        case "abv-asc": return (a.abv || 0) - (b.abv || 0) || a.name.localeCompare(b.name);
        case "expr": return exprIndex(a.wineType || a.expression || "Red") - exprIndex(b.wineType || b.expression || "Red") || a.name.localeCompare(b.name);
        case "pop": return (pop.get(b.id) ?? 0) - (pop.get(a.id) ?? 0) || a.name.localeCompare(b.name);
        default: return a.name.localeCompare(b.name);
      }
    });
    return out;
  }, [all, active, q, sort, afOnly, favOnly, favs, pop]);

  const afCount = useMemo(() => all.filter((b) => b.organic || b.additiveFree).length, [all]);

  return (
    <>
      <AppBar />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">The Catalog{live ? " · live" : ""}</span>
          <h1>Explore Wines</h1>
          <p>
            {all.length} wines across every style. Search, filter, and sort —
            the 🍇 badge marks organic and biodynamic bottles.
          </p>
        </div>

        <Link to="/scan" className="scan-cta tap">
          <CameraIcon size={22} />
          <span>Scan a bottle to identify it</span>
          <span style={{ marginLeft: "auto" }}>›</span>
        </Link>

        <input
          className="field"
          style={{ marginTop: 12 }}
          aria-label="Search wines"
          placeholder="Search producer, region, grape…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="chips">
          {filters.map((f) => (
            <button
              key={f}
              className={`chip tap${active === f ? " active" : ""}`}
              onClick={() => setActive(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="catalog-controls">
          <select className="select-mini" aria-label="Sort wines" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>{s.label}</option>
            ))}
          </select>
          <button className={`chip tap${afOnly ? " active" : ""}`} onClick={() => setAfOnly((v) => !v)}>
            🍇 Organic{afCount ? ` · ${afCount}` : ""}
          </button>
          <button className={`chip tap${favOnly ? " active" : ""}`} onClick={() => setFavOnly((v) => !v)}>
            ★ Favorites
          </button>
          <span className="count-pill">{list.length}</span>
        </div>

        {loading ? (
          <div style={{ marginTop: 12 }}><SkeletonList rows={6} /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ textAlign: "center", padding: "40px 12px" }}>
            <div style={{ fontSize: 40 }}>🍸</div>
            <p className="muted" style={{ marginTop: 8, fontSize: 14.5 }}>No bottles match those filters.</p>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => { setActive("All"); setQ(""); setAfOnly(false); setFavOnly(false); }}>
              Clear filters
            </button>
          </div>
        ) : (
          // Re-stagger on filter/sort change (not on every keystroke) for visual continuity.
          <motion.div key={`${active}|${sort}|${afOnly}|${favOnly}`} className="list" style={{ marginTop: 12 }}>
            {list.map((b, i) => (
              <BottleCard key={b.id} bottle={b} index={Math.min(i, 8)} />
            ))}
          </motion.div>
        )}
        <Disclaimer />
      </main>
    </>
  );
}
