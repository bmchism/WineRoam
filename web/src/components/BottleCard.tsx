import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Bottle } from "../types";
import BottleVisual from "./BottleVisual";
import { ChevronRight } from "../icons";

export default function BottleCard({ bottle, index = 0 }: { bottle: Bottle; index?: number }) {
  const imageUrl = bottle.imageKeys?.[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.32, ease: "easeOut" }}
    >
      <Link to={`/bottle/${bottle.id}`} className="bottle-card tap">
        <div className="vessel" style={{ overflow: "hidden", padding: 0, border: "none", position: "relative" }}>
          {imageUrl ? (
            <img src={imageUrl} alt={bottle.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <BottleVisual name={bottle.producer} accent={bottle.accent} size={56} />
          )}
          {bottle.organic && <span className="af-corner" title="Organic/Biodynamic" aria-label="Organic wine">🍇</span>}
        </div>
        <div className="body">
          <span
            className="pill"
            style={{ background: bottle.accent }}
          >
            <span className="dot" />
            {bottle.wineType}
          </span>
          <h3 className="brand">{bottle.name}</h3>
          <div className="meta">
            {bottle.producer}{bottle.vintage ? ` · ${bottle.vintage}` : ""} · {bottle.region}
          </div>
          <div className="taglist tags">
            {bottle.flavors.slice(0, 3).map((f) => (
              <span className="tag" key={f}>
                {f}
              </span>
            ))}
          </div>
        </div>
        <span style={{ alignSelf: "center", color: "var(--muted)", display: "flex" }}>
          <ChevronRight size={20} />
        </span>
      </Link>
    </motion.div>
  );
}
