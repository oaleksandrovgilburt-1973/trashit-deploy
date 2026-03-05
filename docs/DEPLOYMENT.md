# TRASHit Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying TRASHit to production using Vercel (frontend) and Supabase (database).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────────┐      │
│  │   Vercel Edge    │         │  Supabase Database   │      │
│  │  (Next.js App)   │◄───────►│  (PostgreSQL + Auth) │      │
│  └──────────────────┘         └──────────────────────┘      │
│           │                            │                     │
│           │                            │                     │
│  ┌────────▼──────────┐      ┌─────────▼──────────┐          │
│  │ Stripe Webhooks   │      │  External Services │          │
│  │ Resend Email      │      │  - Stripe          │          │
│  │ PostHog Analytics │      │  - Resend          │          │
│  │ Sentry Errors     │      │  - PostHog         │          │
│  │ Upstash Redis     │      │  - Sentry          │          │
│  └───────────────────┘      │  - Upstash         │          │
│                              └────────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Accounts & Services

- [ ] GitHub account with repository
- [ ] Vercel account (free tier sufficient)
- [ ] Supabase account (free tier sufficient)
- [ ] Stripe account (live mode)
- [ ] Resend account (email service)
- [ ] PostHog account (analytics)
- [ ] Sentry account (error tracking)
- [ ] Upstash account (Redis rate limiting)

### Tools

```bash
# Install required tools
npm install -g vercel supabase

# Verify installations
vercel --version
supabase --version
```

## Step 1: Prepare Supabase Production Database

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **New Project**
3. Configure:
   - **Project Name:** `trashit-production`
   - **Database Password:** Generate strong password
   - **Region:** `eu-central-1` (EU for GDPR)
   - **Pricing Plan:** Pro ($25/month recommended)
4. Click **Create new project**
5. Wait for project to initialize (5-10 minutes)

### 1.2 Get Database Credentials

1. Go to **Project Settings** → **Database**
2. Copy connection string:
   ```
   postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```
3. Save as `DATABASE_URL`

### 1.3 Run Database Migrations

```bash
# Set environment variables
export SUPABASE_PROJECT_REF="your-project-ref"
export SUPABASE_ACCESS_TOKEN="your-access-token"
export DATABASE_URL="postgresql://..."

# Run setup script
bash scripts/setup-production-db.sh

# Or manually run migrations
supabase link --project-ref $SUPABASE_PROJECT_REF
supabase db push
```

### 1.4 Configure Auth Settings

1. Go to **Authentication** → **Providers**
2. Enable **Email**:
   - Confirm email required: **ON**
   - Confirm email change: **ON**
3. Go to **URL Configuration**
4. Add production URL to **Redirect URLs**:
   ```
   https://your-domain.com/auth/callback
   https://your-domain.com/api/auth/callback
   ```

### 1.5 Configure RLS Policies

RLS policies are automatically created by migrations. Verify:

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Should show 't' (true) for all tables
```

## Step 2: Setup Vercel Deployment

### 2.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Select GitHub repository
4. Configure:
   - **Project Name:** `trashit`
   - **Framework:** Next.js
   - **Root Directory:** `.`
5. Click **Import**

### 2.2 Add Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add all variables from `.env.production.example`:

```env
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Authentication
JWT_SECRET=...
OAUTH_SERVER_URL=https://your-domain.com

# Stripe (LIVE KEYS)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Analytics
NEXT_PUBLIC_POSTHOG_API_KEY=...
NEXT_PUBLIC_SENTRY_DSN=...

# Rate Limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2.3 Configure Custom Domain

1. Go to **Settings** → **Domains**
2. Click **Add**
3. Enter your domain: `your-domain.com`
4. Follow DNS configuration instructions
5. Wait for verification (usually 5-10 minutes)

### 2.4 Deploy

Option 1: Automatic (Recommended)
```bash
# Push to main branch
git push origin main
# Vercel automatically deploys
```

Option 2: Manual
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

## Step 3: Configure External Services

### 3.1 Stripe

**Switch from Test to Live Keys:**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle **Test mode** to OFF (top right)
3. Copy live keys:
   - Secret Key: `sk_live_...`
   - Publishable Key: `pk_live_...`
4. Add to Vercel environment variables

**Configure Webhooks:**

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://your-domain.com/api/v1/webhooks/stripe`
4. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
5. Copy signing secret: `whsec_...`
6. Add to environment variables

**Test Webhook:**

```bash
# Using Stripe CLI
stripe trigger payment_intent.succeeded

# Check webhook logs in Stripe Dashboard
```

### 3.2 Resend Email

**Setup Domain Verification:**

