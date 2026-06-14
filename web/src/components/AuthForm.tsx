import { useState } from "react";
import { signInWithRedirect } from "aws-amplify/auth";
import { doSignUp, doConfirm, doSignIn, doConfirmTotp, doForgotPassword, doConfirmReset, useAuth } from "../lib/auth";
import { config, isSocialLoginConfigured } from "../lib/config";
import { GoogleMark, AppleMark } from "../icons";

type Mode = "signin" | "signup" | "confirm" | "forgot" | "reset" | "mfa";

// Per-provider button presentation; which ones render is driven by config.oauthProviders.
const PROVIDER_UI = {
  Google: { Mark: GoogleMark, label: "Continue with Google", cls: "social-google" },
  Apple: { Mark: AppleMark, label: "Continue with Apple", cls: "social-apple" },
} as const;

// Email/password auth with email-code confirmation + password reset (Cognito).
export default function AuthForm({ onDone }: { onDone?: () => void }) {
  const { refresh, configured } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="card">
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          Accounts aren't configured in this build. Add Cognito env values and redeploy to enable sign-in.
        </p>
      </div>
    );
  }

  const go = async (fn: () => Promise<void>, after?: () => void) => {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      await fn();
      after?.();
    } catch (e) {
      setErr((e as Error).message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  // Federated sign-in — full-page redirect to the Cognito Hosted UI → Google/Apple.
  const social = (provider: "Google" | "Apple") => go(() => signInWithRedirect({ provider }));

  const submit = () => {
    switch (mode) {
      case "signup":
        return go(() => doSignUp(email, password, name || email.split("@")[0]), () => setMode("confirm"));
      case "confirm":
        return go(async () => { await doConfirm(email, code); await doSignIn(email, password); }, async () => { await refresh(); onDone?.(); });
      case "forgot":
        return go(() => doForgotPassword(email), () => { setMsg(`Code sent to ${email}.`); setMode("reset"); });
      case "reset":
        return go(() => doConfirmReset(email, code, password), () => { setMsg("Password reset — sign in with your new password."); setMode("signin"); setPassword(""); setCode(""); });
      case "mfa":
        return go(() => doConfirmTotp(code), async () => { await refresh(); onDone?.(); });
      default:
        // Sign-in may return an MFA challenge; route to the code prompt instead
        // of finishing immediately.
        return go(async () => {
          const { mfa } = await doSignIn(email, password);
          if (mfa) {
            setMode("mfa");
            setCode("");
          } else {
            await refresh();
            onDone?.();
          }
        });
    }
  };

  const cta =
    mode === "signup" ? "Create account" :
    mode === "confirm" ? "Confirm" :
    mode === "forgot" ? "Send reset code" :
    mode === "reset" ? "Set new password" :
    mode === "mfa" ? "Verify code" : "Sign in";

  const showEmail = mode === "signin" || mode === "signup" || mode === "forgot";
  const showPassword = mode === "signin" || mode === "signup" || mode === "reset";
  const showCode = mode === "confirm" || mode === "reset" || mode === "mfa";

  return (
    <div className="card stack">
      {(mode === "signin" || mode === "signup") && isSocialLoginConfigured && (
        <>
          {config.oauthProviders.map((p) => {
            const u = PROVIDER_UI[p];
            return (
              <button key={p} type="button" className={`btn social ${u.cls}`} disabled={busy} onClick={() => social(p)}>
                <u.Mark size={18} /> {u.label}
              </button>
            );
          })}
          <div className="auth-or"><span>or use email</span></div>
        </>
      )}
      {mode === "signup" && <input className="field" placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />}
      {showEmail && <input className="field" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
      {(mode === "confirm" || mode === "reset" || mode === "mfa") && (
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          {mode === "confirm" ? `We emailed a code to ${email}. Enter it to finish.` :
           mode === "mfa" ? "Enter the 6-digit code from your authenticator app." :
           `Enter the code emailed to ${email} and a new password.`}
        </p>
      )}
      {showCode && <input className="field" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />}
      {showPassword && (
        <input className="field" type="password" placeholder={mode === "reset" ? "New password" : "Password"}
          autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
      )}

      {err && <div style={{ color: "#b23b2c", fontSize: 13.5 }}>{err}</div>}
      {msg && <div className="muted" style={{ fontSize: 13 }}>{msg}</div>}

      <button className="btn block" disabled={busy} onClick={submit}>{busy ? "…" : cta}</button>

      {mode === "mfa" && <button className="linklike" onClick={() => { setErr(""); setCode(""); setMode("signin"); }}>← Back to sign in</button>}

      {mode === "signin" && (
        <>
          <button className="linklike" onClick={() => { setErr(""); setMsg(""); setMode("forgot"); }}>Forgot password?</button>
          <button className="linklike" onClick={() => { setErr(""); setMsg(""); setMode("signup"); }}>New here? Create an account</button>
        </>
      )}
      {mode === "signup" && <button className="linklike" onClick={() => { setErr(""); setMode("signin"); }}>Have an account? Sign in</button>}
      {(mode === "forgot" || mode === "reset") && <button className="linklike" onClick={() => { setErr(""); setMode("signin"); }}>← Back to sign in</button>}
    </div>
  );
}
