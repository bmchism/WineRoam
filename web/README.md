# Agave — web (PWA)

Phase C: local catalog + Learn module. Claude-generated seed catalog of well-known
additive-free tequilas across all four expressions (illustrative reference data,
editable later in admin). No AWS yet — runs fully local.

## Run

```bash
cd web
npm install
npm run dev      # http://localhost:5173
```

`npm run build` — type-check + production build (PWA service worker generated).

## Stack

- React 18 + TypeScript + Vite
- React Router (Learn / Catalog / bottle detail / Tastings + Profile stubs)
- framer-motion (card/hero motion)
- vite-plugin-pwa (installable, offline-ready shell)
- Warm-premium-agave design system in `src/index.css` (Fraunces + Inter, amber/cream/agave tokens)

## Structure

```
src/
  types.ts            Bottle / Distillery / Learn data model (mirrors future DynamoDB)
  data/               Seed: bottles.ts, distilleries.ts, learn.ts (from the doc)
  components/         AppBar, BottomNav, BottleCard
  pages/              Learn, LearnArticle, Catalog, BottleDetail, Tastings, Profile
  icons.tsx           Inline line icons (agave motif)
```

## What's stubbed (later phases)

- Tastings page → live hosting/join/quiz (Phases 5–6)
- Profile → Cognito accounts (Phase 4)
- Bottle detail → reviews & personal notes (Phase 4)
- Bottle scan → Claude vision pipeline (Phase 3)

Seed data lives in `web/src/data` for now; it migrates to a top-level `seed/` + `shared/`
package when the CDK backend lands (BUILD_PLAN.md §7).
