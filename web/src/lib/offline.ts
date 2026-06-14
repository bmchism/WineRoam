import { useEffect, useState } from "react";
import { submitRatingApi } from "./api";

// ---------------------------------------------------------------------------
// Offline-resilient write queue. Live-tasting ratings are enqueued on failure
// (offline) and flushed to AppSync when connectivity returns.
// ---------------------------------------------------------------------------

export interface QueuedWrite<T = any> {
  id: string;
  kind: "rating" | "quizAnswer";
  payload: T;
  syncedAt: string | null;
  queuedAt: string;
}

const KEY = "agave.writeQueue";

function read(): QueuedWrite[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(items: QueuedWrite[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("agave-queue"));
}

let counter = 0;
function uid() {
  counter += 1;
  return `${Date.now().toString(36)}-${counter}`;
}

export function enqueue<T>(kind: QueuedWrite["kind"], payload: T): QueuedWrite<T> {
  const item: QueuedWrite<T> = {
    id: uid(),
    kind,
    payload,
    syncedAt: null,
    queuedAt: new Date().toISOString(),
  };
  write([...read(), item as QueuedWrite]);
  if (navigator.onLine) scheduleFlush();
  return item;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 600);
}

// Send each pending item to AppSync; mark synced on success, keep on failure.
export async function flush(): Promise<void> {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    const items = read();
    for (const item of items) {
      if (item.syncedAt) continue;
      try {
        if (item.kind === "rating") await submitRatingApi(item.payload);
        item.syncedAt = new Date().toISOString();
      } catch {
        break; // stop on first failure (still offline / server down)
      }
    }
    write(items);
  } finally {
    flushing = false;
  }
}

export function pendingCount(): number {
  return read().filter((i) => !i.syncedAt).length;
}

// Flush whenever the browser comes back online.
if (typeof window !== "undefined") {
  window.addEventListener("online", scheduleFlush);
}

// Hook: live online status + pending write count for the sync banner.
export function useSyncStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pending, setPending] = useState(pendingCount());

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const q = () => setPending(pendingCount());
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("agave-queue", q);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("agave-queue", q);
    };
  }, []);

  return { online, pending };
}
