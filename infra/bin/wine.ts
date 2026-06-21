#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { loadConfig } from "../lib/config";
import { WineStack } from "../lib/wine-stack";
import { SecurityStack } from "../lib/security-stack";
import { SpiritAuthStack } from "../lib/spirit-auth-stack";

const app = new cdk.App();
const config = loadConfig(app);
const env = { account: config.account, region: config.region };

// Unified auth: single Cognito User Pool shared by all spirit apps.
// Deploy this stack once — all app stacks reference it.
const authStack = new SpiritAuthStack(app, "SpiritAuthStack", {
  env,
  config,
  description: "Spirit Roam — unified Cognito auth (shared by Wine, Gin, Bourbon, Tequila, Scotch)",
});

// Main application stack (data, storage, API, functions, pipeline, monitoring).
// Now imports the shared user pool instead of creating its own.
new WineStack(app, "WineStack", {
  env,
  config,
  description: "Wine Roam app — core",
  userPool: authStack.userPool,
  appClients: authStack.appClients,
});

// Account-level security baseline (GuardDuty / Config / CloudTrail). Optional.
if (config.enableSecurityBaseline) {
  new SecurityStack(app, "WineSecurityStack", {
    env,
    config,
    description: "Wine Roam — account security baseline",
  });
}

app.synth();
