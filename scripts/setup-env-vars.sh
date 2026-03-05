#!/bin/bash

# Environment Variables Setup Script
# This script helps configure all production environment variables

set -e

echo "🔧 TRASHit Production Environment Setup"
echo "========================================"
echo ""

# Function to prompt for input
prompt_for_value() {
    local var_name=$1
    local description=$2
    local default_value=$3
    local is_secret=$4
    
    echo -n "$var_name"
    if [ -n "$description" ]; then
        echo -n " ($description)"
    fi
    if [ -n "$default_value" ]; then
        echo -n " [default: $default_value]"
    fi
    echo -n ": "
    
    if [ "$is_secret" = "true" ]; then
        read -s value
        echo ""
    else
        read value
    fi
    
    if [ -z "$value" ] && [ -n "$default_value" ]; then
        value=$default_value
    fi
    
    echo "$value"
}

# Create .env.production file
ENV_FILE=".env.production"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  $ENV_FILE already exists"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting..."
        exit 1
    fi
fi

echo ""
echo "📝 Please provide the following values:"
echo ""

# Database Configuration
echo "=== Database (Supabase) ==="
DATABASE_URL=$(prompt_for_value "DATABASE_URL" "PostgreSQL connection string" "" "true")
SUPABASE_URL=$(prompt_for_value "NEXT_PUBLIC_SUPABASE_URL" "Supabase project URL" "" "false")
SUPABASE_ANON_KEY=$(prompt_for_value "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase anon key" "" "true")
SUPABASE_SERVICE_ROLE=$(prompt_for_value "SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key" "" "true")

# Authentication
echo ""
echo "=== Authentication ==="
JWT_SECRET=$(prompt_for_value "JWT_SECRET" "JWT signing secret (generate with: openssl rand -base64 32)" "" "true")
OAUTH_URL=$(prompt_for_value "OAUTH_SERVER_URL" "OAuth server URL" "https://your-domain.com" "false")

# Stripe Configuration
echo ""
echo "=== Stripe (LIVE KEYS) ==="
echo "⚠️  Make sure you're using LIVE keys, not test keys!"
STRIPE_SECRET=$(prompt_for_value "STRIPE_SECRET_KEY" "Stripe secret key (sk_live_...)" "" "true")
STRIPE_PUBLISHABLE=$(prompt_for_value "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Stripe publishable key (pk_live_...)" "" "false")
STRIPE_WEBHOOK=$(prompt_for_value "STRIPE_WEBHOOK_SECRET" "Stripe webhook secret (whsec_...)" "" "true")

# Email Service
echo ""
echo "=== Email Service (Resend) ==="
RESEND_KEY=$(prompt_for_value "RESEND_API_KEY" "Resend API key (re_...)" "" "true")
APP_URL=$(prompt_for_value "NEXT_PUBLIC_APP_URL" "Application public URL" "https://your-domain.com" "false")

# Analytics
echo ""
echo "=== Analytics & Monitoring ==="
POSTHOG_KEY=$(prompt_for_value "NEXT_PUBLIC_POSTHOG_API_KEY" "PostHog API key" "" "true")
SENTRY_DSN=$(prompt_for_value "NEXT_PUBLIC_SENTRY_DSN" "Sentry DSN" "" "false")

# Rate Limiting
echo ""
echo "=== Rate Limiting (Upstash Redis) ==="
UPSTASH_URL=$(prompt_for_value "UPSTASH_REDIS_REST_URL" "Upstash Redis REST URL" "" "false")
UPSTASH_TOKEN=$(prompt_for_value "UPSTASH_REDIS_REST_TOKEN" "Upstash Redis REST token" "" "true")

# Application Settings
echo ""
echo "=== Application Settings ==="
APP_ID=$(prompt_for_value "NEXT_PUBLIC_APP_ID" "Application ID" "trashit-prod" "false")
APP_TITLE=$(prompt_for_value "NEXT_PUBLIC_APP_TITLE" "Application title" "TRASHit" "false")
OWNER_NAME=$(prompt_for_value "OWNER_NAME" "Owner name" "TRASHit" "false")

# Write to .env.production file
cat > "$ENV_FILE" << EOF
# Production Environment Variables
# Generated: $(date)

# ============================================
# Database (Supabase)
# ============================================
DATABASE_URL=$DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE

# ============================================
# Authentication
# ============================================
JWT_SECRET=$JWT_SECRET
OAUTH_SERVER_URL=$OAUTH_URL

# ============================================
# Stripe (LIVE KEYS - NOT TEST)
# ============================================
STRIPE_SECRET_KEY=$STRIPE_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK

# ============================================
# Email Service (Resend)
# ============================================
RESEND_API_KEY=$RESEND_KEY
NEXT_PUBLIC_APP_URL=$APP_URL

# ============================================
# Analytics & Monitoring
# ============================================
NEXT_PUBLIC_POSTHOG_API_KEY=$POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_SENTRY_DSN=$SENTRY_DSN
NEXT_PUBLIC_APP_VERSION=1.0.0

# ============================================
# Rate Limiting (Upstash Redis)
# ============================================
UPSTASH_REDIS_REST_URL=$UPSTASH_URL
UPSTASH_REDIS_REST_TOKEN=$UPSTASH_TOKEN

# ============================================
# Application Settings
# ============================================
NODE_ENV=production
NEXT_PUBLIC_APP_ID=$APP_ID
NEXT_PUBLIC_APP_TITLE=$APP_TITLE
OWNER_NAME=$OWNER_NAME

# ============================================
# Feature Flags
# ============================================
FEATURE_DISPUTES_ENABLED=true
FEATURE_ADMIN_PANEL_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
FEATURE_RATE_LIMITING_ENABLED=true

# ============================================
# Logging
# ============================================
LOG_LEVEL=info
SENTRY_SAMPLE_RATE=0.1
EOF

echo ""
echo "✅ Environment variables saved to $ENV_FILE"
echo ""
echo "Next steps:"
echo "1. Review the generated file:"
echo "   cat $ENV_FILE"
echo ""
echo "2. Add to Vercel:"
echo "   vercel env pull"
echo "   # Then add values to Vercel dashboard"
echo ""
echo "3. Test locally:"
echo "   npm run dev"
echo ""
echo "4. Deploy:"
echo "   git add $ENV_FILE"
echo "   git commit -m 'Add production environment variables'"
echo "   git push origin main"
echo ""
echo "⚠️  Remember to:"
echo "   - Never commit .env.production to git"
echo "   - Keep backups of your environment variables"
echo "   - Rotate secrets periodically"
echo ""
