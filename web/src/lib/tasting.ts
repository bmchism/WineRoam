import type { Pacing, Visibility } from "../types";

// Per-session host options (chosen on the setup screen, carried into the runner).
export interface SessionOptions {
  pacing: Pacing; // "host" | "self"
  visibility: Visibility; // "social" | "private"
  quiz: boolean; // end-of-tasting quiz on/off
}

export const defaultOptions: SessionOptions = {
  pacing: "host",
  visibility: "social",
  quiz: true,
};

const optKey = (flightId: string) => `wine.options.${flightId}`;

export function loadOptions(flightId: string): SessionOptions {
  try {
    const raw = localStorage.getItem(optKey(flightId));
    return raw ? { ...defaultOptions, ...JSON.parse(raw) } : defaultOptions;
  } catch {
    return defaultOptions;
  }
}

export function saveOptions(flightId: string, opts: SessionOptions) {
  localStorage.setItem(optKey(flightId), JSON.stringify(opts));
}

// Local tasting-session state: a host/guest's ratings for each pour, persisted
// so a dropped connection (or refresh) never loses progress. Mirrors the
// Rating entity; the live multi-device version rides AppSync.

export interface PourRating {
  bottleId: string;
  color: number; // 1-5
  aroma: number; // 1-5
  flavor: number; // 1-5
  finish: number; // 1-5
  overall: number; // 1-10
  note: string;
}

const key = (flightId: string) => `wine.tasting.${flightId}`;

export function loadRatings(flightId: string): Record<string, PourRating> {
  try {
    return JSON.parse(localStorage.getItem(key(flightId)) || "{}");
  } catch {
    return {};
  }
}

export function saveRating(flightId: string, rating: PourRating) {
  const all = loadRatings(flightId);
  all[rating.bottleId] = rating;
  localStorage.setItem(key(flightId), JSON.stringify(all));
  // Solo ratings are local-only (no session to sync to).
}

export function emptyRating(bottleId: string): PourRating {
  return { bottleId, color: 0, aroma: 0, flavor: 0, finish: 0, overall: 0, note: "" };
}
