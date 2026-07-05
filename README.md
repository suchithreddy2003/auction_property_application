# Auction Properties Platform

MVP for **Hanshitha Management Services** — aggregated property auction notices
with risk scoring, document gating, alerts, and assisted services.

> Production-ready single-tenant build. See `docs/DEPLOYMENT.md` for the
> step-by-step go-live runbook (Vercel + Neon + R2 + Resend + Razorpay).

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Prisma** ORM — SQLite for local dev, Postgres (Neon) for production
- **JWT auth** via `jose` + `bcryptjs` (12 rounds in prod) — no third-party auth service
- **Server Actions** for all mutations; **`/api/*`** for ingest, cron, webhooks, public JSON
- **Cloudflare R2** for document storage with AWS SigV4 presigned URLs
- **Resend** for transactional email
- **Razorpay** for payments (orders + webhook fulfillment)
- **Vitest** for tests (159 tests on pure logic — gating, rbac, workflow, risk-score, auth)

## Run locally

```bash
npm install
cp .env.example .env           # then edit AUTH_SECRET (any 32-byte string for dev)
npx prisma db push             # apply schema to local SQLite
npm run db:seed                # populate sample data
npm run dev                    # http://localhost:3000
```

## Demo accounts (post-seed)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@example.com | `Super@123` |
| Manager | manager@example.com | `Manager@123` |
| Executive | exec@example.com | `Exec@1234` |
| Buyer | buyer@example.com | `Buyer@123` |

> **Production**: remove or rotate these accounts before launch. See
> `docs/DEPLOYMENT.md §11`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run vitest suite |
| `npm run db:push` | Apply schema (no migration file) |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Force-reset DB and re-seed |

## Project layout

```
src/
  app/
    (auth)/                login, signup, forgot, reset
    listings/              public browse + detail (gated)
    plans/  services/  calendar/  about/
    account/               buyer area + profile + saved searches + subscribe
    admin/                 RBAC-gated: dashboard, workflows, listings, dedupe, users, plans, audit
    api/
      health/              GET — DB liveness probe
      listings/            GET — public JSON (gated)
      listings/[id]/       GET — public listing detail JSON (gated)
      ingest/              POST — manual notice ingest (CRON_SECRET auth)
      documents/upload/    POST — admin doc upload (R2 with local fallback)
      documents/[id]/url/  GET  — presigned download URL (gated)
      documents/local/[key]/ GET — local-disk fallback when R2 not configured
      payments/...         Razorpay orders + webhook
      webhooks/razorpay/   POST — payment fulfillment webhook
      jobs/alerts/         GET/POST — saved-search alerts (cron)
      jobs/sla-escalations/ GET/POST — workflow SLA escalations (cron)
      admin/users/role/    POST — change user role (SUPER_ADMIN)
      admin/audit/export/  GET — CSV export
  lib/
    db.ts auth.ts rbac.ts gating.ts risk-score.ts workflow.ts dedupe.ts
    audit.ts subscription.ts cn.ts env.ts rate-limit.ts storage.ts email.ts razorpay.ts
  components/  types/  middleware.ts

__tests__/                 vitest — workflow, rbac, gating, risk-score, auth, rate-limit, razorpay
prisma/                    schema.prisma + seed.ts
docs/                      DEPLOYMENT.md
```

## Production features (delta from MVP scaffolding)

- ✅ **Auth**: bcrypt 12 rounds, rate-limited login/signup/forgot, password reset via email, password change, profile editing, open-redirect protected.
- ✅ **Security**: HSTS / X-Frame / X-Content-Type / Referrer-Policy / Permissions-Policy headers. `/admin` and `/account` marked `noindex`.
- ✅ **Subscriptions**: real Razorpay checkout (order create → client checkout → signature-verified callback) **and** webhook for idempotent fulfillment. Demo mode falls back when keys absent.
- ✅ **Documents**: admin upload to R2 (or local `.uploads/` in dev), gated downloads via short-lived presigned URLs.
- ✅ **Alerts**: saved-search cron emails matches via Resend, with edit / pause / delete on the account page.
- ✅ **SLA**: hourly cron escalates overdue workflow tasks.
- ✅ **Errors**: typed `error.tsx`, `not-found.tsx`, `loading.tsx`.
- ✅ **Health**: `/api/health` with DB probe.
- ✅ **SEO**: `/robots.txt`, `/sitemap.xml` generated from published listings; `/about` for trust.
- ✅ **Public JSON API**: gated `/api/listings` + `/api/listings/[id]` for third-party integration.
- ✅ **RBAC**: SUPER_ADMIN can promote/demote users via UI. Cannot demote self.
- ✅ **Env validation**: zod-checked on boot; production fails loudly on misconfig.
- ✅ **Tests**: 159 vitest tests covering all decision-critical logic.

## Walkthrough

1. **Signup / login** at `/signup` or `/login`. Forgot password at `/forgot`.
2. **Browse** `/listings`. As anon you see teaser data; as logged-in you see prices and locality; as subscribed you see exact addresses, bank contacts, full risk breakdown, and documents.
3. **Subscribe** via `/plans` → `/account/subscribe?plan=BASIC`. Razorpay Checkout opens if keys configured; demo-activates otherwise.
4. **Admin** at `/admin`: workflows queue, dedupe flags, listings CRUD with document upload, users (with role editor for SUPER_ADMIN), audit log with CSV export.
5. **Ingest** notices from external scripts:
   ```bash
   curl -X POST http://localhost:3000/api/ingest \
     -H "Content-Type: application/json" \
     -H "x-ingest-key: $CRON_SECRET" \
     -d '{"sourceCode":"BAANKNET","url":"https://example.com/n/1","rawText":"…"}'
   ```

## Deploy

See **`docs/DEPLOYMENT.md`** for the full runbook. Quick summary:

1. Neon Postgres → set `DATABASE_URL`, switch Prisma provider to `postgresql`, `prisma migrate deploy`.
2. Vercel deploy → add all env vars from `.env.example`.
3. Cloudflare R2 bucket + token → set `R2_*` env.
4. Resend domain verified → set `RESEND_API_KEY` + `EMAIL_FROM`.
5. Razorpay live keys + webhook → set `RAZORPAY_*`.
6. Cron jobs auto-registered via `vercel.json` (alerts every 30 min, SLA hourly).
7. Custom domain + TLS via Vercel.
8. Monitor `/api/health` and (optionally) Sentry.

## What's deliberately NOT in MVP

- Live bidding engine (per requirements §1.2)
- Crawler at scale — `/api/ingest` is the manual hand-off; Phase 2 builds a Playwright worker on Fly.io
- WhatsApp alerts — Phase 2 (needs DLT registration)
- LLM document summaries — Phase 2, behind admin review
- Multi-factor auth — Phase 2 (TOTP)
