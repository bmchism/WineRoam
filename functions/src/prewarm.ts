import { topWines, type TopWineSeed } from "@agave/seed";
import { handler as enrich } from "./enrich.js";
import { cachedBottle } from "./enrich.js";

// Top-250 cold-start cache pre-warm (BUILD_PLAN §11).
// `list` returns the manifest for the Step Functions Map; `one` enriches a
// single entry if it isn't already cached (idempotent — re-runnable).

export const list = async (): Promise<TopWineSeed[]> => {
  return topWines;
};

interface OneResult {
  brand: string;
  expression: string;
  status: "cached" | "enriched" | "error";
  bottleId?: string;
  error?: string;
}

export const one = async (entry: TopWineSeed): Promise<OneResult> => {
  try {
    // Skip if already cached (only possible when we know the NOM up front).
    if (entry.nom) {
      const existing = await cachedBottle(entry.nom, entry.brand);
      if (existing) {
        return {
          brand: entry.brand,
          expression: entry.expression,
          status: "cached",
          bottleId: existing.id,
        };
      }
    }
    const bottle = await enrich({
      hint: { brand: entry.brand, expression: entry.expression as any, nom: entry.nom },
    });
    return {
      brand: entry.brand,
      expression: entry.expression,
      status: "enriched",
      bottleId: bottle.id,
    };
  } catch (err) {
    return {
      brand: entry.brand,
      expression: entry.expression,
      status: "error",
      error: (err as Error).message,
    };
  }
};
