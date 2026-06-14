import { useRegisterSW } from "virtual:pwa-register/react";

// Surfaces a "New version available — Reload" bar when a new service worker is
// waiting, and polls for updates every 60s so a long-open tab/PWA notices a
// fresh deploy quickly instead of serving the stale cached build.
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (r) setInterval(() => r.update().catch(() => {}), 60_000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="update-bar" role="alert">
      <span>🌿 A new version is available.</span>
      <button className="update-reload" onClick={() => updateServiceWorker(true)}>
        Reload
      </button>
      <button className="update-x" aria-label="Dismiss" onClick={() => setNeedRefresh(false)}>
        ×
      </button>
    </div>
  );
}
