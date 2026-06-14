#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { loadConfig } from "../lib/config";
import { WineStack } from "../lib/wine-stack";
import { SecurityStack } from "../lib/security-stack";

const app = new cdk.App();
const config = loadConfig(app);
const env = { account: config.account, region: config.region };

// Main application stack (data, auth, storage, API, functions, pipeline, monitoring).
new WineStack(app, "WineStack", { env, config, description: "Wine Roam app — core" });

// Account-level security baseline (GuardDuty / Config / CloudTrail). Optional.
if (config.enableSecurityBaseline) {
  new SecurityStack(app, "WineSecurityStack", {
    env,
    config,
    description: "Wine Roam — account security baseline",
  });
}

app.synth();
