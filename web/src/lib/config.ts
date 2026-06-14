// Runtime config from Vite env (filled from CDK stack Outputs at build time).
// Until the backend is deployed these are empty and the app runs on local seed
// data only — `isApiConfigured` gates any network calls.

export const config = {
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL ?? "",
  apiKey: import.meta.env.VITE_GRAPHQL_API_KEY ?? "",
  region: import.meta.env.VITE_AWS_REGION ?? "us-east-1",
  userPoolId: import.meta.env.VITE_USER_POOL_ID ?? "",
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID ?? "",
  uploadBucket: import.meta.env.VITE_UPLOAD_BUCKET ?? "",
  // Cognito Hosted-UI domain (e.g. wine-roam.auth.us-east-1.amazoncognito.com).
  // Set once social login is live; enables the Google/Apple OAuth flow.
  cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN ?? "",
  // Which federated providers are live, comma-separated (e.g. "Google" or
  // "Google,Apple"). Drives both Amplify's OAuth config and the AuthForm buttons.
  oauthProviders: ((import.meta.env.VITE_OAUTH_PROVIDERS ?? "") as string)
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is "Google" | "Apple" => s === "Google" || s === "Apple"),
};

// Public reads/guest tastings only need the URL + API key.
export const isApiConfigured = Boolean(config.graphqlUrl && config.apiKey);
// Accounts (Cognito) need the pool too.
export const isAuthConfigured = Boolean(config.userPoolId && config.userPoolClientId);
// Federated sign-in is available only when the OAuth domain is set AND at least
// one provider is enabled.
export const isSocialLoginConfigured = Boolean(
  isAuthConfigured && config.cognitoDomain && config.oauthProviders.length
);
