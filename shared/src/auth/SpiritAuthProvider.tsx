import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import {
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
  signOut as amplifySignOut,
  signInWithRedirect,
} from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import type { SpiritAuthUser } from "./types";

interface SpiritAuthCtx {
  /** Current authenticated user, or null if not signed in. */
  user: SpiritAuthUser | null;
  /** Whether the user belongs to the "admins" Cognito group. */
  isAdmin: boolean;
  /** True while the initial auth check is in progress. */
  loading: boolean;
  /** Re-fetch user state (e.g. after sign-in). */
  refresh: () => Promise<void | boolean>;
  /** Sign out and clear local state. */
  signOut: () => Promise<void>;
  /** Trigger SSO login via Cognito Hosted UI. */
  signInWithSSO: () => void;
}

const Ctx = createContext<SpiritAuthCtx>({
  user: null,
  isAdmin: false,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
  signInWithSSO: () => {},
});

interface SpiritAuthProviderProps {
  children: ReactNode;
  /**
   * When true (default), automatically attempt a silent SSO check on load.
   * If the user has an active Cognito Hosted UI session (from signing in on
   * another spirit app), they'll be silently authenticated without prompting.
   */
  autoSSO?: boolean;
}

/**
 * Unified auth provider for all Spirit Roam apps with cross-domain SSO.
 * 
 * On mount, if no local session is found, it redirects to the Cognito Hosted UI
 * to check for an existing session. If found, the user is silently authenticated.
 * If not, it returns and shows the login form.
 */
export function SpiritAuthProvider({ children, autoSSO = true }: SpiritAuthProviderProps) {
  const [user, setUser] = useState<SpiritAuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const ssoAttempted = useRef(false);

  const refresh = async () => {
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
      let admin = false;
      try {
        const session = await fetchAuthSession();
        const groups = session.tokens?.idToken?.payload?.["cognito:groups"];
        admin = Array.isArray(groups) && groups.includes("admins");
      } catch {
        /* no session — non-admin */
      }
      setUser({ username: cu.username, email, name });
      setIsAdmin(admin);
      setLoading(false);
      return true; // user found
    } catch {
      setUser(null);
      setIsAdmin(false);
      return false; // no user
    }
  };

  const attemptSSO = async () => {
    // Only attempt SSO once per page load, and only if not already returning
    // from a redirect (indicated by ?code= in the URL).
    if (ssoAttempted.current) return;
    ssoAttempted.current = true;

    const params = new URLSearchParams(window.location.search);
    if (params.has("code") || params.has("error")) {
      // We're handling a redirect callback — let Amplify process it.
      return;
    }

    // Check if we already have a local session first.
    const hasUser = await refresh();
    if (hasUser) return;

    // No local session — redirect to Hosted UI for silent SSO check.
    // The Hosted UI will either:
    // 1. Return immediately with tokens (session cookie exists from another app)
    // 2. Show the login page (no existing session)
    if (autoSSO) {
      // Mark that we're doing an SSO redirect so we don't loop.
      const ssoKey = `spirit_sso_attempted_${window.location.origin}`;
      if (sessionStorage.getItem(ssoKey)) {
        // Already tried SSO this browser session — don't redirect again.
        setLoading(false);
        return;
      }
      sessionStorage.setItem(ssoKey, "1");
      
      try {
        // signInWithRedirect navigates to the Hosted UI.
        // If there's an active session, it comes back immediately with tokens.
        await signInWithRedirect();
      } catch {
        // If redirect fails (e.g. OAuth not configured), just show login form.
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    attemptSSO();

    const stop = Hub.listen("auth", ({ payload }) => {
      if (
        payload.event === "signInWithRedirect" ||
        payload.event === "signedIn"
      ) {
        refresh().then(() => setLoading(false));
      } else if (payload.event === "signInWithRedirect_failure") {
        // SSO check returned an error — no active session on the Hosted UI.
        // Clear the flag so user can try again later if they want.
        setLoading(false);
      }
    });
    return stop;
  }, []);

  const signOut = async () => {
    // Clear SSO flag so next visit attempts SSO again.
    sessionStorage.removeItem(`spirit_sso_attempted_${window.location.origin}`);
    await amplifySignOut({ global: true });
    setUser(null);
    setIsAdmin(false);
  };

  const signInWithSSO = () => {
    sessionStorage.removeItem(`spirit_sso_attempted_${window.location.origin}`);
    signInWithRedirect();
  };

  return (
    <Ctx.Provider value={{ user, isAdmin, loading, refresh, signOut, signInWithSSO }}>
      {children}
    </Ctx.Provider>
  );
}

/** Access the unified Spirit auth state. */
export const useSpiritAuth = () => useContext(Ctx);
