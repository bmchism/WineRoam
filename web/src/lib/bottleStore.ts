import { useEffect, useState } from "react";
import type { Bottle } from "../types";
import { bottles as seed } from "../data/bottles";
import { listBottles } from "./api";

// In-memory bottle store: the curated seed set is always available (so curated
// flights resolve instantly), augmented with the live catalog once loaded. Lets
// flights + the flight builder reference any bottle (seed or live).

const map = new Map<string, Bottle>();
seed.forEach((b) => map.set(b.id, b));
let loaded = false;
let loading: Promise<void> | null = null;

export async function ensureBottles(): Promise<void> {
  if (loaded) return;
  if (!loading) {
    loading = (async () => {
      try {
        const { bottles } = await listBottles();
        bottles.forEach((b) => {
          if (!map.has(b.id)) map.set(b.id, b);
        });
      } catch {
        /* keep seed-only */
      }
      loaded = true;
    })();
  }
  return loading;
}

export const getBottleSync = (id: string): Bottle | undefined => map.get(id);
export const allBottles = (): Bottle[] => [...map.values()];

// Hook: ensures the live catalog is loaded; re-renders when ready.
export function useBottlesReady(): boolean {
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    let on = true;
    ensureBottles().then(() => on && setReady(true));
    return () => {
      on = false;
    };
  }, []);
  return ready;
}
