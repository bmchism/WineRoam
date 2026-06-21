# Spirit Roam — Unified Auth

## Overview

All spirit applications (Wine, Gin, Bourbon, Tequila, Scotch) share a **single Cognito User Pool** via the `SpiritAuthStack`. Users sign up once and can access any spirit app with the same email/password.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SpiritAuthStack                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Shared Cognito User Pool                │    │
│  │                                                 │    │
│  │  • Email sign-in, self sign-up                  │    │
│  │  • TOTP MFA (optional)                          │    │
│  │  • Google + Apple federation (when enabled)     │    │
│  │  • "admins" group                               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  App Clients (one per spirit, distinct callback URLs):  │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌────┐ │
│  │  Wine  │ │  Gin   │ │ Bourbon │ │ Tequila │ │Scot│ │
│  └────────┘ └────────┘ └─────────┘ └─────────┘ └────┘ │
└─────────────────────────────────────────────────────────┘
         │          │          │          │          │
         ▼          ▼          ▼          ▼          ▼
   WineStack   GinStack  BourbonStack AgaveStack ScotchStack
   (imports     (imports   (imports     (imports   (imports
    pool)        pool)      pool)        pool)      pool)
```

## Admin Account

| Field | Value |
|---|---|
| Email | bmchism@gmail.com |
| Password | Spirits2026! |
| Group | admins |
| Scope | All spirit apps |

## How It Works

1. `SpiritAuthStack` creates one User Pool with five App Clients
2. Each App Client has callback URLs scoped to its spirit domain (e.g. `wine.roamthrough.com`)
3. Each app stack (WineStack, etc.) receives the shared `userPool` and its app-specific client via props
4. The frontend `.env` references the shared pool ID + its app-specific client ID
5. Any user who signs up on one app can sign in on any other app with the same credentials

## Deploying

```bash
# First time (or after changing auth config):
./scripts/unify-auth.sh

# Each spirit app just needs to know its client ID:
# In web/.env:
VITE_USER_POOL_ID=<shared pool id from SpiritAuthStack outputs>
VITE_USER_POOL_CLIENT_ID=<spirit-specific client id from SpiritAuthStack outputs>
```

## Forking a New Spirit App

When using FORK-SPEC.md to create a new spirit fork:
1. Set `"spiritApp": "{spirit}"` in `cdk.json` (must be one of: wine, gin, bourbon, tequila, scotch)
2. Set `"useSharedAuth": "true"` (default)
3. The app stack will automatically use the shared pool — no per-app Cognito setup needed
4. No need to create an admin user — bmchism@gmail.com already has access

## Migration from Per-App Pools

The `scripts/unify-auth.sh` script handles:
1. Deploying SpiritAuthStack
2. Creating the admin account with unified password
3. Deleting the old bmchism@gmail.com from legacy per-app pools
4. Redeploying WineStack to use the shared pool

Add legacy pool IDs to the `LEGACY_POOLS` array in the script before running.
