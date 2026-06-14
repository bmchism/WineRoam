// Light/dark theme. Token-based: dark mode overrides the CSS custom properties
// on <html data-theme="dark">, so anything using the design tokens flips
// automatically. Persisted in localStorage; defaults to the OS preference.
const KEY = "wine.theme";
export type Theme = "light" | "dark";

export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* ignore */ }
  const prefersDark = typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

export function setTheme(t: Theme) {
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  applyTheme(t);
}

// Call once at startup, before first paint, to avoid a flash.
export function initTheme() {
  applyTheme(getTheme());
}
