import { topWines, type TopWineSeed } from "@agave/seed";
import { handler as enrich } from "./enrich.js";
import { cachedBottle } from "./enrich.js";

// Prewarm batch. `list` returns a page of the manifest for the Step Functions
// Map state. Pass `{ offset: N }` to paginate (default: first 400 entries).
// The 400-entry limit keeps the Step Functions payload under 256KB.

export const list = async (event?: { offset?: number; limit?: number }): Promise<TopWineSeed[]> => {
  const offset = event?.offset ?? 0;
  const limit = event?.limit ?? 400;
  return topWines.slice(offset, offset + limit);
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
    // Map wine seed fields to enrich hint format
    const brand = entry.producer;
    const expression = entry.wineType as any;
    const wineName = entry.name;
    
    const bottle = await enrich({
      hint: { brand: `${brand} - ${wineName}`, expression, nom: entry.region },
    });
    return {
      brand,
      expression: entry.wineType,
      status: "enriched",
      bottleId: bottle.id,
    };
  } catch (err) {
    return {
      brand: entry.producer,
      expression: entry.wineType,
      status: "error",
      error: (err as Error).message,
    };
  }
};
