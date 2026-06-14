import * as path from "path";
import {
  Stack,
  StackProps,
  Duration,
  Expiration,
  RemovalPolicy,
  SecretValue,
  CfnOutput,
  aws_dynamodb as dynamodb,
  aws_cognito as cognito,
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_wafv2 as wafv2,
  aws_certificatemanager as acm,
  aws_route53 as route53,
  aws_route53_targets as targets,
  aws_lambda as lambda,
  aws_lambda_nodejs as nodejs,
  aws_appsync as appsync,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks,
  aws_events as events,
  aws_events_targets as eventsTargets,
  aws_secretsmanager as secrets,
  aws_kms as kms,
  aws_iam as iam,
  aws_sns as sns,
  aws_cloudwatch as cw,
  aws_budgets as budgets,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { AgaveConfig } from "./config";

interface AgaveStackProps extends StackProps {
  config: AgaveConfig;
}

const FN_ROOT = path.join(__dirname, "..", "..", "functions", "src");

export class AgaveStack extends Stack {
  constructor(scope: Construct, id: string, props: AgaveStackProps) {
    super(scope, id, props);
    const { config } = props;

    // ---------------------------------------------------------------- Data
    const table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true }, // PITR (decided)
      removalPolicy: RemovalPolicy.RETAIN, // never drop user data on stack delete
    });
    table.addGlobalSecondaryIndex({
      indexName: "GSI1",
      partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
    });

    // -------------------------------------------------------------- Secrets
    const anthropicSecret = new secrets.Secret(this, "AnthropicKey", {
      description: "Agave — Anthropic Workspace API key (set value after deploy)",
    });
    const anthropicAdminSecret = new secrets.Secret(this, "AnthropicAdminKey", {
      description: "Agave — Anthropic Admin API key for org cost reporting",
    });
    const vapidSecret = new secrets.Secret(this, "VapidKey", {
      description: "Agave — Web Push VAPID {publicKey, privateKey, subject} (set value after deploy)",
    });
    // Provider creds — swappable by updating the secret value (no redeploy).
    const resendSecret = new secrets.Secret(this, "ResendKey", {
      description: "Agave — Resend {apiKey, fromEmail}. Shareable now; swap value to switch accounts.",
    });
    const twilioSecret = new secrets.Secret(this, "TwilioKey", {
      description: "Agave — Twilio {accountSid, authToken, fromNumber}. Swap value to switch accounts.",
    });

    // KMS key + Lambda for Cognito CustomEmailSender (branded emails via Resend).
    // Created only when the Resend-Cognito path is enabled.
    let emailKey: kms.Key | undefined;
    let cognitoEmailFn: nodejs.NodejsFunction | undefined;
    if (config.resendCognitoEmails) {
      emailKey = new kms.Key(this, "CognitoEmailKey", {
        description: "Agave Cognito custom email sender",
        enableKeyRotation: true,
      });
      emailKey.grantEncryptDecrypt(new iam.ServicePrincipal("cognito-idp.amazonaws.com"));
      cognitoEmailFn = new nodejs.NodejsFunction(this, "CognitoEmailFn", {
        entry: path.join(FN_ROOT, "cognitoEmail.ts"),
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: Duration.seconds(15),
        memorySize: 256,
        environment: { KMS_KEY_ARN: emailKey.keyArn, RESEND_SECRET_ARN: resendSecret.secretArn },
        bundling: { externalModules: ["@aws-sdk/*"] },
      });
      emailKey.grantDecrypt(cognitoEmailFn);
      resendSecret.grantRead(cognitoEmailFn);
    }

    // ---------------------------------------------------------------- Auth
    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 10,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      // Optional authenticator-app (TOTP) MFA — users opt in from their profile.
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: false, otp: true },
      // Branded sign-up/reset emails via Resend (CustomEmailSender) — only when
      // the Resend secret is set (flag), since enabling it disables Cognito's
      // built-in emails.
      ...(config.resendCognitoEmails && emailKey && cognitoEmailFn
        ? { customSenderKmsKey: emailKey, lambdaTriggers: { customEmailSender: cognitoEmailFn } }
        : {}),
      removalPolicy: RemovalPolicy.RETAIN,
    });
    // Hosted-UI domain — required for federated (Google/Apple) OAuth redirects.
    const authDomain = userPool.addDomain("AuthDomain", {
      cognitoDomain: { domainPrefix: config.cognitoDomainPrefix },
    });

    // Secrets hold ONLY the true secrets (public IDs come from context). Created
    // empty; populate after deploy, then set enableSocialLogin=true and redeploy.
    const googleOAuthSecret = new secrets.Secret(this, "GoogleOAuthSecret", {
      description: "Agave — Google OAuth client secret: set { \"clientSecret\": \"...\" }",
    });
    const appleOAuthSecret = new secrets.Secret(this, "AppleOAuthSecret", {
      description: "Agave — Apple Sign in private key (.p8): set { \"privateKey\": \"...\" }",
    });

    // Federated identity providers — each activates independently once its
    // non-secret IDs are set (context) AND its secret is populated. The secret
    // values are read via SecretValue → never baked into the CFN template.
    const clientIdps: cognito.UserPoolClientIdentityProvider[] = [
      cognito.UserPoolClientIdentityProvider.COGNITO,
    ];
    const idpDeps: Construct[] = [];
    if (config.googleClientId) {
      const google = new cognito.UserPoolIdentityProviderGoogle(this, "Google", {
        userPool,
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
        userPool,
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

    // OAuth callback/logout URLs the SPA redirects to (must match Amplify config).
    const oauthUrls = [
      ...(config.domainName ? [`https://${config.domainName}/`] : []),
      "http://localhost:5173/",
    ];
    const userPoolClient = userPool.addClient("WebClient", {
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
    // Providers must exist before the client lists them.
    idpDeps.forEach((d) => userPoolClient.node.addDependency(d));
    new CfnOutput(this, "CognitoAuthDomain", { value: authDomain.baseUrl() });
    new CfnOutput(this, "GoogleOAuthSecretName", { value: googleOAuthSecret.secretName });
    new CfnOutput(this, "AppleOAuthSecretName", { value: appleOAuthSecret.secretName });

    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: userPool.userPoolId,
      groupName: "admins",
      description: "Owner/admin users",
    });

    // ------------------------------------------------------------- Storage
    const uploads = new s3.Bucket(this, "Uploads", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          // Restrict presigned-PUT origins to the app's own domains.
          allowedOrigins: config.domainName
            ? [`https://${config.domainName}`, "https://*.cloudfront.net"]
            : ["*"],
          allowedHeaders: ["*"],
        },
      ],
      lifecycleRules: [{ expiration: Duration.days(365) }],
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const site = new s3.Bucket(this, "SiteBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // WAF for CloudFront (must be us-east-1 — the stack defaults there).
    const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
      defaultAction: { allow: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "agaveWeb",
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: "AWSCommon",
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: "AWS",
              name: "AWSManagedRulesCommonRuleSet",
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "awsCommon",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "RateLimit",
          priority: 2,
          action: { block: {} },
          statement: {
            rateBasedStatement: { limit: 2000, aggregateKeyType: "IP" },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "rateLimit",
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Optional custom domain: ACM cert (us-east-1) + Route53 alias. When
    // domainName/zone context is provided, the cert is DNS-validated through the
    // zone automatically and attached to CloudFront.
    let zone: route53.IHostedZone | undefined;
    let certificate: acm.ICertificate | undefined;
    if (config.domainName && config.hostedZoneId && config.hostedZoneName) {
      zone = route53.HostedZone.fromHostedZoneAttributes(this, "Zone", {
        hostedZoneId: config.hostedZoneId,
        zoneName: config.hostedZoneName,
      });
      certificate = new acm.Certificate(this, "Cert", {
        domainName: config.domainName,
        validation: acm.CertificateValidation.fromDns(zone),
      });
    }

    // Security headers on every site response (HSTS, nosniff, frame + referrer).
    const securityHeaders = new cloudfront.ResponseHeadersPolicy(this, "SecHeaders", {
      securityHeadersBehavior: {
        strictTransportSecurity: { accessControlMaxAge: Duration.days(365), includeSubdomains: true, override: true },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.SAMEORIGIN, override: true },
        referrerPolicy: { referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, override: true },
      },
    });

    const distribution = new cloudfront.Distribution(this, "CDN", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(site),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: securityHeaders,
      },
      defaultRootObject: "index.html",
      webAclId: webAcl.attrArn,
      // User-uploaded bottle photos served + edge-cached from the uploads bucket.
      additionalBehaviors: {
        "media/*": {
          origin: origins.S3BucketOrigin.withOriginAccessControl(uploads),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      ...(config.domainName && certificate
        ? { domainNames: [config.domainName], certificate }
        : {}),
      // SPA fallback: serve index.html for client-side routes. ttl:0 so the
      // fallback is never edge-cached — after a redeploy (assets `--delete`d),
      // a stale index.html would reference gone chunks and white-screen.
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: "/index.html", ttl: Duration.seconds(0) },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: "/index.html", ttl: Duration.seconds(0) },
      ],
    });

    if (zone && config.domainName) {
      new route53.ARecord(this, "AliasRecord", {
        zone,
        recordName: config.domainName,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      });
    }

    // ------------------------------------------------------------ Functions
    const commonEnv = {
      TABLE_NAME: table.tableName,
      ANTHROPIC_SECRET_ARN: anthropicSecret.secretArn,
      ANTHROPIC_ADMIN_SECRET_ARN: anthropicAdminSecret.secretArn,
      UPLOAD_BUCKET: uploads.bucketName,
      USER_POOL_ID: userPool.userPoolId,
      MONTHLY_BUDGET: String(config.monthlyBudget),
      RESEND_SECRET_ARN: resendSecret.secretArn,
      TWILIO_SECRET_ARN: twilioSecret.secretArn,
      APP_ORIGIN: config.domainName ? `https://${config.domainName}` : "",
    };
    const makeFn = (name: string, file: string, handler = "handler", opts: Partial<nodejs.NodejsFunctionProps> = {}) =>
      new nodejs.NodejsFunction(this, name, {
        entry: path.join(FN_ROOT, file),
        handler,
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: Duration.seconds(30),
        memorySize: 256,
        environment: commonEnv,
        // CommonJS output (default): avoids "Dynamic require of 'stream'" from
        // CJS deps (node-fetch via the Anthropic SDK) that break under ESM output.
        bundling: { externalModules: ["@aws-sdk/*"] },
        ...opts,
      });

    const apiFn = makeFn("ApiFn", "api.ts");
    const enrichFn = makeFn("EnrichFn", "enrich.ts", "handler", {
      timeout: Duration.seconds(90),
      memorySize: 512,
    });
    const recognizeFn = makeFn("RecognizeFn", "recognize.ts");
    const integrationsFn = makeFn("IntegrationsFn", "integrations.ts");
    const quizFn = makeFn("QuizGenerateFn", "quizGenerate.ts", "handler", {
      timeout: Duration.seconds(60),
    });
    const adminFn = makeFn("AdminApiFn", "adminApi.ts");
    // Trimmed env (TABLE_NAME only) — must NOT reference userPool, or attaching it
    // as a PostAuthentication trigger creates a circular dependency with the pool.
    const authEventsFn = makeFn("AuthEventsFn", "authEvents.ts", "handler", {
      environment: { TABLE_NAME: table.tableName },
    });
    const costFn = makeFn("CostApiFn", "costApi.ts", "handler", { timeout: Duration.seconds(30) });
    const chatFn = makeFn("ChatFn", "chat.ts", "handler", { timeout: Duration.seconds(30) });
    const inviteFn = makeFn("InviteFn", "invite.ts");
    const reminderFn = makeFn("ReminderSweepFn", "reminderSweep.ts");
    const moderateFn = makeFn("ModerateFn", "moderate.ts", "handler", { timeout: Duration.seconds(30) });
    const prewarmListFn = makeFn("PrewarmListFn", "prewarm.ts", "list");
    const prewarmOneFn = makeFn("PrewarmOneFn", "prewarm.ts", "one", {
      timeout: Duration.seconds(90),
      memorySize: 512,
    });

    // Grants
    table.grantReadWriteData(apiFn);
    table.grantReadWriteData(enrichFn);
    table.grantReadWriteData(quizFn);
    table.grantReadWriteData(prewarmOneFn);
    anthropicSecret.grantRead(enrichFn);
    anthropicSecret.grantRead(quizFn);
    anthropicSecret.grantRead(prewarmOneFn);
    anthropicSecret.grantRead(chatFn);
    table.grantReadWriteData(chatFn); // chat response cache
    table.grantReadData(moderateFn);
    anthropicSecret.grantRead(moderateFn);
    resendSecret.grantRead(inviteFn);
    twilioSecret.grantRead(inviteFn);
    table.grantReadWriteData(reminderFn);
    resendSecret.grantRead(reminderFn);
    twilioSecret.grantRead(reminderFn);
    vapidSecret.grantRead(reminderFn);
    reminderFn.addEnvironment("VAPID_SECRET_ARN", vapidSecret.secretArn);
    vapidSecret.grantRead(apiFn); // adminTestPush
    apiFn.addEnvironment("VAPID_SECRET_ARN", vapidSecret.secretArn);
    // Sweep due reminders every 15 minutes and deliver them once.
    new events.Rule(this, "ReminderSweepSchedule", {
      schedule: events.Schedule.rate(Duration.minutes(15)),
      targets: [new eventsTargets.LambdaFunction(reminderFn)],
    });
    anthropicAdminSecret.grantRead(costFn);
    table.grantReadWriteData(costFn); // 6h cost cache (PK="COST")
    // Scope Anthropic cost/usage reports to this app's workspace when configured.
    if (config.anthropicWorkspaceId)
      costFn.addEnvironment("ANTHROPIC_WORKSPACE_ID", config.anthropicWorkspaceId);
    table.grantReadWriteData(adminFn); // admin audit trail (PK="AUDIT")
    table.grantReadWriteData(authEventsFn); // per-user last-login stamp (SK="#LOGIN")
    table.grantWriteData(moderateFn); // per-feature AI usage logging (PK="AICOST")
    // Tag each Claude-calling Lambda so the wrapper attributes token usage per feature.
    enrichFn.addEnvironment("AI_FEATURE", "enrich");
    chatFn.addEnvironment("AI_FEATURE", "chat");
    quizFn.addEnvironment("AI_FEATURE", "quiz");
    moderateFn.addEnvironment("AI_FEATURE", "moderate");
    prewarmOneFn.addEnvironment("AI_FEATURE", "prewarm");
    // Stamp last-login on every successful sign-in (best-effort; never blocks auth).
    userPool.addTrigger(cognito.UserPoolOperation.POST_AUTHENTICATION, authEventsFn);
    uploads.grantRead(recognizeFn);
    uploads.grantReadWrite(apiFn);

    costFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ce:GetCostAndUsage"],
        resources: ["*"], // Cost Explorer does not support resource-level scoping
      })
    );
    apiFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cloudwatch:DescribeAlarms"],
        resources: ["*"], // DescribeAlarms does not support resource-level scoping
      })
    );
    adminFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "cognito-idp:ListUsers",
          "cognito-idp:ListUsersInGroup",
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminResetUserPassword",
          "cognito-idp:AdminDisableUser",
          "cognito-idp:AdminEnableUser",
          "cognito-idp:AdminDeleteUser",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminCreateUser",
          "cognito-idp:AdminSetUserPassword",
        ],
        resources: [userPool.userPoolArn],
      })
    );

    // ---------------------------------------------------- Step Functions
    // Bottle pipeline: recognize (S3 -> base64) -> enrich (tiered Claude -> cache)
    const pipeline = new sfn.StateMachine(this, "BottlePipeline", {
      definitionBody: sfn.DefinitionBody.fromChainable(
        new tasks.LambdaInvoke(this, "Recognize", {
          lambdaFunction: recognizeFn,
          outputPath: "$.Payload",
        }).next(
          new tasks.LambdaInvoke(this, "Enrich", {
            lambdaFunction: enrichFn,
            outputPath: "$.Payload",
          })
        )
      ),
      timeout: Duration.minutes(5),
    });

    // Pre-warm batch: list manifest -> Map(enrich one), bounded concurrency.
    const mapState = new sfn.Map(this, "PrewarmMap", {
      maxConcurrency: 5,
      itemsPath: "$.Payload",
    }).itemProcessor(
      new tasks.LambdaInvoke(this, "PrewarmOne", {
        lambdaFunction: prewarmOneFn,
        outputPath: "$.Payload",
      })
    );
    const prewarm = new sfn.StateMachine(this, "PrewarmBatch", {
      definitionBody: sfn.DefinitionBody.fromChainable(
        new tasks.LambdaInvoke(this, "PrewarmList", {
          lambdaFunction: prewarmListFn,
        }).next(mapState)
      ),
      timeout: Duration.hours(1),
    });

    // apiFn starts the bottle pipeline on recognizeBottle.
    apiFn.addEnvironment("PIPELINE_ARN", pipeline.stateMachineArn);
    pipeline.grantStartExecution(apiFn);

    // ---------------------------------------------------------- AppSync API
    const api = new appsync.GraphqlApi(this, "Api", {
      name: "agave-api",
      definition: appsync.Definition.fromFile(
        path.join(__dirname, "..", "graphql", "schema.graphql")
      ),
      authorizationConfig: {
        // Default API_KEY: public catalog reads + accountless guest tastings work
        // with the client-embedded key (friends-and-family scale). Account-only
        // fields (upsertReview) are marked @aws_cognito_user_pools in the schema.
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
          apiKeyConfig: { expires: Expiration.after(Duration.days(365)) },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.USER_POOL,
            userPoolConfig: { userPool },
          },
        ],
      },
      xrayEnabled: true,
    });

    const lambdaDs = api.addLambdaDataSource("ApiDs", apiFn);
    const wire = (typeName: "Query" | "Mutation", fields: string[]) =>
      fields.forEach((fieldName) =>
        lambdaDs.createResolver(`${typeName}_${fieldName}`, { typeName, fieldName })
      );
    wire("Query", [
      "listBottles",
      "bottlePopularity",
      "getBottle",
      "getScanResult",
      "listFlights",
      "getSession",
      "listParticipants",
      "listRatings",
      "listReviews",
      "leaderboard",
      "listPendingReviews",
      "getMyProfile",
      "listMyFlights",
      "listMyHistory",
      "listMyFavorites",
      "listMyShelf",
      "listMyReminders",
      "adminAnalytics",
      "adminAlarms",
      "adminAiUsage",
      "adminPageViews",
    ]);
    wire("Mutation", [
      "startSession",
      "advanceSession",
      "joinSession",
      "submitRating",
      "answerQuiz",
      "upsertReview",
      "recognizeBottle",
      "presignUpload",
      "setBottleImage",
      "setReviewModeration",
      "saveMyProfile",
      "saveMyFlight",
      "deleteMyFlight",
      "adminPatchBottle",
      "adminDeleteBottle",
      "saveMyTasting",
      "deleteMyTasting",
      "setFavorite",
      "setShelf",
      "savePushSub",
      "removePushSub",
      "adminTestPush",
      "saveMyReminder",
      "deleteMyReminder",
      "track",
      "submitFeedback",
    ]);

    // The tequila assistant resolves to its own Claude-backed Lambda.
    const chatDs = api.addLambdaDataSource("ChatDs", chatFn);
    chatDs.createResolver("Mutation_askChat", { typeName: "Mutation", fieldName: "askChat" });

    const inviteDs = api.addLambdaDataSource("InviteDs", inviteFn);
    inviteDs.createResolver("Mutation_sendInvite", { typeName: "Mutation", fieldName: "sendInvite" });
    inviteDs.createResolver("Mutation_sendRecap", { typeName: "Mutation", fieldName: "sendRecap" });

    const moderateDs = api.addLambdaDataSource("ModerateDs", moderateFn);
    moderateDs.createResolver("Mutation_moderateReview", { typeName: "Mutation", fieldName: "moderateReview" });

    const adminDs = api.addLambdaDataSource("AdminDs", adminFn);
    adminDs.createResolver("Query_adminListUsers", { typeName: "Query", fieldName: "adminListUsers" });
    adminDs.createResolver("Query_adminGetUser", { typeName: "Query", fieldName: "adminGetUser" });
    adminDs.createResolver("Query_adminAuditLog", { typeName: "Query", fieldName: "adminAuditLog" });
    adminDs.createResolver("Query_adminListFeedback", { typeName: "Query", fieldName: "adminListFeedback" });
    adminDs.createResolver("Mutation_adminUserAction", { typeName: "Mutation", fieldName: "adminUserAction" });

    const costDs = api.addLambdaDataSource("CostDs", costFn);
    costDs.createResolver("Query_adminCosts", { typeName: "Query", fieldName: "adminCosts" });

    // Rate-limit the API itself (the CloudFront WAF only covers the site, not AppSync).
    const apiWaf = new wafv2.CfnWebACL(this, "ApiWaf", {
      scope: "REGIONAL",
      defaultAction: { allow: {} },
      visibilityConfig: { cloudWatchMetricsEnabled: true, metricName: "agaveApi", sampledRequestsEnabled: true },
      rules: [
        {
          name: "ApiRateLimit",
          priority: 1,
          action: { block: {} },
          statement: { rateBasedStatement: { limit: 600, aggregateKeyType: "IP" } },
          visibilityConfig: { cloudWatchMetricsEnabled: true, metricName: "apiRate", sampledRequestsEnabled: true },
        },
      ],
    });
    new wafv2.CfnWebACLAssociation(this, "ApiWafAssoc", {
      resourceArn: api.arn,
      webAclArn: apiWaf.attrArn,
    });

    // -------------------------------------------------------- Monitoring
    const alarmTopic = new sns.Topic(this, "Alarms", { displayName: "Agave alarms" });

    // App alarms use an "agave-" name prefix so the admin dashboard can list only
    // this stack's alarms (the AWS account is shared with other projects).
    const alarmAction = { bind: () => ({ alarmActionArn: alarmTopic.topicArn }) };
    const errAlarm = (id: string, name: string, fn: lambda.IFunction, threshold: number, mins: number) =>
      new cw.Alarm(this, id, {
        alarmName: name,
        metric: fn.metricErrors({ period: Duration.minutes(mins) }),
        threshold,
        evaluationPeriods: 1,
        comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cw.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(alarmAction);

    errAlarm("ApiErrors", "agave-api-errors", apiFn, 5, 5);
    errAlarm("EnrichErrors", "agave-enrich-errors", enrichFn, 3, 15);
    errAlarm("ReminderErrors", "agave-reminder-errors", reminderFn, 2, 15);
    errAlarm("ChatErrors", "agave-chat-errors", chatFn, 5, 15);

    new cw.Alarm(this, "DynamoThrottles", {
      alarmName: "agave-dynamodb-throttles",
      metric: new cw.Metric({
        namespace: "AWS/DynamoDB",
        metricName: "ThrottledRequests",
        dimensionsMap: { TableName: table.tableName },
        statistic: "Sum",
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cw.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // Monthly cost budget ($30, decided) — alerts at 80% and 100%.
    new budgets.CfnBudget(this, "MonthlyBudget", {
      budget: {
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: { amount: config.monthlyBudget, unit: "USD" },
      },
      notificationsWithSubscribers: config.alertEmail
        ? [80, 100].map((pct) => ({
            notification: {
              notificationType: "ACTUAL",
              comparisonOperator: "GREATER_THAN",
              threshold: pct,
              thresholdType: "PERCENTAGE",
            },
            subscribers: [{ subscriptionType: "EMAIL", address: config.alertEmail! }],
          }))
        : [],
    });

    // ------------------------------------------------------------- Outputs
    new CfnOutput(this, "GraphQLUrl", { value: api.graphqlUrl });
    new CfnOutput(this, "GraphQLApiId", { value: api.apiId });
    new CfnOutput(this, "GraphQLApiKey", { value: api.apiKey ?? "" });
    new CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, "UploadsBucket", { value: uploads.bucketName });
    new CfnOutput(this, "SiteBucketName", { value: site.bucketName });
    new CfnOutput(this, "CloudFrontDomain", { value: distribution.distributionDomainName });
    new CfnOutput(this, "PrewarmStateMachine", { value: prewarm.stateMachineArn });
    new CfnOutput(this, "CostFnName", { value: costFn.functionName });
    new CfnOutput(this, "AdminFnName", { value: adminFn.functionName });
    new CfnOutput(this, "IntegrationsFnName", { value: integrationsFn.functionName });
    new CfnOutput(this, "QuizFnName", { value: quizFn.functionName });
    new CfnOutput(this, "ResendSecretArn", { value: resendSecret.secretArn });
    new CfnOutput(this, "TwilioSecretArn", { value: twilioSecret.secretArn });
  }
}
