import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirm,
  signIn as amplifySignIn,
  confirmSignIn as amplifyConfirmSignIn,
  signOut as amplifySignOut,
  resetPassword,
  confirmResetPassword,
  updatePassword,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
  setUpTOTP,
  verifyTOTPSetup,
  updateMFAPreference,
  fetchMFAPreference,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { isAuthConfigured } from "./config";

export interface AuthUser {
  username: string;
  email?: string;
  name?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  isAdmin: false,
  loading: true,
  configured: false,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!isAuthConfigured) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    try {
      const cu = await getCurrentUser();
      let email: string | undefined;
      let name: string | undefined;
      try {
        const attrs = await fetchUserAttributes();
        email = attrs.email;
        name = attrs.name;
      } catch {
        /* attributes optional */
      }
      // Admin status comes from the Cognito group claim in the ID token. This is
      // UI-gating only — the backend independently enforces the admins group on
      // every admin resolver.
      let admin = false;
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload?.["cognito:groups"];
        admin = Array.isArray(groups) && groups.includes("admins");
      } catch {
        /* no session groups — treat as non-admin */
      }
      setUser({ username: cu.username, email, name });
      setIsAdmin(admin);
    } catch {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // After a federated (Google/Apple) Hosted-UI redirect returns to the app,
    // Amplify completes the token exchange and fires these events — re-read the
    // session so `user` populates and gated redirects fire.
    const stop = Hub.listen("auth", ({ payload }) => {
      if (
        payload.event === "signInWithRedirect" ||
        payload.event === "signedIn"
      ) {
        refresh();
      } else if (payload.event === "signInWithRedirect_failure") {
        setLoading(false);
      }
    });
    return stop;
  }, []);

  const signOut = async () => {
    await amplifySignOut();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <Ctx.Provider value={{ user, isAdmin, loading, configured: isAuthConfigured, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

// ---- Thin wrappers used by AuthForm ----
export async function doSignUp(email: string, password: string, name: string) {
  await amplifySignUp({
    username: email,
    password,
    options: { userAttributes: { email, name } },
  });
}
export async function doConfirm(email: string, code: string) {
  await amplifyConfirm({ username: email, confirmationCode: code });
}
// Returns whether a TOTP code is still required to finish signing in. When true,
// AuthForm prompts for the code and calls doConfirmTotp.
export async function doSignIn(email: string, password: string): Promise<{ mfa: boolean }> {
  const res = await amplifySignIn({ username: email, password });
  const step = res.nextStep?.signInStep;
  return { mfa: step === "CONFIRM_SIGN_IN_WITH_TOTP_CODE" };
}
export async function doConfirmTotp(code: string) {
  await amplifyConfirmSignIn({ challengeResponse: code });
}

// ---- Optional TOTP (authenticator app) MFA ----
export async function mfaEnabled(): Promise<boolean> {
  try {
    const pref = await fetchMFAPreference();
    return pref.enabled?.includes("TOTP") ?? false;
  } catch {
    return false;
  }
}
// Begins enrollment; returns the otpauth:// URI (for a QR) and the shared secret.
export async function startTotpSetup(): Promise<{ uri: string; secret: string }> {
  const out = await setUpTOTP();
  const secret = out.sharedSecret;
  const uri = out.getSetupUri("Wine Roam").toString();
  return { uri, secret };
}
export async function confirmTotpSetup(code: string) {
  await verifyTOTPSetup({ code });
  await updateMFAPreference({ totp: "PREFERRED" });
}
export async function disableTotp() {
  await updateMFAPreference({ totp: "DISABLED" });
}
export async function doForgotPassword(email: string) {
  await resetPassword({ username: email });
}
export async function doConfirmReset(email: string, code: string, newPassword: string) {
  await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
}
export async function doChangePassword(oldPassword: string, newPassword: string) {
  await updatePassword({ oldPassword, newPassword });
}
