// Guest tasting access: the set of bottle ids a no-account guest is allowed to
// view in full. A guest enters via a tasting link/QR (live join, shared flight,
// or solo runner); we record that flight's bottle ids so the otherwise-gated
// /bottle/:id page opens for those bottles only — the link can't be used to
// browse the whole catalog. Scoped to the tab (sessionStorage), not persisted.

const KEY = "guestBottleIds";

function read(): Set<string> {
  try {
    const raw = sessionStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function allowGuestBottles(ids: string[]): void {
  if (!ids.length) return;
  try {
    const set = read();
    let changed = false;
    for (const id of ids) if (id && !set.has(id)) { set.add(id); changed = true; }
    if (changed) sessionStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
    /* sessionStorage unavailable — guest bottle view just won't unlock */
  }
}

export function isGuestBottleAllowed(id?: string): boolean {
  return !!id && read().has(id);
}

export function clearGuestAccess(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
