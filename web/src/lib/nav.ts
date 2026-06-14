import { useEffect } from "react";
import { useNavigate, useLocation, type NavigateFunction } from "react-router-dom";

// Logical parent for each route — keeps "back" in-app on fresh/deep loads.
export function parentOf(path: string): string {
  if (path.startsWith("/bottle/")) return "/catalog";
  if (path.startsWith("/winery/")) return "/learn/wineries";
  if (path === "/scan") return "/catalog";
  if (path === "/catalog") return "/home";
  if (path.startsWith("/learn/")) return "/learn";
  if (path === "/tastings/build") return "/tastings";
  if (path.startsWith("/flight/")) return "/tastings";
  if (path.startsWith("/taste/")) return "/tastings";
  if (path.startsWith("/host/")) return "/tastings";
  if (path === "/admin") return "/profile";
  return "/home";
}

// In-app back: pop history when we navigated here in-app (router idx > 0),
// otherwise walk to the logical parent. Never falls through to the browser.
export function appBack(nav: NavigateFunction, pathname: string) {
  const idx = (window.history.state && window.history.state.idx) || 0;
  if (idx > 0) nav(-1);
  else nav(parentOf(pathname), { replace: true });
}

const LABELS: Record<string, string> = {
  "/home": "Home",
  "/catalog": "Wines",
  "/learn": "Learn",
  "/learn/process": "Process",
  "/learn/wineries": "Wineries",
  "/tastings": "Tastings",
  "/tastings/build": "Build",
  "/profile": "Profile",
  "/admin": "Admin",
  "/scan": "Scan",
};
export function labelFor(path: string): string {
  if (LABELS[path]) return LABELS[path];
  if (path.startsWith("/bottle/")) return "Bottle";
  if (path.startsWith("/winery/")) return "Winery";
  if (path.startsWith("/learn/")) return "Article";
  if (path.startsWith("/flight/")) return "Flight";
  if (path.startsWith("/taste/")) return "Tasting";
  if (path.startsWith("/host/")) return "Host";
  return "Home";
}

export interface Crumb { to: string; label: string; last: boolean }
// Build Home › … › current by walking parents up to /home.
export function crumbTrail(pathname: string, currentLabel?: string): Crumb[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  let p = pathname;
  while (p && p !== "/home" && !seen.has(p)) {
    seen.add(p);
    chain.unshift(p);
    p = parentOf(p);
  }
  chain.unshift("/home");
  return chain.map((path, i) => ({
    to: path,
    label: i === chain.length - 1 ? currentLabel || labelFor(path) : labelFor(path),
    last: i === chain.length - 1,
  }));
}

// Swipe-from-left-edge to go back (mobile). Edge-anchored start (≤24px) so it
// doesn't fight in-page drags like the Process carousel.
export function useEdgeSwipeBack() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/join/")) return;
    let sx = 0, sy = 0, st = 0, tracking = false;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      tracking = t.clientX <= 24;
      if (tracking) { sx = t.clientX; sy = t.clientY; st = Date.now(); }
    };
    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - st;
      if (dx > 70 && Math.abs(dy) < 50 && dt < 600) appBack(nav, pathname);
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [pathname, nav]);
}
