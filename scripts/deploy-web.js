#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BUCKET = "winestack-sitebucket397a1860-kf1adzicmejt";
const DIST_DIR = path.join(__dirname, "..", "web", "dist");

console.log("Deploying Wine Roam web assets to S3...");

// Get bucket region
const regionOutput = execSync(
  `aws s3api get-bucket-location --bucket ${BUCKET} --query LocationConstraint --output text`,
  { encoding: "utf-8" }
).trim();
const region = regionOutput === "None" ? "us-east-1" : regionOutput;

// Upload dist/ with long cache (immutable assets have content hash in name)
console.log("Uploading immutable assets...");
execSync(
  `aws s3 sync ${DIST_DIR} s3://${BUCKET}/ ` +
    `--region ${region} ` +
    `--exclude "index.html" ` +
    `--cache-control "public, max-age=31536000, immutable" ` +
    `--delete`,
  { stdio: "inherit" }
);

// Upload index.html with no-cache
console.log("Uploading index.html with no-cache...");
execSync(
  `aws s3 cp ${DIST_DIR}/index.html s3://${BUCKET}/ ` +
    `--region ${region} ` +
    `--cache-control "public, max-age=0, must-revalidate" ` +
    `--content-type "text/html; charset=utf-8"`,
  { stdio: "inherit" }
);

// Get CloudFront distribution ID for this bucket
console.log("Finding CloudFront distribution...");
const distros = JSON.parse(
  execSync("aws cloudfront list-distributions --query 'DistributionList.Items[*]' --output json", {
    encoding: "utf-8",
  })
);
const distroId = distros.find((d) =>
  d.Origins.Items.some((o) => o.DomainName.includes(BUCKET))
)?.Id;

if (!distroId) {
  console.error("CloudFront distribution not found");
  process.exit(1);
}

// Invalidate CloudFront cache for index.html and sw.js (only things that can change)
console.log(`Invalidating CloudFront (${distroId})...`);
const invalidation = JSON.parse(
  execSync(
    `aws cloudfront create-invalidation --distribution-id ${distroId} ` +
      `--paths "/index.html" "/sw.js" "/workbox-*.js" ` +
      `--output json`,
    { encoding: "utf-8" }
  )
);
const invalidationId = invalidation.Invalidation.Id;
console.log(`Invalidation ${invalidationId} created. Waiting for completion...`);

// Poll for completion
let status = "InProgress";
let attempts = 0;
while (status === "InProgress" && attempts < 120) {
  const inv = JSON.parse(
    execSync(
      `aws cloudfront get-invalidation --distribution-id ${distroId} ` +
        `--id ${invalidationId} --output json`,
      { encoding: "utf-8" }
    )
  );
  status = inv.Invalidation.Status;
  if (status === "InProgress") {
    process.stdout.write(".");
    attempts++;
    // Wait 2 seconds before polling again
    execSync("sleep 2");
  }
}

console.log("\n" + (status === "Completed" ? "✓ Invalidation completed" : `✗ Invalidation ${status}`));

if (status !== "Completed") {
  process.exit(1);
}
