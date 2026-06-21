# Spirit Roam — Unified Auth Integration Guide

Apply this to each spirit app repo (Gin, Bourbon, Scotch, Tequila) to connect them to the shared Cognito User Pool.

## Cognito Pool Details

| Resource | Value |
|---|---|
| **Pool ID** | `us-east-1_JWONaq4Kj` |
| **Auth Domain** | `spirit-roam.auth.us-east-1.amazoncognito.com` |
| **Wine Client** | `2223u4fnmbamgp2m5l9sdknut7` |
| **Gin Client** | `12gql9qndn85e26cgodkdhlm6c` |
| **Bourbon Client** | `6c6aung2pdt9o6t0ntrpf809ui` |
| **Tequila Client** | `49vahe3ca0u59rff9ndpqohna0` |
| **Scotch Client** | `28ce463bvdb9l7e47spllk1hp8` |
| **Admin** | `bmchism@gmail.com` / `Spirits2026!` |

## Step 1: Update `web/.env`

```env
VITE_USER_POOL_ID=us-east-1_JWONaq4Kj
VITE_USER_POOL_CLIENT_ID=<client ID for this spirit from table above>
VITE_COGNITO_DOMAIN=spirit-roam.auth.us-east-1.amazoncognito.com
```

## Step 2: Install shared package (optional)

If you want to use the shared `SpiritsNav` and `SpiritAuthProvider`:

```bash
# Copy shared/ from the monorepo, or add it as a git subtree/submodule
cp -R ~/Desktop/WineRoam2/shared ./shared
```

Add to your root `package.json` workspaces: `"shared"`

## Step 3: Add SpiritsNav to your app

In your `src/main.tsx` (or equivalent), the existing `configureAmplify()` call already
reads from `VITE_USER_POOL_ID` and `VITE_USER_POOL_CLIENT_ID`, so just updating `.env`
is enough. The auth provider you already have (`AuthProvider` / `useAuth`) works
unchanged against the shared pool.

To add the cross-app nav bar, import `SpiritsNav`:

```tsx
import { SpiritsNav } from "@agave/shared/components";

// In your App component, above the main content:
<SpiritsNav currentApp="gin" />
```

The nav shows links to all 5 spirit apps + user state + sign out.

## Step 4: How cross-app auth works

Since all 5 apps point to the **same Cognito User Pool**, the user's account exists once:
- Sign up on any app → account is created in the shared pool
- Sign in on any app → same email/password works everywhere
- The `admins` group is pool-wide → bmchism@gmail.com is admin on all apps

**Important**: Cognito tokens (JWTs) are scoped to the App Client that issued them.
So a user signed into Wine won't have a valid session on Gin unless they also sign in
there. This is by design — each app is a separate SPA with its own session storage.

For true SSO (sign in once, auto-authenticated everywhere), you'd need to use the
Cognito Hosted UI with authorization code flow across domains. The current setup
requires the user to sign in on each domain, but with the **same credentials**.

## Step 5: Deploy

```bash
# Rebuild with new env vars
cd web && npm run build

# Deploy to your app's S3/CloudFront
aws s3 sync dist s3://{your-site-bucket} --delete --cache-control "public,max-age=31536000,immutable" --exclude index.html
aws s3 cp dist/index.html s3://{your-site-bucket}/index.html --cache-control "no-cache" --content-type text/html
aws cloudfront create-invalidation --distribution-id {your-dist-id} --paths "/*"
```

## Callback URLs

The SpiritAuthStack has callback URLs configured for all domains:
- `https://{spirit}.roamthrough.com/`
- `https://{spirit}.roamthrough.com/callback`
- `https://spirits.roamthrough.com/`
- `https://spirits.roamthrough.com/callback`
- `http://localhost:5173/` (dev)
- `http://localhost:5173/callback` (dev)

## Hub Site

The spirits landing page lives at `https://spirits.roamthrough.com` and provides:
- Links to all 5 spirit apps
- A sign-in/sign-up form (against the shared pool)
- Navigation between all apps

---

## Quick Checklist

- [ ] Update `web/.env` with shared pool ID + app-specific client ID
- [ ] Rebuild and deploy frontend
- [ ] Test: sign in with `bmchism@gmail.com` / `Spirits2026!`
- [ ] Verify admin dashboard works
- [ ] (Optional) Add `SpiritsNav` component to your layout
