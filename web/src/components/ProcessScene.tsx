import type { SceneId } from "../data/process";

// Original animated SVG scenes for winemaking process.
// Each is stylized in the wine-premium palette and lightly animated.

export default function ProcessScene({ id, accent }: { id: SceneId; accent: string }) {
  return (
    <div className="scene" style={{ ["--acc" as any]: accent }}>
      <svg viewBox="0 0 200 150" width="100%" height="100%" role="img" aria-label={id}>
        {SCENES[id] || <rect width="200" height="150" fill="none" />}
      </svg>
    </div>
  );
}

const SCENES: Record<SceneId, JSX.Element> = {
  // 1 — Vineyard with rows of vines and sun
  vineyard: (
    <g>
      <circle cx="158" cy="34" r="16" fill="#F2C14E" opacity="0.85" className="anim-pulse" />
      <rect x="0" y="100" width="200" height="50" fill="#5c7a5a" opacity="0.3" rx="4" />
      {[30, 60, 90, 120, 150].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="80" x2={x} y2="130" stroke="#6B4423" strokeWidth="2" />
          <circle cx={x} cy="75" r="12" fill="var(--acc)" opacity="0.7" className="anim-sway" style={{ transformOrigin: `${x}px 75px` }} />
          <circle cx={x - 4} cy="78" r="3" fill="#4a1c22" opacity="0.6" />
          <circle cx={x + 4} cy="72" r="3" fill="#4a1c22" opacity="0.6" />
        </g>
      ))}
    </g>
  ),
  // 2 — Harvest with basket and grapes
  harvest: (
    <g>
      <rect x="60" y="80" width="80" height="50" rx="10" fill="#8B4513" opacity="0.6" />
      <rect x="65" y="75" width="70" height="10" rx="5" fill="#A0522D" />
      {[80, 95, 110, 125].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={90 + (i % 2) * 5} r="6" fill="var(--acc)" />
          <circle cx={x - 3} cy={95 + (i % 2) * 5} r="4" fill="var(--acc)" opacity="0.8" />
        </g>
      ))}
      <path d="M85 65 C90 50 110 50 115 65" stroke="#5c7a5a" strokeWidth="2" fill="none" />
      <circle cx="100" cy="48" r="3" fill="#5c7a5a" />
    </g>
  ),
  // 3 — Crush with press
  crush: (
    <g>
      <rect x="50" y="70" width="100" height="60" rx="8" fill="#6B4423" opacity="0.4" />
      <rect x="55" y="65" width="90" height="10" rx="3" fill="#8B4513" />
      <rect x="70" y="40" width="60" height="30" rx="4" fill="#A0522D" opacity="0.5" />
      <path d="M100 40 L100 20" stroke="#666" strokeWidth="3" />
      <rect x="85" y="15" width="30" height="8" rx="3" fill="#666" />
      {[65, 80, 95, 110, 125].map((x, i) => (
        <circle key={i} cx={x} cy={100 + (i % 3) * 5} r="5" fill="var(--acc)" opacity="0.7" />
      ))}
      <path d="M100 130 L100 140 L130 140" stroke="var(--acc)" strokeWidth="2" opacity="0.6" />
    </g>
  ),
  // 4 — Fermentation tanks
  ferment: (
    <g>
      {[55, 100, 145].map((x, i) => (
        <g key={i}>
          <rect x={x - 18} y="50" width="36" height="80" rx="18" fill="#C0C0C0" opacity="0.5" />
          <rect x={x - 15} y="55" width="30" height="70" rx="15" fill="#E8E8E8" opacity="0.3" />
          <circle cx={x} cy="60" r="4" fill="#666" opacity="0.4" />
          {[70, 80, 90, 100].map((y, j) => (
            <circle key={j} cx={x + (j % 2 ? 3 : -3)} cy={y} r="2" fill="var(--acc)" opacity="0.3" className="anim-pulse" />
          ))}
        </g>
      ))}
    </g>
  ),
  // 5 — Press
  press: (
    <g>
      <ellipse cx="100" cy="100" rx="50" ry="30" fill="#8B4513" opacity="0.3" />
      <ellipse cx="100" cy="95" rx="45" ry="25" fill="#A0522D" opacity="0.4" />
      <rect x="60" y="50" width="80" height="50" rx="6" fill="#C0C0C0" opacity="0.3" />
      <path d="M70 100 Q100 80 130 100" stroke="var(--acc)" strokeWidth="3" fill="none" opacity="0.7" />
      <path d="M90 110 L90 135" stroke="var(--acc)" strokeWidth="2" opacity="0.5" />
      <path d="M110 110 L110 135" stroke="var(--acc)" strokeWidth="2" opacity="0.5" />
    </g>
  ),
  // 6 — Aging in barrels
  age: (
    <g>
      {[0, 1, 2].map((row) => (
        <g key={row}>
          {[0, 1, 2].map((col) => {
            const x = 40 + col * 50;
            const y = 40 + row * 35;
            return (
              <g key={`${row}-${col}`}>
                <ellipse cx={x} cy={y} rx="22" ry="14" fill="#8B4513" opacity="0.6" />
                <ellipse cx={x} cy={y} rx="18" ry="11" fill="#A0522D" opacity="0.5" />
                <ellipse cx={x} cy={y} rx="4" ry="3" fill="#2a2118" opacity="0.3" />
              </g>
            );
          })}
        </g>
      ))}
    </g>
  ),
  // 7 — Blending with lab equipment
  blend: (
    <g>
      {[60, 90, 120, 150].map((x, i) => (
        <g key={i}>
          <rect x={x - 8} y="60" width="16" height="60" rx="3" fill="var(--acc)" opacity={0.4 + i * 0.15} />
          <rect x={x - 6} y={70 + i * 5} width="12" height={50 - i * 5} rx="2" fill="var(--acc)" opacity={0.6 + i * 0.1} />
        </g>
      ))}
      <path d="M50 90 L60 90" stroke="#666" strokeWidth="1.5" />
      <path d="M150 90 L170 90 L170 100 L155 100" stroke="#666" strokeWidth="1.5" fill="none" />
      <rect x="155" y="95" width="20" height="30" rx="4" fill="var(--acc)" opacity="0.8" />
    </g>
  ),
  // 8 — Bottle and cork
  bottle: (
    <g>
      <rect x="88" y="30" width="24" height="100" rx="12" fill="var(--acc)" opacity="0.7" />
      <rect x="92" y="20" width="16" height="15" rx="4" fill="#8B4513" opacity="0.6" />
      <rect x="94" y="10" width="12" height="12" rx="3" fill="#A0522D" opacity="0.5" />
      <rect x="90" y="70" width="20" height="40" rx="2" fill="rgba(255,255,255,0.1)" />
      <text x="100" y="92" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.6)">WINE</text>
      <ellipse cx="100" cy="130" rx="8" ry="3" fill="rgba(0,0,0,0.1)" />
    </g>
  ),
};
