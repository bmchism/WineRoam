// Shimmer placeholders shown while data loads — replaces plain "Loading…" text.
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden />;
}

// A stack of card-shaped skeletons for list screens (catalog, users, etc).
export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="sk-card" />
      ))}
    </div>
  );
}
