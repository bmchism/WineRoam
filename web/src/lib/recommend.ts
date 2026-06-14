import type { Bottle } from "../types";

// Content-based "you might also like": score every other bottle by how much it
// shares with the seed (same winery, wine type, grape, flavor notes), with a light
// nudge from popularity. Pure + deterministic; runs against the in-memory store.
export function similarBottles(
  seed: Bottle,
  all: Bottle[],
  pop?: Map<string, number>,
  n = 4
): Bottle[] {
  const seedFlavors = new Set((seed.flavors ?? []).map((f) => f.toLowerCase()));
  const seedGrapes = new Set((seed.grapes ?? []).map((g) => g.toLowerCase()));
  const scored = all
    .filter((b) => b.id !== seed.id)
    .map((b) => {
      let s = 0;
      if (b.wineryId === seed.wineryId) s += 3; // same winery
      if (b.wineType === seed.wineType) s += 2; // same wine type
      if (b.region === seed.region) s += 1.5; // same region
      // shared grapes
      for (const g of b.grapes ?? []) if (seedGrapes.has(g.toLowerCase())) s += 1;
      // shared flavors
      for (const f of b.flavors ?? []) if (seedFlavors.has(f.toLowerCase())) s += 0.5;
      if ((b.organic || b.biodynamic) && (seed.organic || seed.biodynamic)) s += 0.5;
      // small popularity tiebreaker (favorite count, capped)
      if (pop) s += Math.min(1, (pop.get(b.id) ?? 0) * 0.1);
      return { b, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.b.name.localeCompare(b.b.name));
  return scored.slice(0, n).map((x) => x.b);
}
