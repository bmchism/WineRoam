#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { loadConfig } from "../lib/config";
import { AgaveStack } from "../lib/agave-stack";
import { SecurityStack } from "../lib/security-stack";
import { SpiritAuthStack } from "../lib/spirit-auth-stack";

const app = new cdk.App();
const config = loadConfig(app);
const env = { account: config.account, region: config.region };

// Unified auth: single Cognito User Pool shared by all spirit apps.
const authStack = new SpiritAuthStack(app, "SpiritAuthStack", {
  env,
  config,
  description: "Spirit Roam — unified Cognito auth (shared by Wine, Gin, Bourbon, Tequila, Scotch)",
});

// Main application stack — now imports the shared user pool.
new AgaveStack(app, "AgaveStack", {
  env,
  config,
  description: "Agave tequila app — core",
  userPool: authStack.userPool,
  appClients: authStack.appClients,
});

// Account-level security baseline (GuardDuty / Config / CloudTrail). Optional.
if (config.enableSecurityBaseline) {
  new SecurityStack(app, "AgaveSecurityStack", {
    env,
    config,
    description: "Agave — account security baseline",
  });
}

app.synth();
