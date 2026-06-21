#!/bin/bash
# =============================================================================
# Spirit Roam — Unified Auth Migration
# =============================================================================
# This script:
# 1. Deploys the SpiritAuthStack (shared Cognito User Pool)
# 2. Creates the unified admin account (bmchism@gmail.com)
# 3. Deletes the old per-app bmchism@gmail.com accounts from legacy pools
#
# Prerequisites:
#   - AWS CLI configured with account 012185415876
#   - CDK bootstrapped in us-east-1
#   - Run from the project root: ./scripts/unify-auth.sh
# =============================================================================

set -euo pipefail

ADMIN_EMAIL="bmchism@gmail.com"
REGION="us-east-1"

echo "╔══════════════════════════════════════════════════╗"
echo "║   Spirit Roam — Unified Auth Migration          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# --------------------------------------------------------------- Step 1: Deploy
echo "▶ Step 1: Deploying SpiritAuthStack..."
cd infra
npx cdk deploy SpiritAuthStack --require-approval never
echo "  ✓ SpiritAuthStack deployed"
echo ""

# Get the new shared pool ID from stack outputs
SHARED_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name SpiritAuthStack \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
  --output text)

echo "  Shared Pool ID: $SHARED_POOL_ID"
echo ""

# --------------------------------------------------------------- Step 2: Create Admin
echo "▶ Step 2: Creating unified admin account..."

# Check if user already exists in the shared pool
if aws cognito-idp admin-get-user \
  --user-pool-id "$SHARED_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --region "$REGION" &>/dev/null; then
  echo "  User already exists in shared pool — resetting password..."
  aws cognito-idp admin-set-user-password \
    --user-pool-id "$SHARED_POOL_ID" \
    --username "$ADMIN_EMAIL" \
    --password 'Spirits2026!' \
    --permanent \
    --region "$REGION"
else
  echo "  Creating new admin user..."
  aws cognito-idp admin-create-user \
    --user-pool-id "$SHARED_POOL_ID" \
    --username "$ADMIN_EMAIL" \
    --user-attributes Name=email,Value="$ADMIN_EMAIL" Name=email_verified,Value=true \
    --message-action SUPPRESS \
    --region "$REGION"

  aws cognito-idp admin-set-user-password \
    --user-pool-id "$SHARED_POOL_ID" \
    --username "$ADMIN_EMAIL" \
    --password 'Spirits2026!' \
    --permanent \
    --region "$REGION"
fi

# Add to admins group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id "$SHARED_POOL_ID" \
  --username "$ADMIN_EMAIL" \
  --group-name admins \
  --region "$REGION"

echo "  ✓ Admin account ready: $ADMIN_EMAIL (admins group)"
echo ""

# --------------------------------------------------------------- Step 3: Cleanup Legacy Pools
echo "▶ Step 3: Removing bmchism@gmail.com from legacy per-app pools..."
echo "  (Skipping any roamthrough.com accounts)"
echo ""

# Known legacy pool IDs — add yours here.
# These are the per-app pools that each spirit fork created independently.
LEGACY_POOLS=(
  "us-east-1_P5YwGvzKv"    # Wine Roam (from HANDOFF.md)
  # Add other legacy pool IDs as you discover them:
  # "us-east-1_XXXXXXXXX"  # Tequila Roam
  # "us-east-1_XXXXXXXXX"  # Bourbon Roam
  # "us-east-1_XXXXXXXXX"  # Gin Roam
  # "us-east-1_XXXXXXXXX"  # Scotch Roam
)

for POOL_ID in "${LEGACY_POOLS[@]}"; do
  # Skip if this IS the shared pool (shouldn't happen, but be safe)
  if [ "$POOL_ID" = "$SHARED_POOL_ID" ]; then
    echo "  ⊘ Skipping $POOL_ID (this is the shared pool)"
    continue
  fi

  echo "  → Pool: $POOL_ID"
  if aws cognito-idp admin-get-user \
    --user-pool-id "$POOL_ID" \
    --username "$ADMIN_EMAIL" \
    --region "$REGION" &>/dev/null; then
    aws cognito-idp admin-delete-user \
      --user-pool-id "$POOL_ID" \
      --username "$ADMIN_EMAIL" \
      --region "$REGION"
    echo "    ✓ Deleted $ADMIN_EMAIL from $POOL_ID"
  else
    echo "    ⊘ User not found in $POOL_ID (already clean)"
  fi
done

echo ""

# --------------------------------------------------------------- Step 4: Redeploy WineStack
echo "▶ Step 4: Redeploying WineStack with shared auth..."
npx cdk deploy WineStack --require-approval never
echo "  ✓ WineStack deployed with unified auth"
echo ""

# Print the client IDs for each spirit app
echo "╔══════════════════════════════════════════════════╗"
echo "║   Unified Auth — App Client IDs                 ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

for SPIRIT in Wine Gin Bourbon Tequila Scotch; do
  CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name SpiritAuthStack \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='${SPIRIT}ClientId'].OutputValue" \
    --output text 2>/dev/null || echo "not yet deployed")
  echo "  $SPIRIT: $CLIENT_ID"
done

echo ""
echo "══════════════════════════════════════════════════"
echo "  DONE. Unified admin: $ADMIN_EMAIL"
echo "  Pool ID: $SHARED_POOL_ID"
echo ""
echo "  Next steps for each spirit fork:"
echo "  1. Set spiritApp context to the spirit name"
echo "  2. Update web/.env with VITE_USER_POOL_ID=$SHARED_POOL_ID"
echo "  3. Update VITE_USER_POOL_CLIENT_ID with the app-specific client above"
echo "  4. Rebuild and deploy the frontend"
echo "══════════════════════════════════════════════════"
