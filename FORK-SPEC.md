# Spirit Roam — Fork Spec

## How to create a new `{spirit}.roamthrough.com` app

This spec documents every file and value that changes between spirits. The architecture, infrastructure, features, and component structure are **100% shared** — only the domain content differs.

---

## Prerequisites

- AWS account 012185415876 with CDK bootstrapped
- Anthropic API key (shared workspace: `wrkspc_01EWTjYKfBXnfepKr3xh94p9`)
- Route53 hosted zone for roamthrough.com (`Z03017282RUCK867AHXWY`)
- GitHub account (bmchism)

## Estimated Cost & Time

| Step | Time | Cost |
|---|---|---|
| Fork + rebrand + deploy | 20 min | $0 |
| Prewarm 2,000 bottles (Haiku) | 3 min | ~$5 |
| **Total** | **~25 min** | **~$5** |
| Monthly run cost | — | ~$10-15 |

---

## Step 1: Copy the Template

```bash
cp -R ~/Desktop/WineRoam2 ~/Desktop/{Spirit}Roam
cd ~/Desktop/{Spirit}Roam
rm -rf node_modules web/node_modules infra/cdk.out* .git
```

---

## Step 2: Fill the Domain Config

All spirit-specific values are consolidated into these files:

### 2a. `SPIRIT_CONFIG` — Master values to define

| Variable | Example (Bourbon) | Example (Whisky) |
|---|---|---|
| `SPIRIT_NAME` | Bourbon | Whisky |
| `APP_NAME` | Bourbon Roam | Whisky Roam |
| `DOMAIN` | bourbon.roamthrough.com | whisky.roamthrough.com |
| `COGNITO_PREFIX` | bourbon-roam | whisky-roam |
| `STACK_NAME` | BourbonStack | WhiskyStack |
| `THEME_COLOR` | #B5651D (amber) | #C28A3D (gold) |
| `ACCENT_SOFT` | #C77D3A | #D4A574 |
| `HERO_IMAGE` | Unsplash URL (distillery/barrels) | Unsplash URL (highlands/barley) |
| `BRAND_ICON` | Barrel/tumbler SVG | Pot still/thistle SVG |
| `EXPRESSION_TYPE` | BourbonStyle | WhiskyStyle |
| `EXPRESSIONS` | ["Straight", "Single Barrel", "Small Batch", "Bottled-in-Bond", "Wheated", "High Rye", "Barrel Proof"] | ["Single Malt", "Blended", "Blended Malt", "Single Grain", "Cask Strength", "Peated"] |
| `PRODUCER_TERM` | Distillery | Distillery |
| `PRODUCER_ID_TERM` | DSP (Distilled Spirits Plant) | Distillery |
| `REGION_TERM` | State/County | Region |
| `QUALITY_BADGE` | Bottled-in-Bond | Single Cask |
| `TASTING_DIMS` | color, nose, palate, finish | color, nose, palate, finish |
| `CHAT_SYSTEM` | "You are Bourbon Roam's in-app bourbon guide..." | "You are Whisky Roam's in-app whisky guide..." |
| `ENRICH_SYSTEM` | "You are a bourbon expert building structured catalog entries..." | "You are a whisky expert building structured catalog entries..." |

---

## Step 3: Files to Modify (13 files)

### Infrastructure (4 files)

| File | What changes |
|---|---|
| `infra/cdk.json` | `app` entry point, `cognitoDomainPrefix`, `domainName` |
| `infra/bin/{spirit}.ts` | Stack class name, description |
| `infra/lib/config.ts` | Interface name, default cognitoDomainPrefix |
| `infra/lib/{spirit}-stack.ts` | Class name, secret descriptions, API name, WAF metrics, alarm prefixes |

### Frontend Data Layer (5 files)

| File | What changes |
|---|---|
| `web/src/types.ts` | `Expression` type (the style categories), `EXPRESSIONS` array |
| `web/src/data/bottles.ts` | Seed bottles (15-20 benchmark examples), accent color map |
| `web/src/data/wineries.ts` → `distilleries.ts` | Seed producers (15-20) |
| `web/src/data/flights.ts` | 6-8 curated tasting flights |
| `web/src/data/learn.ts` | 3-4 educational articles + style guides |
| `web/src/data/process.ts` | 6-8 stage production process |

### Frontend Branding (3 files)

| File | What changes |
|---|---|
| `web/src/index.css` | `--amber` (theme color), `--amber-soft`, dark theme override |
| `web/src/icons.tsx` | `WineMark` → `{Spirit}Mark` SVG path |
| `web/vite.config.ts` | PWA `name`, `short_name`, `description`, `theme_color` |

### Backend AI Prompts (2 files)

| File | What changes |
|---|---|
| `functions/src/chat.ts` | `SYSTEM` prompt (spirit expertise, topics, constraints) |
| `functions/src/enrich.ts` | `SYSTEM` prompt (JSON shape with spirit-specific fields), `ACCENTS` map |

### Seed Manifest (1 file)

| File | What changes |
|---|---|
| `seed/top-{spirit}s.ts` | 1,500-2,500 bottles organized by producer |

---

## Step 4: Branding Sweep (find-and-replace)

After modifying the 13 files above, do a project-wide sweep:

```bash
# In web/src/pages/ and web/src/components/:
find web/src -name "*.tsx" -exec sed -i '' \
  's/Wine Roam/{APP_NAME}/g; s/wine tasting/{spirit} tasting/g; s/wine/{spirit}/g; s/Wine/{Spirit}/g' {} \;
```

