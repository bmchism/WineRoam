import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppBar from "../components/AppBar";
import AfBadge from "../components/AfBadge";
import BottleVisual from "../components/BottleVisual";
import NotesReviews from "../components/NotesReviews";
import Disclaimer from "../components/Disclaimer";
import { getBottle, uploadBottlePhoto, setBottleImageUrl } from "../lib/api";

import { isApiConfigured } from "../lib/config";
import { wineries } from "../data/wineries";
import { isFavorite, toggleFavorite } from "../lib/favorites";
import { listMyShelf, setShelf as setShelfApi, bottlePopularity, type ShelfStatus } from "../lib/api";
import BottleCard from "../components/BottleCard";
import { allBottles, useBottlesReady } from "../lib/bottleStore";
import { similarBottles } from "../lib/recommend";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/Toast";
import type { Bottle } from "../types";

const SHELF: { v: ShelfStatus; label: string; icon: string }[] = [
  { v: "owned", label: "Own it", icon: "🏠" },
  { v: "wishlist", label: "Want it", icon: "✨" },
  { v: "tasted", label: "Tasted", icon: "✓" },
];

function Spec({ k, v, full }: { k: string; v?: string; full?: boolean }) {
  if (!v) return null;
  return (
    <div className={`spec${full ? " full" : ""}`}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

export default function BottleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [bottle, setBottle] = useState<Bottle | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fav, setFav] = useState(false);
  const [shelf, setShelf] = useState<ShelfStatus | null>(null);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const ready = useBottlesReady();
  const [pop, setPop] = useState<Map<string, number>>(new Map());
  useEffect(() => { bottlePopularity().then(setPop).catch(() => {}); }, []);
  const recs = useMemo(
    () => (bottle ? similarBottles(bottle, allBottles(), pop) : []),
    [bottle, ready, pop]
  );

  useEffect(() => {
    if (id) setFav(isFavorite(id));
  }, [id]);
  useEffect(() => {
    if (!id || !user) return;
    listMyShelf().then((s) => setShelf(s.find((x) => x.bottleId === id)?.status ?? null)).catch(() => {});
  }, [id, user]);
  const pickShelf = async (v: ShelfStatus) => {
    if (!id) return;
    const next = shelf === v ? null : v;
    setShelf(next); // optimistic
    try {
      await setShelfApi(id, next);
      toast.show(next ? `Added to your shelf · ${next}` : "Removed from shelf", "ok");
    } catch (e) {
      toast.show((e as Error).message, "err");
    }
  };
  const [burst, setBurst] = useState(0);
  const toggleFav = async () => {
    if (!id) return;
    const next = !fav;
    setFav(next); // optimistic
    if (next) {
      setBurst((b) => b + 1);
      if (navigator.vibrate) navigator.vibrate(20);
    }
    const on = await toggleFavorite(id, !!user);
    setFav(on);
  };

  const addByUrl = async () => {
    if (!bottle) return;
    const url = window.prompt("Paste a public photo URL for this bottle:");
    if (!url) return;
    setUploading(true);
    try {
      await setBottleImageUrl(bottle.id, url.trim());
      setBottle({ ...bottle, imageUrl: url.trim() });
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bottle) return;
    setUploading(true);
    try {
      const url = await uploadBottlePhoto(bottle.id, file);
      setBottle({ ...bottle, imageUrl: url });
    } catch {
      /* ignore — keep icon */
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    let on = true;
    if (!id) return;
    getBottle(id).then((b) => {
      if (!on) return;
      setBottle(b);
      setLoading(false);
    });
    return () => {
      on = false;
    };
  }, [id]);

  if (loading)
    return (
      <>
        <AppBar title="Bottle" back />
        <main className="screen">
          <div className="muted" style={{ padding: "40px 4px" }}>Loading…</div>
        </main>
      </>
    );
  if (!bottle) return <Navigate to="/catalog" replace />;
  const winery = wineries[bottle.wineryId];

  return (
    <>
      <AppBar title={bottle.brand} back />
      <main className="screen">
        <div style={{ alignSelf: "flex-end", position: "relative" }}>
          <button
            className="chip tap"
            aria-pressed={fav}
            onClick={toggleFav}
            style={{ display: "inline-flex", gap: 6, background: fav ? "var(--ink)" : undefined, color: fav ? "var(--cream)" : undefined, borderColor: fav ? "var(--ink)" : undefined }}
          >
            {fav ? "★ Saved" : "☆ Save to favorites"}
          </button>
          <AnimatePresence>
            {burst > 0 && (
              <motion.span
                key={burst}
                className="fav-burst"
                initial={{ opacity: 1, scale: 0.4, y: 0 }}
                animate={{ opacity: 0, scale: 1.8, y: -26 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                onAnimationComplete={() => setBurst(0)}
                aria-hidden
              >★</motion.span>
            )}
          </AnimatePresence>
        </div>
        {user && (
          <div className="shelf-row" role="group" aria-label="Add to my shelf">
            {SHELF.map((s) => (
              <button
                key={s.v}
                className={`shelf-btn${shelf === s.v ? " on" : ""}`}
                onClick={() => pickShelf(s.v)}
                aria-pressed={shelf === s.v}
              >
                <span aria-hidden>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>
        )}
        {bottle.imageUrl ? (
          <motion.img
            src={bottle.imageUrl}
            alt={bottle.name}
            className="bottle-photo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "grid", placeItems: "center", margin: "6px 0 4px" }}>
            <BottleVisual name={bottle.brand} accent={bottle.accent} size={132} />
          </motion.div>
        )}
        {isApiConfigured && user && (
          <>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="photo-add tap" style={{ flex: 1 }} disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? "Uploading…" : bottle.imageUrl ? "📷 Replace photo" : "📷 Add a photo"}
              </button>
              <button className="photo-add tap" style={{ flex: 1 }} disabled={uploading} onClick={addByUrl}>
                🔗 Photo URL
              </button>
            </div>
          </>
        )}
        <motion.div
          className="hero"
          style={{
            background: `linear-gradient(150deg, ${bottle.accent}, ${shade(
              bottle.accent
            )})`,
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <span className="pill" style={{ background: "rgba(255,255,255,.22)" }}>
            <span className="dot" />
            {bottle.wineType}
          </span>
          <div className="brand">{bottle.name}</div>
          <div className="nom">
            {winery?.name ?? bottle.producer} · {bottle.region}
          </div>
          <div className="stat-row">
            <div className="stat">
              <div className="n">{bottle.abv}%</div>
              <div className="l">{bottle.proof} proof</div>
            </div>
            <div className="stat">
              <div className="n">{bottle.distillation ?? "—"}</div>
              <div className="l">Distilled</div>
            </div>
            <div className="stat">
              <div className="n">{bottle.crushing?.split(",")[0] ?? "—"}</div>
              <div className="l">Crush</div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          {bottle.organic && <AfBadge size="md" asLink />}
          {bottle.verified === false && (
            <span className="badge" style={{ background: "#fdeede", color: "var(--amber)" }}>
              Pending review
            </span>
          )}
        </div>

        {bottle.tastingNotes && (
          <div className="notes">
            <span className="qt">“</span>
            {bottle.tastingNotes}
          </div>
        )}

        <div className="section-head">
          <span className="kicker">On the nose</span>
          <h2>Aromas</h2>
        </div>
        <div className="tags">
          {bottle.aromas.map((a) => (
            <span className="tag" key={a}>
              {a}
            </span>
          ))}
        </div>

        <div className="section-head">
          <span className="kicker">On the palate</span>
          <h2>Flavors</h2>
        </div>
        <div className="tags">
          {bottle.flavors.map((f) => (
            <span className="tag solid" key={f}>
              {f}
            </span>
          ))}
        </div>

        <div className="section-head">
          <span className="kicker">How it's made</span>
          <h2>Production</h2>
        </div>
        <div className="spec-grid">
          <Spec k="Region" v={bottle.region} />
          <Spec k="Water" v={bottle.waterSource} />
          <Spec k="Cooking" v={bottle.cooking} />
          <Spec k="Crushing" v={bottle.crushing} />
          <Spec k="Still" v={bottle.stillType} />
          <Spec k="Distillation" v={bottle.distillation} />
          <Spec k="Fermentation" v={bottle.fermentation} full />
          <Spec k="Aging" v={bottle.aging} full />
        </div>

        {bottle.story && (
          <>
            <div className="section-head">
              <span className="kicker">The story</span>
              <h2>{bottle.brand}</h2>
            </div>
            <div className="card">
              <p className="lead" style={{ margin: 0 }}>
                {bottle.story}
              </p>
            </div>
          </>
        )}

        {winery && (winery.winemaker || winery.grapes) && (
          <div className="card" style={{ marginTop: 12 }}>
            <span className="kicker">Winery</span>
            <h3 style={{ fontFamily: "var(--serif)", margin: "6px 0 6px" }}>
              {winery.name}
            </h3>
            {winery.winemaker && (
              <p className="muted" style={{ margin: "0 0 4px", fontSize: 14 }}>
                Winemaker: {winery.winemaker}
              </p>
            )}
            {winery.grapes && (
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                Key grapes: {winery.grapes.join(", ")}
              </p>
            )}
          </div>
        )}

        <NotesReviews bottleId={bottle.id} accent={bottle.accent} />

        <div className="section-head"><span className="kicker">Find a bottle</span><h2>Where to Buy</h2></div>
        <div className="card stack">
          <a className="btn ghost block" href={`https://www.wine-searcher.com/find/${encodeURIComponent(bottle.name)}`} target="_blank" rel="noopener noreferrer" style={{ textAlign: "center" }}>🔎 Search Wine‑Searcher</a>
          <a className="btn ghost block" href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(bottle.name + " wine")}`} target="_blank" rel="noopener noreferrer" style={{ textAlign: "center" }}>🛒 Compare on Google Shopping</a>
          <div className="muted" style={{ fontSize: 12 }}>Live search — prices and availability vary by region.</div>
        </div>

        {user && recs.length > 0 && (
          <>
            <div className="section-head"><span className="kicker">If you like this</span><h2>You might also like</h2></div>
            <div className="list">
              {recs.map((b, i) => <BottleCard key={b.id} bottle={b} index={Math.min(i, 4)} />)}
            </div>
          </>
        )}
        <Disclaimer />
      </main>
    </>
  );
}

// Darken a hex color for the hero gradient end.
function shade(hex: string, amt = -28) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}
const clamp = (v: number) => Math.max(0, Math.min(255, v));
