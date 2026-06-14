import { useEffect, useState } from "react";
import AppBar from "../components/AppBar";
import { listPendingReviews, moderateReview, setReviewModerationApi, adminListUsers, adminGetUser, adminUserAction, adminAuditLog, adminListFeedback, adminPageViews, adminCosts, adminAnalytics, adminAlarms, adminAiUsage, adminTestPush, listBottles, adminPatchBottle, adminDeleteBottle, type AdminUserRow, type AdminUserDetail, type AdminUserActionName, type AuditEntry, type FeedbackEntry, type PageViewRow, type AlarmRow, type AiFeatureCost, type AdminCosts, type AnalyticsDay } from "../lib/api";
import { isApiConfigured } from "../lib/config";

import { SkeletonList } from "../components/Skeleton";
import CountUp from "../components/CountUp";
import { useToast } from "../components/Toast";
import type { Review, Bottle } from "../types";

const usd = (n: number) => `$${(n ?? 0).toFixed(2)}`;
const tok = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n || 0));
const shortModel = (m: string) => m.replace(/^claude-/, "").replace(/-\d{8}$/, "");
// What app features drive each model's usage (see functions/src/lib/anthropic.ts).
function modelDrivers(model: string): string {
  const m = model.toLowerCase();
  if (m.includes("haiku")) return "Bottle label enrichment (tier 1) · review moderation · catalog pre-warm";
  if (m.includes("sonnet")) return "Wine assistant chat · post-tasting quiz generation";
  if (m.includes("opus")) return "Complex bottle enrichment (escalation when Haiku/Sonnet fall short)";
  return "Mixed app usage";
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Flag days whose AWS spend is a clear outlier vs the rest of the month.
// Returns the spiking days (amount > 2× the mean of the others, and > $0.50).
function costSpikes(daily: { name: string; amount: number }[]): { name: string; amount: number; mult: number }[] {
  if (daily.length < 4) return [];
  return daily
    .map((d) => {
      const others = daily.filter((x) => x.name !== d.name);
      const mean = others.reduce((s, x) => s + x.amount, 0) / Math.max(1, others.length);
      return { name: d.name, amount: d.amount, mult: mean > 0 ? d.amount / mean : 0 };
    })
    .filter((d) => d.amount > 0.5 && d.mult >= 2)
    .sort((a, b) => b.amount - a.amount);
}

type Tab = "costs" | "alarms" | "moderation" | "bottles" | "users" | "usage" | "audit" | "feedback" | "pages" | "architecture";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("costs");
  return (
    <>
      <AppBar title="Admin" back />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">Owner console</span>
          <h1>Admin Dashboard</h1>
          <p>Live AWS + Anthropic spend, Cognito users, and anonymous usage — admins only.</p>
        </div>

        <div className="chips wrap" style={{ marginTop: 14 }}>
          {(["costs", "alarms", "moderation", "bottles", "users", "usage", "audit", "feedback", "pages", "architecture"] as const).map((t) => (
            <button key={t} className={`chip tap${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "costs" && <CostsPanel />}
        {tab === "alarms" && <AlarmsPanel />}
        {tab === "moderation" && <ModerationPanel />}
        {tab === "bottles" && <BottlesPanel />}
        {tab === "users" && <UsersPanel />}
        {tab === "usage" && <UsagePanel />}
        {tab === "audit" && <AuditPanel />}
        {tab === "feedback" && <FeedbackPanel />}
        {tab === "pages" && <PagesPanel />}
        {tab === "architecture" && <ArchitecturePanel />}
      </main>
    </>
  );
}

function CostsPanel() {
  const [costs, setCosts] = useState<AdminCosts | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = (refresh = false) => {
    if (!isApiConfigured) return setErr("Costs need the live API.");
    setBusy(true);
    setErr("");
    adminCosts(refresh)
      .then(setCosts)
      .catch((e) => setErr(e.message?.includes("admins") ? "You're not in the admins group." : "Couldn't load costs."))
      .finally(() => setBusy(false));
  };
  useEffect(() => load(false), []);
  const [feat, setFeat] = useState<AiFeatureCost[]>([]);
  useEffect(() => { adminAiUsage(30).then(setFeat).catch(() => {}); }, []);

  if (!costs) {
    return err
      ? <div className="muted" style={{ padding: "24px 4px" }}>{err}</div>
      : <div style={{ marginTop: 8 }}><SkeletonList rows={5} /></div>;
  }

  const spent = Math.round((costs.awsMonth + costs.anthropicMonth) * 100) / 100;
  const pct = costs.budget ? Math.round((spent / costs.budget) * 100) : 0;
  const svcMax = Math.max(1, ...costs.awsByService.map((s) => s.amount));
  const dayMax = Math.max(1, ...costs.awsDaily.map((d) => d.amount));
  const modelMax = Math.max(0.0001, ...costs.anthropicByModel.map((m) => m.cost));
  const spikes = costSpikes(costs.awsDaily);

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ...costs.awsByService.map((s) => ["aws", s.name, s.amount]),
      ...costs.anthropicByModel.map((m) => ["anthropic", m.model, m.cost]),
    ];
    downloadCsv(`costs-${costs.asOf.slice(0, 10)}.csv`, ["source", "name", "amount_usd"], rows);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "6px 2px 2px" }}>
        <span className="muted" style={{ fontSize: 12.5 }}>
          {costs.cached ? "Cached" : "Fresh"} · as of {new Date(costs.asOf).toLocaleString()}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" style={{ marginLeft: 0, padding: "6px 12px", fontSize: 13 }} onClick={exportCsv}>⬇ CSV</button>
          <button className="btn ghost" style={{ marginLeft: 0, padding: "6px 12px", fontSize: 13 }} disabled={busy} onClick={() => load(true)}>
            {busy ? "…" : "↻ Refresh"}
          </button>
        </div>
      </div>
      {err && <div style={{ color: "#b23b2c", fontSize: 13, margin: "0 2px 6px" }}>{err}</div>}

      {spikes.length > 0 && (
        <div className="card" style={{ marginTop: 4, background: "#fdeede", border: "1px solid var(--amber)" }}>
          <div style={{ fontWeight: 600, color: "var(--amber)", fontSize: 14 }}>⚠ AWS cost spike</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
            {spikes.slice(0, 3).map((s) => `${s.name.slice(5)}: ${usd(s.amount)} (${s.mult.toFixed(1)}× avg)`).join(" · ")}
          </div>
        </div>
      )}

      <div className="kpi-row">
        <div className="kpi"><div className="kpi-l">AWS · MTD</div><div className="kpi-n"><CountUp value={costs.awsMonth} decimals={2} prefix="$" /></div></div>
        <div className="kpi"><div className="kpi-l">Anthropic · org (shared)</div><div className="kpi-n"><CountUp value={costs.anthropicMonth} decimals={2} prefix="$" /></div></div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="rate-head">
          <span className="rate-label">Budget used</span>
          <span className="rate-val">{usd(spent)} / ${costs.budget}</span>
        </div>
        <span className="bar-track" style={{ marginTop: 8 }}>
          <span className="bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: pct > 80 ? "var(--amber)" : "var(--agave)" }} />
        </span>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>{pct}% of monthly budget</div>
      </div>

      <div className="section-head"><span className="kicker">Cost Explorer</span><h2>AWS by service</h2></div>
      <div className="card stack">
        {costs.awsByService.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>No AWS spend recorded yet this month.</div>
        ) : (
          costs.awsByService.map((s) => (
            <div key={s.name} className="bar-row">
              <span className="bar-name" style={{ fontSize: 12.5 }}>{s.name.replace(/^Amazon |^AWS /, "")}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${(s.amount / svcMax) * 100}%`, background: "var(--agave)" }} /></span>
              <span className="bar-score">{usd(s.amount)}</span>
            </div>
          ))
        )}
      </div>

      <div className="section-head"><span className="kicker">This app · usage report × price map</span><h2>Anthropic by model</h2></div>
      <div className="list">
        {costs.anthropicByModel.length === 0 ? (
          <div className="card muted" style={{ fontSize: 14 }}>No Anthropic usage (or admin key not set).</div>
        ) : (
          costs.anthropicByModel.map((m) => (
            <div key={m.model} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 600 }}>{shortModel(m.model)}</span>
                <span className="bar-score">{usd(m.cost)}</span>
              </div>
              <span className="bar-track" style={{ marginTop: 8 }}>
                <span className="bar-fill" style={{ width: `${(m.cost / modelMax) * 100}%`, background: "var(--gold)" }} />
              </span>
              <div className="muted" style={{ fontSize: 12, marginTop: 8, display: "flex", flexWrap: "wrap", gap: 10 }}>
                <span>in {tok(m.inputTokens)}</span>
                <span>out {tok(m.outputTokens)}</span>
                <span>cache‑r {tok(m.cacheReadTokens)}</span>
                <span>cache‑w {tok(m.cacheWriteTokens)}</span>
              </div>
              <div style={{ fontSize: 12, marginTop: 8, color: "var(--ink-soft)" }}>
                <span style={{ color: "var(--muted)" }}>Drives: </span>{modelDrivers(m.model)}
              </div>
            </div>
          ))
        )}
      </div>
      <p className="muted" style={{ fontSize: 12, margin: "8px 2px 0" }}>
        This app (Messages API, tokens × list price): {usd(costs.anthropicEstimate)}.
        The “Anthropic · org” KPI ({usd(costs.anthropicMonth)}) is the whole shared
        Anthropic account — all projects + Claude Code, incl. web search — not just
        this app. The two won’t match by design.
      </p>

      {feat.length > 0 && (
        <>
          <div className="section-head"><span className="kicker">Last 30 days · measured</span><h2>Anthropic by feature</h2></div>
          <div className="card stack">
            {(() => {
              const max = Math.max(0.0001, ...feat.map((f) => f.cost));
              return feat.map((f) => (
                <div key={`${f.feature}#${f.model}`} className="bar-row">
                  <span className="bar-name" style={{ fontSize: 12.5 }}>{f.feature} · {f.model}</span>
                  <span className="bar-track"><span className="bar-fill" style={{ width: `${(f.cost / max) * 100}%`, background: "var(--amber)" }} /></span>
                  <span className="bar-score">{usd(f.cost)}</span>
                </div>
              ));
            })()}
          </div>
          <p className="muted" style={{ fontSize: 12, margin: "8px 2px 0" }}>Actual token usage logged per Lambda (enrich/chat/quiz/moderate/prewarm) × list price.</p>
        </>
      )}

      <div className="section-head"><span className="kicker">Daily</span><h2>AWS this month</h2></div>
      <div className="card stack">
        {costs.awsDaily.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>No daily data.</div>
        ) : (
          costs.awsDaily.map((d) => (
            <div key={d.name} className="bar-row">
              <span className="bar-name" style={{ fontSize: 12.5 }}>{d.name.slice(5)}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${(d.amount / dayMax) * 100}%`, background: "var(--agave)" }} /></span>
              <span className="bar-score">{usd(d.amount)}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

const EVENTS = [
  { key: "pageView", label: "Page views" },
  { key: "tastingStarted", label: "Tastings" },
  { key: "scan", label: "Scans" },
  { key: "quizAnswer", label: "Quiz answers" },
  { key: "reviewPublished", label: "Reviews" },
  { key: "liveHosted", label: "Live hosted" },
] as const;
type EventKey = (typeof EVENTS)[number]["key"];

function UsagePanel() {
  const [days, setDays] = useState<AnalyticsDay[] | null>(null);
  const [range, setRange] = useState(14);
  const [metric, setMetric] = useState<EventKey>("pageView");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isApiConfigured) return setDays([]);
    setDays(null);
    adminAnalytics(range)
      .then(setDays)
      .catch((e) => {
        setDays([]);
        setErr(e.message?.includes("authorized") || e.message?.includes("admins") ? "You're not in the admins group." : "Couldn't load usage.");
      });
  }, [range]);

  const totals = (days ?? []).reduce(
    (t, d) => {
      for (const e of EVENTS) t[e.key] += d[e.key];
      return t;
    },
    { pageView: 0, tastingStarted: 0, scan: 0, quizAnswer: 0, reviewPublished: 0, liveHosted: 0 } as Record<EventKey, number>
  );

  if (days === null) return <div style={{ marginTop: 8 }}><SkeletonList rows={4} /></div>;

  const chart = [...days].sort((a, b) => a.day.localeCompare(b.day));
  const max = Math.max(1, ...chart.map((x) => x[metric]));

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 2px 10px", gap: 8 }}>
        <span className="muted" style={{ fontSize: 12.5 }}>Anonymous per‑day totals — no personal data.</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="chips">
            {[7, 14, 30].map((r) => (
              <button key={r} className={`chip tap${range === r ? " active" : ""}`} style={{ padding: "4px 10px", fontSize: 12.5 }} onClick={() => setRange(r)}>{r}d</button>
            ))}
          </div>
          <button
            className="btn ghost"
            style={{ marginLeft: 0, padding: "4px 10px", fontSize: 12.5 }}
            onClick={() =>
              downloadCsv(
                `usage-${range}d.csv`,
                ["day", ...EVENTS.map((e) => e.key)],
                chart.map((d) => [d.day, ...EVENTS.map((e) => d[e.key])])
              )
            }
          >⬇ CSV</button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi"><div className="kpi-l">Page views</div><div className="kpi-n"><CountUp value={totals.pageView} /></div></div>
        <div className="kpi"><div className="kpi-l">Tastings started</div><div className="kpi-n"><CountUp value={totals.tastingStarted} /></div></div>
      </div>
      <div className="kpi-row" style={{ marginTop: 12 }}>
        <div className="kpi"><div className="kpi-l">Scans</div><div className="kpi-n"><CountUp value={totals.scan} /></div></div>
        <div className="kpi"><div className="kpi-l">Live tastings hosted</div><div className="kpi-n"><CountUp value={totals.liveHosted} /></div></div>
      </div>
      <div className="kpi-row" style={{ marginTop: 12 }}>
        <div className="kpi"><div className="kpi-l">Quiz answers</div><div className="kpi-n"><CountUp value={totals.quizAnswer} /></div></div>
        <div className="kpi"><div className="kpi-l">Reviews published</div><div className="kpi-n"><CountUp value={totals.reviewPublished} /></div></div>
      </div>

      <div className="section-head"><span className="kicker">By day</span><h2>{EVENTS.find((e) => e.key === metric)!.label}</h2></div>
      <div className="chips wrap" style={{ marginBottom: 10 }}>
        {EVENTS.map((e) => (
          <button key={e.key} className={`chip tap${metric === e.key ? " active" : ""}`} style={{ padding: "4px 10px", fontSize: 12.5 }} onClick={() => setMetric(e.key)}>{e.label}</button>
        ))}
      </div>
      <div className="card stack">
        {chart.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>{err || "No activity recorded yet."}</div>
        ) : (
          chart.map((d) => (
            <div key={d.day} className="bar-row">
              <span className="bar-name" style={{ fontSize: 12.5 }}>{d.day.slice(5)}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${(d[metric] / max) * 100}%`, background: "var(--agave)" }} /></span>
              <span className="bar-score">{d[metric]}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [open, setOpen] = useState("");
  const [detail, setDetail] = useState<Record<string, AdminUserDetail>>({});

  const load = (search?: string, token?: string) => {
    if (!isApiConfigured) return setUsers([]);
    setErr("");
    adminListUsers(search, token)
      .then((page) => {
        setUsers((prev) => (token && prev ? [...prev, ...page.users] : page.users));
        setNextToken(page.nextToken);
      })
      .catch((e) => {
        if (!token) setUsers([]);
        setErr(e.message?.includes("authorized") ? "You're not in the admins group — see the note below." : "Couldn't load users.");
      });
  };
  useEffect(() => load(), []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers(null);
    setNextToken(null);
    load(q.trim() || undefined);
  };

  const patch = (username: string, fields: Partial<AdminUserRow>) =>
    setUsers((p) => (p ? p.map((x) => (x.username === username ? { ...x, ...fields } : x)) : p));

  const expand = async (u: AdminUserRow) => {
    if (open === u.username) return setOpen("");
    setOpen(u.username);
    if (!detail[u.username] && isApiConfigured) {
      try {
        const d = await adminGetUser(u.username);
        setDetail((m) => ({ ...m, [u.username]: d }));
      } catch { /* leave summary only */ }
    }
  };

  const toast = useToast();
  const act = async (u: AdminUserRow, action: AdminUserActionName, value?: string) => {
    setBusy(u.username);
    setErr("");
    try {
      await adminUserAction(u.username, action, value);
      if (action === "deleteUser") setUsers((p) => (p ? p.filter((x) => x.username !== u.username) : p));
      else if (action === "disableUser") patch(u.username, { enabled: false });
      else if (action === "enableUser") patch(u.username, { enabled: true });
      else if (action === "addAdmin") patch(u.username, { isAdmin: true });
      else if (action === "removeAdmin") patch(u.username, { isAdmin: false });
      setDetail((m) => { const n = { ...m }; delete n[u.username]; return n; });
      toast.show(`${ACTION_LABEL[action] ?? action} ✓`, "ok");
    } catch (e) {
      setErr((e as Error).message);
      toast.show((e as Error).message, "err");
    } finally {
      setBusy("");
    }
  };

  const confirmAct = (u: AdminUserRow, action: AdminUserActionName, msg: string) => {
    if (window.confirm(msg)) act(u, action);
  };
  const tempPw = (u: AdminUserRow) => {
    const v = window.prompt(`Temporary password for ${u.email || u.username} (≥10 chars, upper/lower/digit):`);
    if (v) act(u, "setTempPassword", v);
  };

  if (users === null) return <div style={{ marginTop: 8 }}><SkeletonList rows={5} /></div>;

  return (
    <>
      <div className="section-head"><span className="kicker">Cognito</span><h2>Users</h2></div>
      <form onSubmit={search} style={{ display: "flex", gap: 8 }}>
        <input className="field" placeholder="Search by email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
        <button className="btn ghost" type="submit" style={{ marginLeft: 0, padding: "0 16px" }}>Search</button>
      </form>
      {err && <div style={{ color: "#b23b2c", fontSize: 13.5, margin: "8px 2px 0" }}>{err}</div>}

      <div className="list" style={{ marginTop: 10 }}>
        {users.length === 0 && <div className="card muted" style={{ fontSize: 14 }}>No users found.</div>}
        {users.map((u) => {
          const d = detail[u.username];
          const isOpen = open === u.username;
          const dis = busy === u.username;
          return (
            <div key={u.username} className="card">
              <div onClick={() => expand(u)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{u.email || u.username}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {u.status}{u.enabled ? "" : " · disabled"}{u.emailVerified ? " · ✓ email" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  {u.isAdmin && <span className="badge" style={{ background: "#e9f0e4", color: "var(--agave-deep)" }}>admin</span>}
                  <span className="muted" style={{ fontSize: 13 }}>{isOpen ? "▴" : "▾"}</span>
                </div>
              </div>

              {isOpen && (
                <>
                  <div className="muted" style={{ fontSize: 12, marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                    <span>Created {u.createdAt ? u.createdAt.slice(0, 10) : "—"}</span>
                    <span>Modified {(u.lastModified ?? "").slice(0, 10) || "—"}</span>
                    <span>MFA {d ? (d.mfaEnabled ? `on (${d.preferredMfa || "TOTP"})` : "off") : "…"}</span>
                    <span>Email {u.emailVerified ? "verified" : "unverified"}</span>
                    <span>Last login {d ? (d.lastLogin ? new Date(d.lastLogin).toLocaleString() : "never") : "…"}</span>
                    <span>Logins {d ? (d.loginCount ?? 0) : "…"}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Last login is tracked from sign‑in going forward (PostAuthentication trigger); pre‑existing users show “never” until their next sign‑in.</div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                    <button className="btn ghost" style={btn} disabled={dis} onClick={() => act(u, "resetPassword")}>Reset pw</button>
                    <button className="btn ghost" style={btn} disabled={dis} onClick={() => tempPw(u)}>Temp pw</button>
                    <button className="btn ghost" style={btn} disabled={dis} onClick={() => act(u, "resendInvite")}>Resend invite</button>
                    {u.enabled
                      ? <button className="btn ghost" style={btn} disabled={dis} onClick={() => act(u, "disableUser")}>Disable</button>
                      : <button className="btn ghost" style={btn} disabled={dis} onClick={() => act(u, "enableUser")}>Enable</button>}
                    {u.isAdmin
                      ? <button className="btn ghost" style={btn} disabled={dis} onClick={() => confirmAct(u, "removeAdmin", `Remove ${u.email || u.username} from admins?`)}>Remove admin</button>
                      : <button className="btn ghost" style={btn} disabled={dis} onClick={() => confirmAct(u, "addAdmin", `Make ${u.email || u.username} an admin?`)}>Make admin</button>}
                    <button className="btn ghost" style={{ ...btn, color: "#a3392f" }} disabled={dis} onClick={() => confirmAct(u, "deleteUser", `Delete ${u.email || u.username}? This can't be undone.`)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {nextToken && (
        <button className="btn ghost" style={{ marginTop: 12, width: "100%", padding: 12 }} onClick={() => load(q.trim() || undefined, nextToken)}>
          Load more
        </button>
      )}
      <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>
        Admin actions require the Cognito “admins” group; every change is written to the audit log.
      </p>
    </>
  );
}

const btn: React.CSSProperties = { marginLeft: 0, padding: "8px 12px", fontSize: 13 };

const ALARM_COLOR = (s: string) => (s === "ALARM" ? "#b23b2c" : s === "OK" ? "var(--agave)" : "var(--amber)");
const ALARM_LABEL = (s: string) => (s === "ALARM" ? "In alarm" : s === "OK" ? "OK" : "No data");

function AlarmsPanel() {
  const [rows, setRows] = useState<AlarmRow[] | null>(null);
  const [err, setErr] = useState("");
  const toast = useToast();
  const testPush = async () => {
    try {
      const ok = await adminTestPush();
      toast.show(ok ? "Test push sent — check your notifications" : "No push subscriptions for your account (enable in Profile)", ok ? "ok" : "err");
    } catch (e) {
      toast.show((e as Error).message, "err");
    }
  };
  const load = () => {
    if (!isApiConfigured) return setRows([]);
    setRows(null);
    setErr("");
    adminAlarms()
      .then(setRows)
      .catch((e) => {
        setRows([]);
        setErr(e.message?.includes("admins") ? "You're not in the admins group." : "Couldn't load alarms.");
      });
  };
  useEffect(load, []);

  if (rows === null) return <div style={{ marginTop: 8 }}><SkeletonList rows={4} /></div>;
  const inAlarm = rows.filter((r) => r.state === "ALARM").length;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 2px 2px" }}>
        <span className="muted" style={{ fontSize: 12.5 }}>{rows.length} CloudWatch alarm{rows.length === 1 ? "" : "s"} · {inAlarm} in alarm</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" style={{ marginLeft: 0, padding: "6px 12px", fontSize: 13 }} onClick={testPush}>🔔 Test push</button>
          <button className="btn ghost" style={{ marginLeft: 0, padding: "6px 12px", fontSize: 13 }} onClick={load}>↻ Refresh</button>
        </div>
      </div>
      {err && <div style={{ color: "#b23b2c", fontSize: 13, margin: "0 2px 6px" }}>{err}</div>}
      <div className="card stack">
        {rows.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>{err || "No CloudWatch alarms configured."}</div>
        ) : (
          rows.map((a) => (
            <div key={a.name} className="alarm">
              <span className="alarm-dot" style={{ background: ALARM_COLOR(a.state) }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{a.metric}{a.reason ? ` · ${a.reason}` : ""}</div>
              </div>
              <span style={{ fontSize: 12.5, color: ALARM_COLOR(a.state), fontWeight: 600, flexShrink: 0 }}>{ALARM_LABEL(a.state)}</span>
            </div>
          ))
        )}
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Live from CloudWatch DescribeAlarms — Lambda errors, DynamoDB throttles, AppSync 5xx, and the monthly budget.</p>
    </>
  );
}

const DESTRUCTIVE = new Set(["deleteUser", "removeAdmin", "disableUser"]);
const ACTION_LABEL: Record<string, string> = {
  resetPassword: "reset password",
  setTempPassword: "set temp password",
  resendInvite: "resend invite",
  disableUser: "disable",
  enableUser: "enable",
  addAdmin: "grant admin",
  removeAdmin: "revoke admin",
  deleteUser: "delete user",
};

function AuditPanel() {
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  const [err, setErr] = useState("");

  const load = () => {
    if (!isApiConfigured) return setRows([]);
    setRows(null);
    setErr("");
    adminAuditLog(200)
      .then(setRows)
      .catch((e) => {
        setRows([]);
        setErr(e.message?.includes("authorized") || e.message?.includes("admins") ? "You're not in the admins group." : "Couldn't load the audit log.");
      });
  };
  useEffect(load, []);

  if (rows === null) return <div style={{ marginTop: 8 }}><SkeletonList rows={5} /></div>;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "6px 2px 2px" }}>
        <span className="muted" style={{ fontSize: 12.5 }}>Admin actions, newest first ({rows.length})</span>
        <button className="btn ghost" style={{ marginLeft: 0, padding: "6px 12px", fontSize: 13 }} onClick={load}>↻ Refresh</button>
      </div>
      {err && <div style={{ color: "#b23b2c", fontSize: 13, margin: "0 2px 6px" }}>{err}</div>}
      <div className="list" style={{ marginTop: 8 }}>
        {rows.length === 0 ? (
          <div className="card muted" style={{ fontSize: 14 }}>{err || "No admin actions recorded yet."}</div>
        ) : (
          rows.map((r, i) => {
            const danger = DESTRUCTIVE.has(r.action);
            return (
              <div key={`${r.at}-${i}`} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span className="badge" style={{ background: danger ? "#fcefec" : "#e9f0e4", color: danger ? "#b23b2c" : "var(--agave-deep)" }}>
                    {ACTION_LABEL[r.action] ?? r.action}
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>{new Date(r.at).toLocaleString()}</span>
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                  <span style={{ wordBreak: "break-all" }}>target {r.target}</span>
                  <span> · by {r.actor}</span>
                  {r.detail ? <span> · {r.detail}</span> : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

const FB_COLOR: Record<string, { bg: string; fg: string }> = {
  Bug: { bg: "#fcefec", fg: "#b23b2c" },
  Idea: { bg: "#e9f0e4", fg: "var(--agave-deep)" },
  Praise: { bg: "#fdf2e3", fg: "var(--amber)" },
  Other: { bg: "#eee", fg: "var(--ink-soft)" },
};

function FeedbackPanel() {
  const [rows, setRows] = useState<FeedbackEntry[] | null>(null);
  const [err, setErr] = useState("");

  const load = () => {
    if (!isApiConfigured) return setRows([]);
    setRows(null);
    setErr("");
    adminListFeedback(200)
      .then(setRows)
      .catch((e) => {
        setRows([]);
        setErr(e.message?.includes("authorized") || e.message?.includes("admins") ? "You're not in the admins group." : "Couldn't load feedback.");
      });
  };
  useEffect(load, []);

  if (rows === null) return <div style={{ marginTop: 8 }}><SkeletonList rows={5} /></div>;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "6px 2px 2px" }}>
        <span className="muted" style={{ fontSize: 12.5 }}>User feedback, newest first ({rows.length})</span>
        <button className="btn ghost" style={{ marginLeft: 0, padding: "6px 12px", fontSize: 13 }} onClick={load}>↻ Refresh</button>
      </div>
      {err && <div style={{ color: "#b23b2c", fontSize: 13, margin: "0 2px 6px" }}>{err}</div>}
      <div className="list" style={{ marginTop: 8 }}>
        {rows.length === 0 ? (
          <div className="card muted" style={{ fontSize: 14 }}>{err || "No feedback yet."}</div>
        ) : (
          rows.map((r) => {
            const c = FB_COLOR[r.category] ?? FB_COLOR.Other;
            return (
              <div key={r.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span className="badge" style={{ background: c.bg, color: c.fg }}>{r.category}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{new Date(r.at).toLocaleString()}</span>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{r.message}</p>
                <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  {r.email ? <a className="linklike" style={{ display: "inline" }} href={`mailto:${r.email}`}>{r.email}</a> : <span>no email</span>}
                  {r.path ? <span> · {r.path}</span> : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Landing / Marketing", "/home": "Home", "/catalog": "Catalog", "/bottle/:id": "Bottle detail",
  "/scan": "Scan", "/learn": "Learn", "/learn/process": "How it's made", "/learn/wineries": "Wineries",
  "/learn/:slug": "Learn article", "/winery/:id": "Winery detail", "/tastings": "Tastings",
  "/tastings/build": "Flight builder", "/flight/:id": "Flight detail", "/taste/:id/setup": "Tasting setup",
  "/taste/:id": "Tasting runner", "/taste/:id/quiz": "Tasting quiz", "/taste/:id/recap": "Tasting recap",
  "/host/:id": "Live host", "/join/:code": "Guest join", "/shared": "Shared flight", "/profile": "Profile",
  "/admin": "Admin", "/about": "About", "/faq": "FAQ", "/privacy": "Privacy", "/terms": "Terms",
  "/responsible": "Responsible Drinking", "/contact": "Contact", "/other": "Other",
};

function PagesPanel() {
  const [rows, setRows] = useState<PageViewRow[] | null>(null);
  const [err, setErr] = useState("");

  const load = () => {
    if (!isApiConfigured) return setRows([]);
    setRows(null);
    setErr("");
    adminPageViews()
      .then(setRows)
      .catch((e) => {
        setRows([]);
        setErr(e.message?.includes("authorized") || e.message?.includes("admins") ? "You're not in the admins group." : "Couldn't load page views.");
      });
  };
  useEffect(load, []);

  if (rows === null) return <div style={{ marginTop: 8 }}><SkeletonList rows={6} /></div>;
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "6px 2px 2px" }}>
        <span className="muted" style={{ fontSize: 12.5 }}>Views per page, all-time ({total.toLocaleString()} total)</span>
        <button className="btn ghost" style={{ marginLeft: 0, padding: "6px 12px", fontSize: 13 }} onClick={load}>↻ Refresh</button>
      </div>
      {err && <div style={{ color: "#b23b2c", fontSize: 13, margin: "0 2px 6px" }}>{err}</div>}
      {rows.length === 0 ? (
        <div className="card muted" style={{ fontSize: 14, marginTop: 8 }}>{err || "No page views recorded yet."}</div>
      ) : (
        <div className="card stack" style={{ marginTop: 8 }}>
          {rows.map((r) => (
            <div key={r.page} className="bar-row">
              <span className="bar-name" style={{ fontSize: 12.5 }}>{PAGE_LABELS[r.page] ?? r.page}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${(r.count / max) * 100}%`, background: "var(--agave)" }} /></span>
              <span className="bar-score">{r.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: "8px 2px 0" }}>
        Anonymous aggregate counts by route pattern (ids stripped) — no per-user browsing path is stored.
      </p>
    </>
  );
}

const ARCH: { layer: string; color: string; nodes: string[] }[] = [
  { layer: "Client", color: "#6f9450", nodes: ["React + Vite PWA", "Service worker (offline + web push)", "Framer Motion UI"] },
  { layer: "Edge / Delivery", color: "#5E8C7D", nodes: ["CloudFront CDN", "WAF", "S3 site bucket", "Route 53 + ACM cert"] },
  { layer: "API", color: "#c2742a", nodes: ["AppSync GraphQL", "API key — public + guest tastings", "Cognito userPool — account + admin"] },
  { layer: "Auth", color: "#a66a33", nodes: ["Cognito user pool", "Google IdP + Hosted UI", "admins group"] },
  { layer: "Compute · Lambda", color: "#8A6D3B", nodes: ["api", "adminApi", "costApi", "chat", "enrich", "recognize", "quizGenerate", "moderate", "reminderSweep", "invite", "authEvents", "prewarm"] },
  { layer: "Orchestration", color: "#c2603f", nodes: ["Step Functions — scan pipeline", "EventBridge — reminder cron"] },
  { layer: "Data", color: "#9c5bb0", nodes: ["DynamoDB single-table (+ GSI1)", "S3 uploads bucket"] },
  { layer: "AI", color: "#6C5BB9", nodes: ["Anthropic — Haiku → Sonnet → Opus", "workspace-scoped key + cost attribution"] },
  { layer: "Integrations & Ops", color: "#5f7d8a", nodes: ["Resend (email)", "Twilio (SMS)", "Web Push (VAPID)", "Secrets Manager", "CloudWatch alarms + Budgets"] },
];

const FLOWS: string[] = [
  "Bottle scan: photo → S3 → Step Functions → recognize (Claude vision) → enrich → DynamoDB cache → client polls result.",
  "Live tasting: host starts a session (API key) → guests join by QR → ratings + quiz answers stream via AppSync subscriptions → leaderboard.",
  "Auth: email/password (SRP) or Google (Hosted-UI OAuth) → Cognito → AppSync userPool authZ for account + admin calls.",
  "Reminders: EventBridge cron → reminderSweep → email (Resend) / SMS (Twilio) / web push (VAPID).",
  "Everything is CDK-defined, single AWS account (us-east-1), deployed via cdk deploy + an S3/CloudFront web sync.",
];

function ArchitecturePanel() {
  return (
    <>
      <div className="muted" style={{ fontSize: 12.5, margin: "6px 2px 10px" }}>
        Serverless on AWS, single account (us-east-1) · infrastructure as code (CDK).
      </div>
      <div className="arch">
        {ARCH.map((band, i) => (
          <div key={band.layer}>
            <div className="arch-band" style={{ borderColor: band.color }}>
              <span className="arch-layer" style={{ background: band.color }}>{band.layer}</span>
              <div className="arch-nodes">
                {band.nodes.map((n) => (
                  <span key={n} className="arch-node" style={{ borderColor: band.color }}>{n}</span>
                ))}
              </div>
            </div>
            {i < ARCH.length - 1 && <div className="arch-arrow" aria-hidden>↓</div>}
          </div>
        ))}
      </div>

      <div className="section-head"><span className="kicker">How it fits together</span><h2>Key flows</h2></div>
      <ul className="info-list">
        {FLOWS.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
    </>
  );
}

function BottlesPanel() {
  const [all, setAll] = useState<Bottle[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    listBottles().then(({ bottles }) => setAll(bottles)).catch(() => setAll([]));
  }, []);

  const patch = async (b: Bottle, p: Parameters<typeof adminPatchBottle>[1]) => {
    setBusy(b.id);
    try {
      await adminPatchBottle(b.id, p);
      setAll((prev) => (prev ? prev.map((x) => (x.id === b.id ? ({ ...x, ...p, ...(p.abv ? { proof: p.abv * 2 } : {}) } as Bottle) : x)) : prev));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy("");
    }
  };
  const del = async (b: Bottle) => {
    if (!window.confirm(`Delete ${b.name}?`)) return;
    setBusy(b.id);
    try {
      await adminDeleteBottle(b.id);
      setAll((prev) => (prev ? prev.filter((x) => x.id !== b.id) : prev));
    } finally {
      setBusy("");
    }
  };

  if (all === null) return <div style={{ marginTop: 8 }}><SkeletonList rows={6} /></div>;
  const needle = q.trim().toLowerCase();
  const list = all
    .filter((b) => !needle || `${b.name} ${b.wineryId}`.toLowerCase().includes(needle))
    .sort((a, b) => Number(a.verified ?? false) - Number(b.verified ?? false))
    .slice(0, 60);
  const pending = all.filter((b) => !b.verified).length;

  return (
    <>
      <div className="section-head"><span className="kicker">Data quality</span><h2>Bottles · {pending} to review</h2></div>
      <input className="field" placeholder="Search bottles…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="list" style={{ marginTop: 10 }}>
        {list.map((b) => (
          <div className="card" key={b.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontWeight: 600 }}>{b.name}</span>
              <span className="badge" style={b.verified ? { background: "#e9f0e4", color: "var(--agave-deep)" } : { background: "#fdeede", color: "var(--amber)" }}>{b.verified ? "verified" : "pending"}</span>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{b.wineType} · {b.producer} · {b.abv}%{b.organic ? " · 🍇" : ""}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              <button className="btn ghost" style={{ marginLeft: 0, padding: "8px 12px", fontSize: 13 }} disabled={busy === b.id} onClick={() => patch(b, { verified: !b.verified })}>{b.verified ? "Unverify" : "Verify ✓"}</button>
              <button className="btn ghost" style={{ marginLeft: 0, padding: "8px 12px", fontSize: 13 }} disabled={busy === b.id} onClick={() => { const v = window.prompt("Winery ID:", b.wineryId); if (v) patch(b, { nom: v }); }}>Winery</button>
              <button className="btn ghost" style={{ marginLeft: 0, padding: "8px 12px", fontSize: 13 }} disabled={busy === b.id} onClick={() => { const v = window.prompt("ABV %:", String(b.abv)); if (v && !isNaN(+v)) patch(b, { abv: +v }); }}>ABV</button>
              <button className="btn ghost" style={{ marginLeft: 0, padding: "8px 12px", fontSize: 13 }} disabled={busy === b.id} onClick={() => patch(b, { additiveFree: !b.organic })}>🍇 {b.organic ? "off" : "on"}</button>
              <button className="btn ghost" style={{ marginLeft: 0, padding: "8px 12px", fontSize: 13, color: "#a3392f" }} disabled={busy === b.id} onClick={() => del(b)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {all.length > 60 && !needle && <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Showing 60 (unverified first) — search to find more.</p>}
    </>
  );
}

function ModerationPanel() {
  const [items, setItems] = useState<Review[] | null>(null);
  const [ai, setAi] = useState<Record<string, { verdict: string; reason: string }>>({});
  const [busy, setBusy] = useState("");

  const refresh = () => {
    if (!isApiConfigured) return setItems([]);
    listPendingReviews().then(setItems).catch(() => setItems([]));
  };
  useEffect(refresh, []);

  const key = (r: Review) => `${r.bottleId}#${r.userId}`;
  const check = async (r: Review) => {
    setBusy(key(r));
    try {
      const res = await moderateReview(r.bottleId, r.userId);
      setAi((m) => ({ ...m, [key(r)]: res }));
    } finally {
      setBusy("");
    }
  };
  const decide = async (r: Review, decision: "approve" | "block") => {
    setBusy(key(r));
    try {
      await setReviewModerationApi(r.bottleId, r.userId, decision);
      setItems((prev) => (prev ? prev.filter((x) => key(x) !== key(r)) : prev));
    } finally {
      setBusy("");
    }
  };

  if (items === null) return <div style={{ marginTop: 8 }}><SkeletonList rows={4} /></div>;
  if (!isApiConfigured) return <div className="muted" style={{ padding: "24px 4px" }}>Moderation needs the live API.</div>;

  return (
    <>
      <div className="section-head"><span className="kicker">Human in the loop</span><h2>Review Queue ({items.length})</h2></div>
      {items.length === 0 && <div className="muted" style={{ padding: "16px 2px" }}>Nothing waiting — all clear. 🌿</div>}
      <div className="list">
        {items.map((r) => {
          const a = ai[key(r)];
          const flagged = a?.verdict === "flag";
          return (
            <div className="card" key={key(r)}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>{r.displayName}</span>
                <span className="bar-score">{r.score ?? "—"}/10</span>
              </div>
              <p className="lead" style={{ margin: "6px 0 0", fontSize: 14.5 }}>{r.body}</p>
              {a && (
                <div className="badge" style={{ marginTop: 10, background: flagged ? "#fcefec" : "#e9f0e4", color: flagged ? "#b23b2c" : "var(--agave-deep)" }}>
                  AI: {flagged ? "⚠ flag" : "✓ ok"} — {a.reason}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn ghost" style={{ marginLeft: 0, flex: 1, padding: 10 }} disabled={busy === key(r)} onClick={() => check(r)}>AI check</button>
                <button className="btn ghost" style={{ marginLeft: 0, flex: 1, padding: 10, color: "var(--agave-deep)" }} disabled={busy === key(r)} onClick={() => decide(r, "approve")}>Approve</button>
                <button className="btn ghost" style={{ marginLeft: 0, flex: 1, padding: 10, color: "#a3392f" }} disabled={busy === key(r)} onClick={() => decide(r, "block")}>Block</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
