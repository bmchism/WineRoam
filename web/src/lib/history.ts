import type { Bottle } from "../types";
import type { Flight } from "../data/flights";
import { loadRatings } from "./tasting";
import { listMyHistoryApi, saveMyTastingApi, deleteMyTastingApi, type CloudTasting } from "./api";

// A finished tasting, summarized. Stored locally for everyone and synced to the
// account (DynamoDB under USER#sub) when the taster is signed in. Keyed by
// flight id so each flight keeps the taster's most recent run.

export interface TastingEntry {
  id: string;
  flightId: string;
  title: string;
  bottleCount: number;
  avgScore: number;
  quizCorrect: number | null;
  quizTotal: number | null;
  mode: string; // "solo" | "live"
  createdAt: string;
}

const KEY = "agave.history";

function loadLocal(): TastingEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function saveLocal(entries: TastingEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

// Build a summary entry from a flight's saved ratings.
export function summarize(
  flight: Flight,
  bottles: Bottle[],
  extra: { mode?: string; quizCorrect?: number | null; quizTotal?: number | null } = {}
): TastingEntry {
  const ratings = loadRatings(flight.id);
  const scored = bottles.map((b) => ratings[b.id]?.overall ?? 0).filter((n) => n > 0);
  const avg = scored.length ? Math.round((scored.reduce((s, n) => s + n, 0) / scored.length) * 10) / 10 : 0;
  return {
    id: flight.id,
    flightId: flight.id,
    title: flight.title,
    bottleCount: bottles.length,
    avgScore: avg,
    quizCorrect: extra.quizCorrect ?? null,
    quizTotal: extra.quizTotal ?? null,
    mode: extra.mode ?? "solo",
    createdAt: new Date().toISOString(),
  };
}

// Persist locally; if signed in, also push to the account (best effort).
export async function recordTasting(entry: TastingEntry, signedIn: boolean): Promise<void> {
  const all = loadLocal().filter((e) => e.id !== entry.id);
  all.unshift(entry);
  saveLocal(all);
  if (signedIn) {
    await saveMyTastingApi(entry as CloudTasting).catch(() => {});
  }
}

// Cloud history when signed in (most complete), else local.
export async function loadHistory(signedIn: boolean): Promise<TastingEntry[]> {
  if (signedIn) {
    const cloud = await listMyHistoryApi().catch(() => null);
    if (cloud) return cloud as TastingEntry[];
  }
  return loadLocal();
}

export async function removeTasting(id: string, signedIn: boolean): Promise<void> {
  saveLocal(loadLocal().filter((e) => e.id !== id));
  if (signedIn) await deleteMyTastingApi(id).catch(() => {});
}
