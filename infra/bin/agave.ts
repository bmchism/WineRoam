#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { loadConfig } from "../lib/config";
import { AgaveStack } from "../lib/agave-stack";
import { SecurityStack } from "../lib/security-stack";

const app = new cdk.App();
const config = loadConfig(app);
const env = { account: config.account, region: config.region };

// Main application stack (data, auth, storage, API, functions, pipeline, monitoring).
new AgaveStack(app, "AgaveStack", { env, config, description: "Agave tequila app — core" });

// Account-level security baseline (GuardDuty / Config / CloudTrail). Optional.
if (config.enableSecurityBaseline) {
  new SecurityStack(app, "AgaveSecurityStack", {
    env,
    config,
    description: "Agave — account security baseline",
  });
}

app.synth();