Key strings to replace in UI copy:
- App name in AppBar, Landing, Home, About, FAQ, Privacy, Terms
- ChatWidget greeting + suggestions
- Onboarding steps
- BottomNav/TopNav label ("Wines" → "{Spirits}")
- Catalog page title + description
- LegalFooter + Disclaimer

---

## Step 5: Deploy

```bash
# 1. Install deps
npm install

# 2. Verify build
cd web && npm run build && cd ..

# 3. Deploy infrastructure (creates new stack, ~5 min)
cd infra && npx cdk deploy {StackName} --require-approval never

# 4. Set Anthropic API key in the new stack's secret
aws secretsmanager put-secret-value \
  --secret-id {AnthropicKey secret from outputs} \
  --secret-string '{"apiKey":"sk-ant-api03-..."}'

# 5. Update web/.env from stack outputs
# VITE_GRAPHQL_URL, VITE_GRAPHQL_API_KEY, VITE_USER_POOL_ID, etc.

# 6. Build + deploy frontend
cd web && npm run build
aws s3 sync dist s3://{site-bucket} --delete --cache-control "public,max-age=31536000,immutable" --exclude index.html
aws s3 cp dist/index.html s3://{site-bucket}/index.html --cache-control "no-cache" --content-type text/html
aws cloudfront create-invalidation --distribution-id {dist-id} --paths "/*"

# 7. Create admin user
aws cognito-idp admin-create-user --user-pool-id {pool-id} --username bmchism@gmail.com \
  --user-attributes Name=email,Value=bmchism@gmail.com Name=email_verified,Value=true \
  --temporary-password '{Spirit}Roam2024!' --message-action SUPPRESS
aws cognito-idp admin-set-user-password --user-pool-id {pool-id} --username bmchism@gmail.com --password '{Spirit}Roam2024!' --permanent
aws cognito-idp admin-add-user-to-group --user-pool-id {pool-id} --username bmchism@gmail.com --group-name admins

# 8. Run prewarm (in batches of 400)
for offset in 0 400 800 1200 1600 2000; do
  aws stepfunctions start-execution \
    --state-machine-arn {prewarm-arn} \
    --input "{\"offset\": $offset, \"limit\": 400}"
done

# 9. Push to GitHub
git init && git add -A && git commit -m "Initial {APP_NAME} deploy"
gh repo create bmchism/{Spirit}Roam --public --source=. --push
```

---

## Domain-Specific Content Templates

### Bourbon Example

**Expressions:** Straight, Single Barrel, Small Batch, Bottled-in-Bond, Wheated, High Rye, Barrel Proof, Rye Whiskey

**Producer = Distillery.** ID = DSP number. Region = Kentucky county / state.

**Production Process:** Grain (corn/rye/wheat/barley) → Milling → Mashing → Fermentation → Distillation → Barreling → Aging (new charred oak) → Proofing & Bottling

**Tasting Framework:** Color (straw → deep amber), Nose (5 scale), Palate (5 scale), Finish (5 scale), Overall (10 scale)

**Quality Badge:** "Bottled-in-Bond" (100 proof, single distillery, single season, 4+ years)

**Seed producers:** Buffalo Trace, Maker's Mark, Woodford Reserve, Wild Turkey, Four Roses, Heaven Hill, Jim Beam, Elijah Craig, Blanton's, Pappy Van Winkle, Weller, Eagle Rare, Knob Creek, Bulleit, Old Forester, Michter's, Angel's Envy, Russell's Reserve, 1792, Larceny

### Scotch Whisky Example

**Expressions:** Single Malt, Blended, Blended Malt, Single Grain, Cask Strength, Peated, Sherry Cask, Bourbon Cask

**Producer = Distillery.** ID = Distillery name. Region = Speyside/Islay/Highland/Lowland/Campbeltown/Islands.

**Production Process:** Malting → Mashing → Fermentation → Distillation (pot stills) → Maturation (ex-bourbon/sherry casks, 3+ years) → Vatting/Blending → Bottling

**Quality Badge:** "Single Cask" or "Cask Strength"

---

## Shared Infrastructure (never changes)

These files are identical across all spirit forks:
- `infra/graphql/schema.graphql`
- `infra/lib/security-stack.ts`
- `functions/src/api.ts`
- `functions/src/adminApi.ts`
- `functions/src/authEvents.ts`
- `functions/src/cognitoEmail.ts`
- `functions/src/costApi.ts`
- `functions/src/integrations.ts`
- `functions/src/invite.ts`
- `functions/src/moderate.ts`
- `functions/src/quizGenerate.ts`
- `functions/src/recognize.ts`
- `functions/src/reminderSweep.ts`
- `functions/src/lib/*` (all helper modules)
- `shared/src/*` (shared types — Bottle interface with backward-compat aliases)
- `web/src/components/*` (all 27 components — generic)
- `web/src/lib/*` (all utility modules — generic)
- `web/src/pages/Admin.tsx`, `Profile.tsx`, `TastingRunner.tsx`, etc. (generic)

---

## Cost Breakdown Per Spirit App

| Resource | Monthly Cost |
|---|---|
| CloudFront | $0-1 |
| DynamoDB (on-demand) | $0-1 |
| Lambda | $0-2 |
| AppSync | $0-1 |
| WAF (2 WebACLs) | $10 |
| Cognito | $0 (under 50K MAU) |
| Secrets Manager | $2-3 |
| Route53 | $0.50 |
| S3 | $0-1 |
| **Total** | **~$15/month** |
| Anthropic (chat/scan) | ~$2-5/month |
| Anthropic (prewarm, one-time) | ~$5 |