1. Go to [Resend Dashboard](https://resend.com)
2. Click **Domains**
3. Click **Add Domain**
4. Enter your domain
5. Add DNS records:
   - **CNAME:** `bounces.resend.dev`
   - **MX:** `mx1.resend.dev` (priority 10)
   - **MX:** `mx2.resend.dev` (priority 20)
   - **TXT:** `v=spf1 include:sendingdomain.resend.dev ~all`
   - **DKIM:** Follow Resend instructions
6. Wait for verification

**Get API Key:**

1. Go to **API Keys**
2. Create new key
3. Copy and add to environment variables

### 3.3 PostHog Analytics

**Setup Project:**

1. Go to [PostHog](https://posthog.com)
2. Create new project
3. Select **Next.js**
4. Copy API key
5. Add to environment variables:
   ```env
   NEXT_PUBLIC_POSTHOG_API_KEY=...
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

### 3.4 Sentry Error Tracking

**Setup Project:**

1. Go to [Sentry](https://sentry.io)
2. Create new project
3. Select **Next.js**
4. Copy DSN
5. Add to environment variables:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=...
   ```

### 3.5 Upstash Redis

**Create Database:**

1. Go to [Upstash Console](https://console.upstash.com)
2. Create new database
3. Select **Global** region
4. Copy REST URL and token
5. Add to environment variables

## Step 4: Setup CI/CD Pipeline

### 4.1 GitHub Actions

The deployment workflow is configured in `.github/workflows/deploy.yml`

**Triggers:**
- Push to `main` branch
- Manual trigger via GitHub Actions

**Steps:**
1. Lint & format check
2. Run tests
3. Build application
4. Security scan
5. Deploy to Vercel
6. Health check
7. Notify team

### 4.2 Add GitHub Secrets

```bash
# Go to Settings → Secrets and variables → Actions
# Add the following secrets:

VERCEL_TOKEN=...              # From Vercel
VERCEL_ORG_ID=...             # From Vercel
VERCEL_PROJECT_ID=...         # From Vercel
DATABASE_URL=...              # From Supabase
NEXT_PUBLIC_SUPABASE_URL=...  # From Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
STRIPE_SECRET_KEY=...         # LIVE KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
NEXT_PUBLIC_APP_URL=...
NEXT_PUBLIC_POSTHOG_API_KEY=...
NEXT_PUBLIC_SENTRY_DSN=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
SLACK_WEBHOOK=...             # Optional: for notifications
```

## Step 5: Verify Deployment

### 5.1 Application Health

```bash
# Check application loads
curl https://your-domain.com

# Check API health
curl https://your-domain.com/api/health

# Check database connection
curl https://your-domain.com/api/db-health
```

### 5.2 End-to-End Tests

1. **Sign up as customer:**
   - Go to https://your-domain.com
   - Click Sign up
   - Fill form and submit
   - Verify email confirmation

2. **Sign up as provider:**
   - Create new account with provider role
   - Verify provider approval flow

3. **Create request:**
   - Create a service request
   - Verify it appears on dashboard

4. **Check integrations:**
   - **Stripe:** Test payment
   - **Resend:** Check email delivery
   - **PostHog:** Verify events in dashboard
   - **Sentry:** Trigger test error
   - **Upstash:** Check rate limiting

### 5.3 Monitor Dashboards

- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://app.supabase.com
- **Stripe:** https://dashboard.stripe.com
- **Sentry:** https://sentry.io
- **PostHog:** https://posthog.com

## Step 6: Post-Deployment

### 6.1 Monitoring

1. **Set up alerts:**
   - Sentry: Alert on errors
   - Vercel: Alert on deployment failures
   - Supabase: Alert on slow queries

2. **Monitor metrics:**
   - Application performance
   - Error rates
   - User activity
   - Database performance

### 6.2 Backups

1. **Database backups:**
   - Supabase: Automatic daily backups
   - Retention: 30 days

2. **Code backups:**
   - GitHub: Automatic
   - Tag releases: `git tag v1.0.0`

### 6.3 Security

1. **SSL/TLS:**
   - Vercel: Automatic HTTPS
   - Renewal: Automatic

2. **Secrets rotation:**
   - Rotate API keys quarterly
   - Update environment variables
   - Redeploy application

3. **Access control:**
   - Limit team access
   - Use GitHub branch protection
   - Require code review for main branch

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. Verify environment variables
3. Check Vercel build logs
4. Review application errors in Sentry

### Database Connection Issues

1. Verify `DATABASE_URL`
2. Check IP whitelist in Supabase
3. Test connection: `psql $DATABASE_URL -c "SELECT 1"`

### Webhook Not Received

1. Verify endpoint URL
2. Check webhook signing secret
3. Review Stripe webhook logs
4. Check application logs

### Email Not Sending

1. Verify Resend API key
2. Check domain verification
3. Review email logs in Resend dashboard
4. Check spam folder

## Rollback

### If Deployment Fails

1. **Automatic:** Vercel keeps previous deployments
2. **Manual:** Promote previous deployment in Vercel dashboard
3. **Database:** Restore from backup if needed

```bash
# Restore database backup
supabase db restore --backup-id <backup-id>
```

## Maintenance

### Regular Tasks

- [ ] Monitor error rates (Sentry)
- [ ] Review analytics (PostHog)
- [ ] Check database performance (Supabase)
- [ ] Update dependencies (npm)
- [ ] Rotate secrets (quarterly)
- [ ] Review security logs
- [ ] Test disaster recovery

### Monthly

- [ ] Review cost optimization
- [ ] Update documentation
- [ ] Audit access logs
- [ ] Performance optimization

## Support

For issues:
1. Check application logs (Sentry)
2. Review deployment logs (Vercel)
3. Check database logs (Supabase)
4. Review GitHub Actions logs
5. Contact support for respective services

## References

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)
