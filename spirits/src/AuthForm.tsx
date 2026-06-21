import { useState } from "react";
import { signIn, signUp, confirmSignUp } from "aws-amplify/auth";
import { useSpiritAuth } from "@agave/shared/auth";

type Mode = "signIn" | "signUp" | "confirm";

export default function AuthForm() {
  const { refresh } = useSpiritAuth();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn({ username: email, password });
      await refresh();
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email, name } },
      });
      setMode("confirm");
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      await signIn({ username: email, password });
      await refresh();
    } catch (err: any) {
      setError(err.message || "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "confirm") {
    return (
      <form onSubmit={handleConfirm} className="auth-form">
        <h3>Check your email</h3>
        <p style={{ fontSize: 14, color: "#666" }}>We sent a verification code to {email}</p>
        <input
          type="text"
          placeholder="Verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          autoFocus
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Verifying…" : "Verify & Sign In"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={mode === "signIn" ? handleSignIn : handleSignUp} className="auth-form">
      <h3>{mode === "signIn" ? "Sign In" : "Create Account"}</h3>
      {mode === "signUp" && (
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={10}
      />
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "…" : mode === "signIn" ? "Sign In" : "Sign Up"}
      </button>
      <p className="auth-toggle">
        {mode === "signIn" ? (
          <>Don't have an account? <button type="button" onClick={() => setMode("signUp")}>Sign up</button></>
        ) : (
          <>Already have an account? <button type="button" onClick={() => setMode("signIn")}>Sign in</button></>
        )}
      </p>
    </form>
  );
}
