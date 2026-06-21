import {
  Stack,
  StackProps,
  RemovalPolicy,
  Duration,
  CfnOutput,
  aws_cognito as cognito,
  aws_kms as kms,
  aws_iam as iam,
  aws_secretsmanager as secrets,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejs,
} from "aws-cdk-lib";
import * as path from "path";
import { Construct } from "constructs";
import { WineConfig } from "./config";

/**
 * All spirit applications (Wine, Gin, Bourbon, Tequila, Scotch) share a single
 * Cognito User Pool. Users sign up once and can access any spirit app with the
 * same credentials. Each spirit app gets its own App Client so tokens/sessions
 * are scoped per-app, but the underlying user directory is unified.
 */

export interface SpiritAuthStackProps extends StackProps {
  config: WineConfig;
}

/** The five spirit apps that share this pool. */
export const SPIRIT_APPS = ["wine", "gin", "bourbon", "tequila", "scotch"] as const;
export type SpiritApp = (typeof SPIRIT_APPS)[number];

/** Domain name per spirit app (used for OAuth callback URLs). */
export function spiritDomain(app: SpiritApp): string {
  return `${app}.roamthrough.com`;
}

export class SpiritAuthStack extends Stack {
  /** The shared user pool — import this in each spirit app stack. */
  public readonly userPool: cognito.UserPool;
  /** Per-app clients keyed by spirit name. */
  public readonly appClients: Record<string, cognito.UserPoolClient>;

  constructor(scope: Construct, id: string, props: SpiritAuthStackProps) {
    super(scope, id, props);
    const { config } = props;

    // ---------------------------------------------------------------- User Pool
    this.userPool = new cognito.UserPool(this, "SpiritUserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 10,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: false, otp: true },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Hosted-UI domain for federated OAuth (shared across all apps).
    const authDomain = this.userPool.addDomain("AuthDomain", {
      cognitoDomain: { domainPrefix: "spirit-roam" },
    });

    // Admin group — owner/admin users.
    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "admins",
      description: "Owner/admin users — full access across all spirit apps",
    });

    // ---------------------------------------------------------- OAuth Secrets
    const googleOAuthSecret = new secrets.Secret(this, "GoogleOAuthSecret", {
      description: "Spirit Roam (shared) — Google OAuth client secret",
    });
    const appleOAuthSecret = new secrets.Secret(this, "AppleOAuthSecret", {
      description: "Spirit Roam (shared) — Apple Sign-In private key (.p8)",
    });

    // Federated identity providers (shared — activate per usual once secrets set).
    const clientIdps: cognito.UserPoolClientIdentityProvider[] = [
      cognito.UserPoolClientIdentityProvider.COGNITO,
    ];
    const idpDeps: Construct[] = [];

    if (config.googleClientId) {
      const google = new cognito.UserPoolIdentityProviderGoogle(this, "Google", {
        userPool: this.userPool,
        clientId: config.googleClientId,
        clientSecretValue: googleOAuthSecret.secretValueFromJson("clientSecret"),
        scopes: ["openid", "email", "profile"],
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          fullname: cognito.ProviderAttribute.GOOGLE_NAME,
        },
      });
      clientIdps.push(cognito.UserPoolClientIdentityProvider.GOOGLE);
      idpDeps.push(google);
    }

    if (config.appleServicesId && config.appleTeamId && config.appleKeyId) {
      const apple = new cognito.UserPoolIdentityProviderApple(this, "Apple", {
        userPool: this.userPool,
        clientId: config.appleServicesId,
        teamId: config.appleTeamId,
        keyId: config.appleKeyId,
        privateKeyValue: appleOAuthSecret.secretValueFromJson("privateKey"),
        scopes: ["email", "name"],
        attributeMapping: { email: cognito.ProviderAttribute.APPLE_EMAIL },
      });
      clientIdps.push(cognito.UserPoolClientIdentityProvider.APPLE);
      idpDeps.push(apple);
    }

    // ----------------------------------------------------- Per-App Clients
    // Each spirit app gets its own App Client so it can have distinct callback
    // URLs and session tokens, but they all share the same user directory.
    this.appClients = {};

    for (const app of SPIRIT_APPS) {
      const domain = spiritDomain(app);
      const oauthUrls = [
        `https://${domain}/`,
        `https://${domain}/callback`,
        `https://spirits.roamthrough.com/`,
        `https://spirits.roamthrough.com/callback`,
        "http://localhost:5173/",
        "http://localhost:5173/callback",
      ];

      const client = this.userPool.addClient(`${capitalize(app)}Client`, {
        authFlows: { userSrp: true },
        preventUserExistenceErrors: true,
        supportedIdentityProviders: clientIdps,
        oAuth: {
          flows: { authorizationCodeGrant: true },
          scopes: [
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.PROFILE,
          ],
          callbackUrls: oauthUrls,
          logoutUrls: oauthUrls,
        },
      });
      idpDeps.forEach((d) => client.node.addDependency(d));
      this.appClients[app] = client;

      new CfnOutput(this, `${capitalize(app)}ClientId`, {
        value: client.userPoolClientId,
        exportName: `SpiritAuth-${capitalize(app)}ClientId`,
      });
    }

    // ---------------------------------------------------------------- Outputs
    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      exportName: "SpiritAuth-UserPoolId",
    });
    new CfnOutput(this, "UserPoolArn", {
      value: this.userPool.userPoolArn,
      exportName: "SpiritAuth-UserPoolArn",
    });
    new CfnOutput(this, "CognitoAuthDomain", {
      value: authDomain.baseUrl(),
      exportName: "SpiritAuth-AuthDomain",
    });
    new CfnOutput(this, "GoogleOAuthSecretName", { value: googleOAuthSecret.secretName });
    new CfnOutput(this, "AppleOAuthSecretName", { value: appleOAuthSecret.secretName });
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
