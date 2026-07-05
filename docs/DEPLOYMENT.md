# Production Deployment Guide

This guide walks through deploying Hanshitha Auctions to a production environment
using the recommended stack: **Vercel** (app) + **Neon** (Postgres) + **Cloudflare R2**
(documents) + **Resend** (email) + **Razorpay** (payments) + **Sentry** (errors,
optional).

Total fixed cost at MVP scale: ~₹0 — all providers below have generous free tiers.

---

## 0. Pre-flight checklist

Before deploying, verify locally that:

- `npm run build` succeeds without warnings.
- `npm run typecheck` is clean.
- `npm test` shows all green.
- `npm run db:seed` populates seed data.

Generate strong secrets (anywhere with `openssl`):

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -base64 32   # CRON_SECRET
openssl rand -base64 32   # RAZORPAY_WEBHOOK_SECRET (or use the one from dashboard)
```

---

## 1. Database — Neon Postgres

1. Create a project at https://neon.tech (free tier is fine to start).
2. Copy the **pooled** connection string (with `?sslmode=require`).
3. **Switch the Prisma provider** from `sqlite` to `postgresql` in
   `prisma/schema.prisma`:

   ```diff
   datasource db {
   -  provider = "sqlite"
   +  provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. Set the connection string on your local shell and run an initial migration:

   ```bash
   export DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
   npx prisma migrate dev --name init
   ```

   This generates `prisma/migrations/` — **commit this directory**. Future
   deployments will use `prisma migrate deploy` (non-interactive).

5. Seed production carefully — the seed creates demo accounts you'll want to
   **remove or change passwords for** before going live:

   ```bash
   npm run db:seed
   ```

   Then either delete the demo accounts (`buyer@example.com`, `exec@example.com`,
   `manager@example.com`) or rotate their passwords via SQL.

> **Tip:** Keep a separate Neon branch for staging vs production.

---

## 2. Object storage — Cloudflare R2

1. Sign up for Cloudflare (free).
2. Create an R2 bucket (default name: `auction-docs`).
3. In R2 → Manage R2 API Tokens → create a token with **Object Read & Write**
   scoped to that bucket.
4. Record:
   - `R2_ACCOUNT_ID` — visible in the R2 dashboard URL or sidebar.
   - `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` — from the token.
   - `R2_BUCKET=auction-docs`.

The app uses AWS Signature V4 directly so no SDK is required. Document downloads
go via short-lived (5-minute) presigned URLs — never expose the bucket publicly.

---

## 3. Email — Resend

1. Sign up at https://resend.com (3 000 emails/month free).
2. Add and verify a sending domain (SPF + DKIM records).
3. Create an API key. Set:
   - `RESEND_API_KEY=re_...`
   - `EMAIL_FROM=alerts@yourdomain.com` (must be on the verified domain)

When `RESEND_API_KEY` is not set, the app logs emails to the console — useful for
staging.

---

## 4. Payments — Razorpay

1. Sign up at https://dashboard.razorpay.com (India). Complete KYC for live mode.
2. Generate API keys (Dashboard → Settings → API Keys). For initial testing use
   **Test Mode** keys.
3. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
4. **Configure the webhook**:
   - URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`, `refund.created`
   - Secret: generate any strong string, set as `RAZORPAY_WEBHOOK_SECRET`.

When `RAZORPAY_KEY_ID` is absent, the subscribe flow falls back to demo mode
(activate instantly with no payment). Demo mode is auto-disabled when keys are
present.

---

## 5. Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project at https://vercel.com.
3. Build settings: defaults work (Next.js 14 detected, `npm run build`).
4. Add environment variables in **Project → Settings → Environment Variables**:

   | Name | Value | Notes |
   |---|---|---|
   | `DATABASE_URL` | Neon pooled URL | Required |
   | `AUTH_SECRET` | 32-byte base64 string | Required |
   | `CRON_SECRET` | strong random | Required |
   | `NEXT_PUBLIC_SITE_URL` | https://yourdomain.com | Used in emails & sitemap |
   | `RESEND_API_KEY` | Resend key | Optional but recommended |
   | `EMAIL_FROM` | `alerts@yourdomain.com` | Required if Resend set |
   | `R2_ACCOUNT_ID` | from Cloudflare | Required for production documents |
   | `R2_ACCESS_KEY_ID` | from R2 token | " |
   | `R2_SECRET_ACCESS_KEY` | from R2 token | " |
   | `R2_BUCKET` | `auction-docs` | " |
   | `RAZORPAY_KEY_ID` | Razorpay key id | Required for real payments |
   | `RAZORPAY_KEY_SECRET` | Razorpay secret | " |
   | `RAZORPAY_WEBHOOK_SECRET` | from webhook config | " |
   | `SENTRY_DSN` | from Sentry | Optional |

5. Deploy. The first build will run `prisma generate`; you'll need to run
   `prisma migrate deploy` separately (see step 6).

---

## 6. Apply database migrations

After the first deploy succeeds, run migrations against production:

```bash
# From your dev machine, with DATABASE_URL pointing at Neon:
npx prisma migrate deploy
```

Or set up a Vercel **postbuild** script (less common):

```json
"scripts": {
  "postbuild": "prisma migrate deploy"
}
```

---

## 7. Cron jobs

`vercel.json` already declares two cron jobs:

```json
{
  "crons": [
    { "path": "/api/jobs/alerts",           "schedule": "*/30 * * * *" },
    { "path": "/api/jobs/sla-escalations",  "schedule": "0 * * * *" }
  ]
}
```

Both endpoints require `Authorization: Bearer $CRON_SECRET`. Vercel automatically
sets this header for cron-triggered requests when `CRON_SECRET` is configured.

> Free Vercel accounts only get hourly crons. Upgrade to Pro for `*/30`.

---

## 8. Custom domain & TLS

1. In Vercel: Project → Settings → Domains → add `yourdomain.com`.
2. Update DNS at your registrar (Cloudflare, Route53, etc.) with the CNAME/A
   records Vercel shows.
3. Vercel issues TLS via Let's Encrypt automatically.
4. Add `www.yourdomain.com` and redirect either way as preferred.

---

## 9. Robots, SEO, Search Console

- `/robots.txt` and `/sitemap.xml` are auto-generated; verify at
  `https://yourdomain.com/robots.txt`.
- Register the domain at https://search.google.com/search-console and submit
  the sitemap.
- `/admin` and `/account` are blocked by `robots.txt` and a `X-Robots-Tag`
  header.

---

## 10. Optional: error monitoring (Sentry)

Install + configure:

```bash
npm i @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Set `SENTRY_DSN` in Vercel env vars. The wizard generates `sentry.{client,server}.config.ts`
files; commit them.

---

## 11. Operational readiness

- **First Super Admin**: after seeding, change `superadmin@example.com`'s password
  immediately and update the email. Alternatively delete the seeded user and
  create a fresh one via the signup endpoint, then promote with:

  ```sql
  UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'you@yourdomain.com';
  ```

- **Health check**: monitor `https://yourdomain.com/api/health`. Returns 200 if
  the DB is reachable, 503 otherwise. Wire into UptimeRobot / Better Stack /
  Vercel's own monitoring.

- **Backups**: Neon has point-in-time recovery on paid plans. R2 has versioning
  available — enable it for the bucket.

- **Compliance**: Indian DPDP Act requires PII access to be logged. The
  `AuditLog` table covers admin actions; expose a "Download my data" endpoint
  before processing real PII at scale.

---

## 12. Going live — final checks

- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Demo accounts removed or password-rotated
- [ ] All `change-me` env defaults replaced
- [ ] Razorpay switched from Test to Live
- [ ] DKIM/SPF on sender domain
- [ ] Custom domain pointing at Vercel with TLS
- [ ] `/api/health` monitored
- [ ] Sentry receiving events (if configured)
- [ ] Cron jobs visible in Vercel dashboard with first successful run
- [ ] Webhook from Razorpay test event reaches `/api/webhooks/razorpay`
- [ ] A real document uploaded, then opened from a subscriber account

---

## Rollback

Vercel keeps every prior deploy. To roll back: Deployments → pick the prior
release → **Promote to Production**. The build is already done, so this is
instant. Database migrations are forward-only; if you need to roll back a schema
change, you'll need a corresponding migration that reverses it. **Never** edit
already-applied migration files.
