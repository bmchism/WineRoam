import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppBar from "../components/AppBar";
import AuthForm from "../components/AuthForm";
import LegalFooter from "../components/LegalFooter";
import { useAuth, doChangePassword, mfaEnabled, startTotpSetup, confirmTotpSetup, disableTotp } from "../lib/auth";
import Qr from "../components/Qr";
import { loadProfile, saveProfile, type Profile as P } from "../lib/profile";
import { getMyProfile, saveMyProfileApi, listMyShelf, type ShelfItem } from "../lib/api";
import { loadHistory, removeTasting, type TastingEntry } from "../lib/history";
import { listMyRemindersApi, saveMyReminderApi, deleteMyReminderApi, type CloudReminder } from "../lib/api";
import { useBottlesReady, getBottleSync } from "../lib/bottleStore";
import { getTheme, setTheme, type Theme } from "../lib/theme";
import { pushSupported, isPushOn, enablePush, disablePush } from "../lib/push";

export default function Profile() {
  const { user, isAdmin, loading } = useAuth();
  const uid = user?.username ?? "";
  const [p, setP] = useState<P>(() => loadProfile(uid));
  const [savedMsg, setSavedMsg] = useState("");

  // Pull the cloud profile (source of truth) once signed in; falls back to local.
  useEffect(() => {
    if (!uid) return;
    getMyProfile()
      .then((cloud) => {
        if (cloud && (cloud.displayName || cloud.phone || cloud.favorite || cloud.notify)) {
          setP(cloud);
          saveProfile(uid, cloud);
        }
      })
      .catch(() => {});
  }, [uid]);

  const [history, setHistory] = useState<TastingEntry[]>([]);
  useEffect(() => {
    loadHistory(!!user).then(setHistory).catch(() => {});
  }, [user]);
  const dropEntry = async (e: TastingEntry) => {
    await removeTasting(e.id, !!user);
    setHistory((prev) => prev.filter((x) => x.id !== e.id));
  };

  // Reminders (delivered by the backend sweep Lambda at their fire time).
  const [reminders, setReminders] = useState<CloudReminder[]>([]);
  const [remWhen, setRemWhen] = useState("");
  const [remTitle, setRemTitle] = useState("");
  const [remBusy, setRemBusy] = useState(false);
  useEffect(() => {
    if (!user) return setReminders([]);
    listMyRemindersApi().then(setReminders).catch(() => {});
  }, [user]);
  const addReminder = async () => {
    if (!remWhen || !remTitle.trim()) return;
    setRemBusy(true);
    const channel = p.phone && p.notify ? "both" : p.phone ? "sms" : "email";
    const r: CloudReminder = {
      id: `${Date.now()}`,
      title: remTitle.trim(),
      message: "Time for a tasting on Wine Roam.",
      when: new Date(remWhen).toISOString(),
      channel,
      email: user?.email ?? null,
      phone: p.phone || null,
    };
    try {
      await saveMyReminderApi(r);
      setReminders((prev) => [...prev, r].sort((a, b) => a.when.localeCompare(b.when)));
      setRemWhen("");
      setRemTitle("");
    } catch {
      /* ignore */
    } finally {
      setRemBusy(false);
    }
  };
  const dropReminder = async (id: string) => {
    await deleteMyReminderApi(id).catch(() => {});
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const set = (patch: Partial<P>) => setP((prev) => ({ ...prev, ...patch }));
  const save = () => {
    saveProfile(uid, p);
    saveMyProfileApi(p).catch(() => {});
    setSavedMsg("Saved ✓");
    setTimeout(() => setSavedMsg(""), 1800);
  };

  const greeting = p.displayName || user?.name || "there";

  const [theme, setThemeState] = useState<Theme>(getTheme());
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => { isPushOn().then(setPushOn); }, []);
  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (pushOn) { await disablePush(); setPushOn(false); }
      else { await enablePush(); setPushOn(true); }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPushBusy(false);
    }
  };

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const changePw = async () => {
    if (!oldPw || !newPw) return;
    setPwBusy(true);
    setPwMsg("");
    try {
      await doChangePassword(oldPw, newPw);
      setPwMsg("Password changed ✓");
      setOldPw("");
      setNewPw("");
    } catch (e) {
      setPwMsg((e as Error).message || "Couldn't change password");
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <>
      <AppBar />
      <main className="screen">
        <div className="page-title">
          <span className="kicker">Your Account</span>
          <h1>{user ? `Hi, ${greeting}` : "Profile"}</h1>
          <p>
            {user
              ? "Your details, tasting history, notes, and reviews live here."
              : "Sign in to save tasting history, notes, and publish reviews. Guests can always join a tasting without one."}
          </p>
        </div>

        {loading ? (
          <div className="muted" style={{ padding: "24px 4px" }}>Loading…</div>
        ) : user ? (
          <>
            <div className="card">
              <div style={{ fontWeight: 600 }}>{user.email}</div>
            </div>

            <div className="section-head"><span className="kicker">About you</span><h2>Your Details</h2></div>
            <div className="card stack">
              <div>
                <div className="label">Display name</div>
                <input className="field" value={p.displayName} onChange={(e) => set({ displayName: e.target.value })} placeholder={user.name ?? "Your name"} />
              </div>
              <div>
                <div className="label">Favorite wine</div>
                <input className="field" value={p.favorite} onChange={(e) => set({ favorite: e.target.value })} placeholder="e.g. Château Margaux 2015" />
              </div>
              <div>
                <div className="label">Phone (optional)</div>
                <input className="field" type="tel" value={p.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+1 555 123 4567" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>Text me about tastings</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>Invites & reminders via SMS</div>
                </div>
                <button className={`toggle${p.notify ? " on" : ""}`} onClick={() => set({ notify: !p.notify })} aria-pressed={p.notify}><span className="knob" /></button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>Dark mode</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>Easier on the eyes at night</div>
                </div>
                <button className={`toggle${theme === "dark" ? " on" : ""}`} onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label="Dark mode"><span className="knob" /></button>
              </div>
              {pushSupported() && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>Push notifications</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>Tasting reminders & live invites on this device</div>
                  </div>
                  <button className={`toggle${pushOn ? " on" : ""}`} disabled={pushBusy} onClick={togglePush} aria-pressed={pushOn} aria-label="Push notifications"><span className="knob" /></button>
                </div>
              )}
              <button className="btn block" onClick={save}>{savedMsg || "Save details"}</button>
            </div>

            <ShelfSection />

            <div className="section-head"><span className="kicker">Your tastings</span><h2>Tasting History</h2></div>
            {history.length === 0 ? (
              <div className="card"><div className="muted" style={{ fontSize: 14 }}>No tastings yet. Run a flight and your recap lands here.</div></div>
            ) : (
              <div className="card stack">
                {history.map((h) => (
                  <div key={h.id} className="pour-row" style={{ alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="pnm">{h.title}</div>
                      <div className="psub">
                        {h.bottleCount} pour{h.bottleCount === 1 ? "" : "s"} · avg {h.avgScore || "—"}/10
                        {h.quizTotal ? ` · quiz ${h.quizCorrect}/${h.quizTotal}` : ""}
                        {" · "}{new Date(h.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Link to={`/taste/${h.flightId}/recap`} className="chip" style={{ textDecoration: "none" }}>Recap</Link>
                    <button className="chip" aria-label="Delete tasting" style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px 8px" }} onClick={() => dropEntry(h)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="section-head"><span className="kicker">Stay in the loop</span><h2>Tasting Reminders</h2></div>
            <div className="card stack">
              <div>
                <div className="label">What's the occasion?</div>
                <input className="field" value={remTitle} onChange={(e) => setRemTitle(e.target.value)} placeholder="e.g. Friday grape night" />
              </div>
              <div>
                <div className="label">When</div>
                <input className="field" type="datetime-local" value={remWhen} onChange={(e) => setRemWhen(e.target.value)} />
              </div>
              <div className="muted" style={{ fontSize: 12.5 }}>
                Sent {p.phone ? (p.notify ? "by text and email" : "by text") : "by email"} when it's time.
                {p.phone ? "" : " Add a phone above for SMS."}
              </div>
              <button className="btn block" disabled={remBusy || !remWhen || !remTitle.trim()} onClick={addReminder}>
                {remBusy ? "Saving…" : "Set reminder"}
              </button>
              {reminders.map((r) => (
                <div key={r.id} className="pour-row" style={{ alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pnm">{r.title}</div>
                    <div className="psub">{new Date(r.when).toLocaleString()} · {r.channel === "both" ? "text + email" : r.channel}</div>
                  </div>
                  <button className="chip" aria-label="Delete reminder" style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px 8px" }} onClick={() => dropReminder(r.id)}>✕</button>
                </div>
              ))}
            </div>

            <div className="section-head"><span className="kicker">Security</span><h2>Change Password</h2></div>
            <div className="card stack">
              <input className="field" type="password" placeholder="Current password" autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
              <input className="field" type="password" placeholder="New password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              <button className="btn block" disabled={pwBusy || !oldPw || !newPw} onClick={changePw}>{pwBusy ? "…" : "Update password"}</button>
              {pwMsg && <div className="muted" style={{ fontSize: 13 }}>{pwMsg}</div>}
            </div>

            <div className="section-head"><span className="kicker">Security</span><h2>Two-Factor (TOTP)</h2></div>
            <MfaPanel />

            {isAdmin && (
              <Link to="/admin" className="card tap" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: "var(--serif)", margin: 0, fontSize: 17 }}>Admin dashboard</h3>
                  <p className="muted" style={{ margin: "3px 0 0", fontSize: 13.5 }}>Costs, alarms, users, cache, moderation (owner)</p>
                </div>
                <span style={{ color: "var(--muted)" }}>›</span>
              </Link>
            )}
          </>
        ) : (
          <div style={{ marginTop: 8 }}>
            <AuthForm />
          </div>
        )}
        <LegalFooter />
      </main>
    </>
  );
}

// Optional authenticator-app (TOTP) MFA: enroll via a QR/secret, verify a code,
// or turn it off. Cognito enforces the challenge at sign-in once enabled.
function MfaPanel() {
  const [on, setOn] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<{ uri: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    mfaEnabled().then(setOn).catch(() => setOn(false));
  }, []);

  const begin = async () => {
    setBusy(true);
    setMsg("");
    try {
      setSetup(await startTotpSetup());
    } catch (e) {
      setMsg((e as Error).message || "Couldn't start setup.");
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    setBusy(true);
    setMsg("");
    try {
      await confirmTotpSetup(code.trim());
      setOn(true);
      setSetup(null);
      setCode("");
      setMsg("Two-factor is on. You'll enter a code at each sign-in.");
    } catch (e) {
      setMsg((e as Error).message || "That code didn't verify — try the current one.");
    } finally {
      setBusy(false);
    }
  };
  const turnOff = async () => {
    setBusy(true);
    setMsg("");
    try {
      await disableTotp();
      setOn(false);
      setMsg("Two-factor turned off.");
    } catch (e) {
      setMsg((e as Error).message || "Couldn't turn it off.");
    } finally {
      setBusy(false);
    }
  };

  if (on === null) return <div className="card"><div className="muted" style={{ fontSize: 14 }}>Checking…</div></div>;

  return (
    <div className="card stack">
      {on ? (
        <>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>🔐 Two-factor is on</div>
          <div className="muted" style={{ fontSize: 13 }}>An authenticator code is required when you sign in.</div>
          <button className="btn ghost block" disabled={busy} onClick={turnOff}>{busy ? "…" : "Turn off two-factor"}</button>
        </>
      ) : setup ? (
        <>
          <div className="muted" style={{ fontSize: 13.5 }}>Scan this in your authenticator app (or enter the key), then type the 6-digit code to confirm.</div>
          <div style={{ display: "grid", placeItems: "center", padding: "8px 0" }}>
            <Qr value={setup.uri} />
          </div>
          <div className="muted" style={{ fontSize: 12, wordBreak: "break-all", textAlign: "center" }}>{setup.secret}</div>
          <input className="field" inputMode="numeric" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn block" disabled={busy || code.trim().length < 6} onClick={verify}>{busy ? "…" : "Verify & enable"}</button>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>Add an extra layer</div>
          <div className="muted" style={{ fontSize: 13 }}>Use an authenticator app (Google Authenticator, Authy, 1Password) for a code at sign-in.</div>
          <button className="btn block" disabled={busy} onClick={begin}>{busy ? "…" : "Set up authenticator"}</button>
        </>
      )}
      {msg && <div className="muted" style={{ fontSize: 13 }}>{msg}</div>}
    </div>
  );
}

const SHELF_LABEL: Record<string, string> = { owned: "🏠 Owned", wishlist: "✨ Wishlist", tasted: "✓ Tasted" };
function ShelfSection() {
  const [items, setItems] = useState<ShelfItem[] | null>(null);
  useBottlesReady();
  useEffect(() => {
    listMyShelf().then(setItems).catch(() => setItems([]));
  }, []);
  if (!items || items.length === 0) return null;
  const order: ShelfItem["status"][] = ["owned", "wishlist", "tasted"];
  return (
    <>
      <div className="section-head"><span className="kicker">Your collection</span><h2>My Shelf · {items.length}</h2></div>
      {order.map((st) => {
        const group = items.filter((i) => i.status === st);
        if (!group.length) return null;
        return (
          <div key={st} className="card" style={{ marginBottom: 10 }}>
            <div className="label">{SHELF_LABEL[st]} · {group.length}</div>
            <div className="taglist tags" style={{ marginTop: 6 }}>
              {group.map((i) => {
                const b = getBottleSync(i.bottleId);
                return b ? (
                  <Link key={i.bottleId} to={`/bottle/${b.id}`} className="tag" style={{ textDecoration: "none" }}>{b.name}</Link>
                ) : null;
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
