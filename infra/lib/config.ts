// Deployment config. All env-specific values come from CDK context or env vars
// so the same code synthesizes anywhere. Owner fills these at deploy time.
// Defaults keep `cdk synth` working with no AWS account.

export interface WineConfig {
  account?: string;
  region: string;
  monthlyBudget: number;
  // Anthropic workspace the app's API key belongs to. When set, the admin cost
  // page scopes Anthropic spend to THIS app instead of the whole shared org.
  anthropicWorkspaceId?: string;
  // ---- Unified Auth (SpiritAuthStack) ----
  // When useSharedAuth is true, the app stack imports the shared Cognito User Pool
  // from SpiritAuthStack instead of creating its own. All spirit apps share one pool.
  useSharedAuth: boolean;
  // Which spirit app is this? Used to select the correct App Client from the
  // shared auth stack. Values: "wine" | "gin" | "bourbon" | "tequila" | "scotch"
  spiritApp: string;
  // ---- Social login (Google + Apple via Cognito Hosted UI) ----
  // Globally-unique Cognito Hosted-UI domain prefix →
  // https://<prefix>.auth.<region>.amazoncognito.com. Required for OAuth.
  // Only used by SpiritAuthStack (shared pool) or legacy per-app pool mode.
  cognitoDomainPrefix: string;
  // Each provider activates independently: set its non-secret ID(s) here AND
  // populate its Secrets Manager secret, then deploy. Leave unset to skip it.
  googleClientId?: string;
  appleServicesId?: string;
  appleTeamId?: string;
  appleKeyId?: string;
  alertEmail?: string;
  domainName?: string; // e.g. wine.roamthrough.com (optional until DNS ready)
  hostedZoneId?: string; // Route53 zone for domainName (e.g. roamthrough.com)
  hostedZoneName?: string; // e.g. roamthrough.com
  // Account-level security baseline. Set false if GuardDuty/Config already exist
  // in the account (they are singletons) to avoid a deploy conflict.
  enableSecurityBaseline: boolean;
  // Route Cognito sign-up/reset emails through Resend (CustomEmailSender).
  // Keep false until the Resend secret is set — enabling it disables Cognito's
  // built-in emails, so an empty secret would break auth emails.
  resendCognitoEmails: boolean;
}

// Keep backward compat alias for security-stack import
export type AgaveConfig = WineConfig;

export function loadConfig(app: {
  node: { tryGetContext: (k: string) => unknown };
}): WineConfig {
  const ctx = (k: string) => app.node.tryGetContext(k) as string | undefined;
  return {
    account: process.env.CDK_DEFAULT_ACCOUNT || ctx("account"),
    // CloudFront WAF + ACM certs live in us-east-1; default the whole app there.
    region: ctx("region") || process.env.CDK_DEFAULT_REGION || "us-east-1",
    monthlyBudget: Number(ctx("monthlyBudget") ?? 30),
    anthropicWorkspaceId: ctx("anthropicWorkspaceId"),
    useSharedAuth: ctx("useSharedAuth") !== "false", // default: true (unified auth)
    spiritApp: ctx("spiritApp") || "wine",
    cognitoDomainPrefix: ctx("cognitoDomainPrefix") || "spirit-roam",
    googleClientId: ctx("googleClientId"),
    appleServicesId: ctx("appleServicesId"),
    appleTeamId: ctx("appleTeamId"),
    appleKeyId: ctx("appleKeyId"),
    alertEmail: ctx("alertEmail") || process.env.ALERT_EMAIL,
    domainName: ctx("domainName"),
    hostedZoneId: ctx("hostedZoneId"),
    hostedZoneName: ctx("hostedZoneName"),
    enableSecurityBaseline: ctx("enableSecurityBaseline") !== "false",
    resendCognitoEmails: ctx("resendCognitoEmails") === "true",
  };
}
