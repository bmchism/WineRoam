import { Amplify } from "aws-amplify";
import type { ResourcesConfig } from "aws-amplify";
import { config, isApiConfigured, isAuthConfigured } from "./config";

// Configure Amplify once at startup from the deployed stack values. Auth +
// GraphQL (API key default; userPool for account-scoped calls + subscriptions).
//
// The OAuth/Hosted UI is always enabled when a cognitoDomain is set, even without
// external providers. This enables cross-domain SSO: the Cognito Hosted UI
// maintains a session cookie, so signing in on one spirit app automatically
// authenticates the user on all others.
export function configureAmplify() {
  const resources: ResourcesConfig = {};

  if (isAuthConfigured) {
    resources.Auth = {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        // Always enable Hosted UI OAuth when the domain is set — this is the SSO
        // mechanism across spirit apps. External providers (Google/Apple) are
        // optional and additive.
        ...(config.cognitoDomain
          ? {
              loginWith: {
                oauth: {
                  domain: config.cognitoDomain,
                  scopes: ["openid", "email", "profile"],
                  redirectSignIn: [`${window.location.origin}/`],
                  redirectSignOut: [`${window.location.origin}/`],
                  responseType: "code",
                  providers: config.oauthProviders.length
                    ? config.oauthProviders
                    : [],
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
