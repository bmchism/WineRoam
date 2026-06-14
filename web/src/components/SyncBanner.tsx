import { useSyncStatus } from "../lib/offline";

// Slim status pill: shows offline state and pending writes queued for sync.
// Hidden entirely when online and fully synced.
export default function SyncBanner() {
  const { online, pending } = useSyncStatus();
  if (online && pending === 0) return null;
  return (
    <div className={`syncbanner${online ? " syncing" : " off"}`}>
      {online
        ? `Syncing ${pending} change${pending === 1 ? "" : "s"}…`
        : `Offline — ${pending} change${pending === 1 ? "" : "s"} queued, will sync`}
    </div>
  );
}
