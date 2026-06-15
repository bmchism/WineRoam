# Wine Roam — Handoff Document

## Status: Live ✅

**Live URL:** https://wine.roamthrough.com  
**CloudFront:** https://d2r6stc5f8gc0r.cloudfront.net  
**GitHub:** https://github.com/bmchism/WineRoam  
**AWS Account:** 012185415876  
**Region:** us-east-1

---

## Architecture

Same proven stack as Tequila Roam:
- **Frontend:** Vite + React 18 SPA, Framer Motion, PWA (service worker + push)
- **Auth:** Cognito User Pool (us-east-1_P5YwGvzKv), email sign-up, optional MFA
- **API:** AppSync GraphQL (API key for public, Cognito for authenticated)
- **Data:** DynamoDB single-table design (PK/SK + GSI1)
- **Functions:** 14 Node.js 20 Lambdas (api, enrich, chat, quiz, admin, cost, etc.)
- **AI:** Anthropic Claude (Haiku/Sonnet/Opus tiered), Secrets Manager key
- **CDN:** CloudFront + WAF + S3 (site + uploads buckets)
- **Pipeline:** Step Functions (recognize → enrich, prewarm batch)
- **Monitoring:** CloudWatch alarms, SNS, budget alerts ($30/mo)

---

## Key Credentials

| Resource | Value |
|---|---|
| Admin login | bmchism@gmail.com / `WineRoam2024!` |
| Cognito Pool | us-east-1_P5YwGvzKv |
| Cognito Client | 7gnj7759q9ar569028j8jp89ud |
| AppSync URL | https://q2utqnwa5zgv7eixs3fhvkudla.appsync-api.us-east-1.amazonaws.com/graphql |
| API Key | da2-d4yzdknkofhzxfatnmffsadyse |
| Site Bucket | winestack-sitebucket397a1860-kf1adzicmejt |
| Uploads Bucket | winestack-uploads4f6eb0fd-9gmhqfxmgvav |
| CloudFront Dist | E161HCK2I5A8GA |
| Prewarm SM | arn:aws:states:us-east-1:012185415876:stateMachine:PrewarmBatchA674E2B5-b3u0vb3ZxzQj |

---

## Domain Transforms (Tequila → Wine)

| Tequila Concept | Wine Equivalent |
|---|---|
| Expression (Blanco/Reposado/Añejo...) | Wine Type (Red/White/Rosé/Sparkling/Dessert/Orange) |
| Distillery / NOM | Winery / Producer |
| Agave Region | Wine Region / Appellation |
| Additive-Free | Organic / Biodynamic / Natural |
| Agave variety | Grape varieties |
| Tequila scoring (color/aroma/flavor/finish) | WSET framework (appearance/nose/palate/finish) |

---

## Wine Catalog

- **Seed manifest:** 2,143 wines from 905 producers (`seed/top-wines.ts`)
- **Local seed (frontend):** 17 benchmark wines (`web/src/data/bottles.ts`)
- **Wineries:** 20 notable producers (`web/src/data/wineries.ts`)
- **Flights:** 8 curated tastings (`web/src/data/flights.ts`)
- **Educational content:** Wine 101, WSET tasting method, winemaking process

---

## What Works

- ✅ Landing page, sign-up/sign-in, admin access
- ✅ Wine catalog (local seed data, 17 wines)
- ✅ Flight builder + curated flights
- ✅ Tasting runner with WSET-style scoring
- ✅ Quiz generation (local, rule-based)
- ✅ Live tasting (host/join via QR, real-time sync via AppSync subscriptions)
- ✅ AI chat widget (Claude-powered wine assistant)
- ✅ Bottle scan (camera → S3 → recognize → enrich)
- ✅ Admin dashboard (users, analytics, costs, alarms)
- ✅ PWA (installable, offline-capable, push notifications)
- ✅ Custom domain: wine.roamthrough.com with ACM cert + HSTS
- ✅ Security: WAF, rate limiting, CORS, security headers

---

## Known Issues / TODO

1. **Prewarm pipeline not populating DynamoDB yet** — The Anthropic API key is set, Lambda calls Claude successfully, but the enriched bottles aren't appearing in `listBottles`. Debug needed in the enrich → DynamoDB write path (PK/SK pattern) and the acceptance function (`j.nom` check).

2. **Google OAuth not enabled** — The `googleClientId` was removed from cdk.json to allow initial deploy (secret was empty). To re-enable: populate the Google OAuth secret, add the client ID back, redeploy.

3. **Logo SVG** — The `/logo.svg` and `/favicon.svg` are still from the original tequila app. Replace with wine-branded assets.

4. **Remaining 357 wines** — Manifest is at 2,143 of targeted 2,500.

---

## Deploy Commands

```bash
# Frontend build + deploy
cd web && npm run build
aws s3 sync dist s3://winestack-sitebucket397a1860-kf1adzicmejt --delete --cache-control "public,max-age=31536000,immutable" --exclude index.html
aws s3 cp dist/index.html s3://winestack-sitebucket397a1860-kf1adzicmejt/index.html --cache-control "no-cache" --content-type text/html
aws cloudfront create-invalidation --distribution-id E161HCK2I5A8GA --paths "/*"

# Infrastructure
cd infra && npx cdk deploy WineStack --require-approval never

# Run prewarm (in batches of 400)
aws stepfunctions start-execution --state-machine-arn arn:aws:states:us-east-1:012185415876:stateMachine:PrewarmBatchA674E2B5-b3u0vb3ZxzQj --input '{"offset": 0, "limit": 400}'
```

---

## Cost Estimate

- **AWS monthly:** ~$5-15 (mostly CloudFront + Lambda, pay-per-request DynamoDB)
- **Anthropic (prewarm 2,143 wines):** ~$5-6 one-time
- **Anthropic (chat/quiz/scan ongoing):** ~$2-5/month depending on usage
- **Budget alert:** Set at $30/month

---

## File Structure

```
WineRoam2/
├── web/                 # React SPA (Vite)
│   ├── src/
│   │   ├── pages/       # 27 route pages
│   │   ├── components/  # 27 shared components
│   │   ├── lib/         # Auth, API, tasting logic, offline
│   │   ├── data/        # Seed data (bottles, wineries, flights, learn, process)
│   │   └── types.ts     # Domain types
│   └── public/          # Static assets
├── infra/               # CDK infrastructure
│   ├── bin/wine.ts      # CDK app entry
│   ├── lib/wine-stack.ts# Main stack (all resources)
│   └── graphql/         # AppSync schema
├── functions/src/       # Lambda handlers
├── shared/              # @agave/shared types (backend + frontend)
├── seed/                # Wine manifest (2,143 entries)
└── HANDOFF.md           # This file
```
