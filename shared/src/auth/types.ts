/** Unified auth user across all spirit apps. */
export interface SpiritAuthUser {
  username: string;
  email?: string;
  name?: string;
}

/** Config passed to configureSpiritAuth at app startup. */
export interface SpiritAuthConfig {
  /** Shared Cognito User Pool ID (same for all apps). */
  userPoolId: string;
  /** App-specific client ID from SpiritAuthStack. */
  userPoolClientId: string;
  /** AWS region. Defaults to us-east-1. */
  region?: string;
  /** Cognito Hosted-UI domain for OAuth (e.g. spirit-roam.auth.us-east-1.amazoncognito.com). */
  cognitoDomain?: string;
  /** Which OAuth providers are enabled (e.g. ["Google", "Apple"]). */
  oauthProviders?: ("Google" | "Apple")[];
}

/** All five spirit app names. */
export const SPIRIT_APPS = ["wine", "gin", "bourbon", "tequila", "scotch"] as const;
export type SpiritApp = (typeof SPIRIT_APPS)[number];

/** Cognito pool + client IDs for the live unified auth. */
export const SPIRIT_AUTH_POOL_ID = "us-east-1_JWONaq4Kj";
export const SPIRIT_AUTH_DOMAIN = "spirit-roam.auth.us-east-1.amazoncognito.com";

export const SPIRIT_CLIENT_IDS: Record<SpiritApp, string> = {
  wine: "2223u4fnmbamgp2m5l9sdknut7",
  gin: "12gql9qndn85e26cgodkdhlm6c",
  bourbon: "6c6aung2pdt9o6t0ntrpf809ui",
  tequila: "49vahe3ca0u59rff9ndpqohna0",
  scotch: "28ce463bvdb9l7e47spllk1hp8",
};
