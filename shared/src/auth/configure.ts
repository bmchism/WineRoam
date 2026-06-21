import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "aws-amplify";
import type { SpiritAuthConfig } from "./types";

/**
 * Configure Amplify for unified Spirit auth with cross-domain SSO.
 * 
 * All spirit apps use the Cognito Hosted UI as the auth broker. When a user
 * signs in on any app, the Hosted UI sets a session cookie on the auth domain.
 * Other apps can then silently obtain tokens by redirecting to the Hosted UI
 * (which sees the cookie and returns immediately without prompting).
 * 
 * Call once at app startup (before rendering).
 */
export function configureSpiritAuth(cfg: SpiritAuthConfig) {
  const cognitoDomain = cfg.cognitoDomain || "spirit-roam.auth.us-east-1.amazoncognito.com";

  const resources: ResourcesConfig = {
    Auth: {
      Cognito: {
        userPoolId: cfg.userPoolId,
        userPoolClientId: cfg.userPoolClientId,
        loginWith: {
          oauth: {
            domain: cognitoDomain,
            scopes: ["openid", "email", "profile"],
            redirectSignIn: [`${window.location.origin}/`],
            redirectSignOut: [`${window.location.origin}/`],
            responseType: "code" as const,
            // Empty providers array = Cognito's own login form in the Hosted UI.
            // If Google/Apple are configured, add them here.
            providers: (cfg.oauthProviders as any[]) || [],
          },
        },
      },
    },
  };

  Amplify.configure(resources);
}
