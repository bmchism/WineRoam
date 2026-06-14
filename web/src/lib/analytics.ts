import { trackApi } from "./api";

// Anonymous product analytics. Fires a small set of named events to the backend,
// which keeps per-day totals + aggregate per-page counts (normalized route
// patterns only — no user id, IP, real ids, or per-user browsing path). Every
// user contributes (no opt-out); it never throws into the UI.

export type AnalyticsEvent =
  | "page_view"
  | "tasting_started"
  | "scan"
  | "quiz_answer"
  | "review_published"
  | "live_hosted";

export function track(event: AnalyticsEvent, path?: string) {
  // Fire-and-forget; analytics must never block or break the UI.
  trackApi(event, path).catch(() => {});
}

const STATIC_PAGES = new Set([
  "/", "/home", "/learn", "/learn/process", "/learn/wineries", "/catalog",
  "/scan", "/tastings", "/tastings/build", "/shared", "/profile", "/admin",
  "/about", "/faq", "/privacy", "/terms", "/responsible", "/contact",
]);

// Normalize a pathname to an allowlisted route pattern (ids stripped) so per-page
// view counts stay aggregate — no real ids or per-user browsing path stored.
export function pageKey(pathname: string): string {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (/^\/bottle\/[^/]+$/.test(p)) return "/bottle/:id";
  if (/^\/winery\/[^/]+$/.test(p)) return "/winery/:id";
  if (/^\/flight\/[^/]+$/.test(p)) return "/flight/:id";
  if (/^\/host\/[^/]+$/.test(p)) return "/host/:id";
  if (/^\/join\/[^/]+$/.test(p)) return "/join/:code";
  if (/^\/taste\/[^/]+\/setup$/.test(p)) return "/taste/:id/setup";
  if (/^\/taste\/[^/]+\/quiz$/.test(p)) return "/taste/:id/quiz";
  if (/^\/taste\/[^/]+\/recap$/.test(p)) return "/taste/:id/recap";
  if (/^\/taste\/[^/]+$/.test(p)) return "/taste/:id";
  if (/^\/learn\/[^/]+$/.test(p)) return "/learn/:slug";
  return STATIC_PAGES.has(p) ? p : "/other";
}
