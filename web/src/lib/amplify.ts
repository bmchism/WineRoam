import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "aws-amplify";
import { config, isApiConfigured, isAuthConfigured } from "./config";

// Configure Amplify once at startup from the deployed stack values. Auth +
// GraphQL (API key default; userPool for account-scoped calls + subscriptions).
export function configureAmplify() {
  const resources: ResourcesConfig = {};

  if (isAuthConfigured) {
    resources.Auth = {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        // Federated Google/Apple via Hosted-UI redirect — only when the OAuth
        // domain is configured. Redirects come back to the app's own origin.
        ...(config.cognitoDomain && config.oauthProviders.length
          ? {
              loginWith: {
                oauth: {
                  domain: config.cognitoDomain,
                  scopes: ["openid", "email", "profile"],
                  redirectSignIn: [`${window.location.origin}/`],
                  redirectSignOut: [`${window.location.origin}/`],
                  responseType: "code",
                  providers: config.oauthProviders,
                },
              },
            }
          : {}),
      },
    };
  }
  if (isApiConfigured) {
    resources.API = {
      GraphQL: {
        endpoint: config.graphqlUrl,
        region: config.region,
        defaultAuthMode: "apiKey",
        apiKey: config.apiKey,
      },
    };
  }

  if (resources.Auth || resources.API) Amplify.configure(resources);
}
