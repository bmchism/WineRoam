import { listMyFavoritesApi, setFavoriteApi } from "./api";

// Favorited bottle ids. Stored locally for instant UI and synced to the account
// (DynamoDB FAV# items) when signed in. Local is the optimistic source; cloud
// is reconciled on load.

const KEY = "wine.favorites";

function loadLocal(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function saveLocal(ids: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...ids]));
}

export function localFavorites(): string[] {
  return [...loadLocal()];
}

export function isFavorite(id: string): boolean {
  return loadLocal().has(id);
}

// Toggle locally (optimistic) and push to the account when signed in.
export async function toggleFavorite(id: string, signedIn: boolean): Promise<boolean> {
  const ids = loadLocal();
  const on = !ids.has(id);
  if (on) ids.add(id);
  else ids.delete(id);
  saveLocal(ids);
  if (signedIn) await setFavoriteApi(id, on).catch(() => {});
  return on;
}

// Reconcile from the account; merges cloud into local and returns the union.
export async function syncFavorites(signedIn: boolean): Promise<string[]> {
  if (!signedIn) return localFavorites();
  const cloud = await listMyFavoritesApi().catch(() => null);
  if (!cloud) return localFavorites();
  const merged = new Set([...loadLocal(), ...cloud]);
  saveLocal(merged);
  return [...merged];
}
