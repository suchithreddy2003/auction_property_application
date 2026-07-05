# Auction Properties Platform — Delivery Plan

**Client:** Hanshitha Management Services
**Source of truth:** `DOC-20251229-WA0005.docx` (v2 requirements)
**Plan revision:** 2026-05-11

## 1. Guiding principles

1. **Fast time-to-value.** Ship an MVP that proves the workflow (Discover → Approve → Publish → Gated view) end-to-end before scaling features.
2. **Cost-first infrastructure.** Every infra choice has a free or near-free tier. No "best-of-breed" tool unless free-tier dies under MVP load.
3. **Single codebase, no premature splits.** Modular monolith. Split only when forced by team size or traffic.
4. **Trust by traceability.** Every listing keeps a `SourceNotice` link, parse confidence, and audit history. Non-negotiable per §3.3 of requirements.
5. **Gating at the data layer, not the UI.** Subscription tier checked server-side; UI is a presentation of an already-filtered payload.

## 2. Phase plan (mirrors requirements §11)

### Phase 1 — MVP (this build)

| # | Capability | Maps to req §  |
|---|---|---|
| 1 | Public listings: search, filters, detail with gating | §5.2, §5.3, §5.4 |
| 2 | Auth + RBAC (Buyer, Executive, Manager, Super Admin) | §2 |
| 3 | Admin: manual listing CRUD, workflow queue, approve/publish | §4.1, §4.2 |
| 4 | Dedupe flagging (rules-based fuzzy match on key fields) | §4.1.3 |
| 5 | Document upload + visibility level (public/partial/subscribed) | §4.2.4 |
| 6 | Subscription plan config + entitlement middleware | §4.4, §8.4 |
| 7 | Saved searches + email alerts (cron) | §5.6, §8.3 |
| 8 | Rules-based risk score (explainable) | §6.1 |
| 9 | Audit log for all admin mutations | §8.5 |
| 10 | Razorpay integration (test mode, stubbed in dev) | §8.4 |

### Phase 2 — Scale + Intelligence (later)

Crawler with parser templates (Playwright), OpenSearch swap-in if Postgres FTS pressure shows, WhatsApp alerts (Wati/Gupshup), premium reports as paid artifacts, partner marketplace, LLM-assisted document summaries (admin-reviewed).

### Phase 3 — Enterprise (later)

Institutional dashboards, bulk export/API, KYC + assisted bidding.

## 3. Tech stack & rationale

| Concern | Choice | Why this beats alternatives |
|---|---|---|
| Frontend + Backend | **Next.js 15 (App Router) + TypeScript** | SSR for SEO on listings (real-estate-style discovery requires it). One framework = one deploy = one bill. |
| Styling | **Tailwind CSS** + minimal own components | No component library bloat; predictable bundle. |
| ORM / DB | **Prisma + Postgres** (Neon in prod, SQLite in dev) | Prisma migrations are reversible; Neon scales to zero. SQLite locally = zero setup. |
| Auth | **NextAuth (Auth.js) Credentials provider** | No vendor lock-in, no per-MAU charge. |
| File storage | **Cloudflare R2** (S3-compatible) | Zero egress fees — the cost trap of S3 for a document-heavy app. |
| Email | **Resend** (3k free/mo) | Easiest DKIM setup; falls back to SES if scale demands. |
| Search | **Postgres FTS + `pg_trgm`** | OpenSearch is $30+/mo idle. Postgres handles <100k listings comfortably with proper indexes. Migration path is well-known. |
| Background jobs | **Vercel Cron** for MVP; later **BullMQ on Fly.io** for crawler | Free; serverless. Crawler split out when it grows. |
| Payments | **Razorpay** (India) | GST invoice support, UPI/cards native, webhooks well-documented. |
| Observability | **Sentry free tier + Vercel logs** | Errors + perf + traces enough for MVP. |

### What we deliberately did **not** pick

- **OpenSearch / Elasticsearch** — minimum $30/mo idle. Defer until Postgres FTS measurably degrades.
- **Microservices** — premature; one deploy is cheaper to run and reason about.
- **GraphQL** — REST + Server Actions is enough; GraphQL gateway adds latency and ops.
- **WhatsApp in MVP** — Wati/Gupshup are billed per-message; email-only until product-market fit on alerts.

## 4. Estimated steady-state cost (MVP, light traffic)

| Item | Free tier | At MVP scale |
|---|---|---|
| Vercel | Hobby | ~$20 if Pro needed |
| Neon Postgres | 0.5 GB free | $0 |
| Cloudflare R2 | 10 GB free | $0 |
| Resend | 3k emails/mo | $0 |
| Sentry | 5k events/mo | $0 |
| Razorpay | per-transaction (2%) | per-txn |
| **Total fixed** | | **~$0–25/mo** |

Adds ~$30–50/mo once Vercel Pro, paid Neon, and Sentry team plan are needed (probably 6–12 months in).

## 5. Out-of-scope for MVP (explicit)

- Live auction/bidding engine (§1.2).
- Full KYC (§1.2).
- LLM document summaries (Phase 2; admin-reviewed only when added).
- Crawler at scale — MVP exposes a manual `/admin/notices/import` endpoint that accepts a URL + raw HTML/PDF reference; one Source row per platform with crawl_schedule stubbed.
- WhatsApp/SMS alerts (Phase 2 once DLT registration + provider are signed).

## 6. Validation gates before client demo

See `VALIDATION.md`. Briefly: schema covers every entity in §9; the 6 acceptance criteria in §12 each have a manual test step; gating rules table in §5.4 is enforced server-side and verified across three logged-in states.

## 7. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Source ToS / scraping blockback | High | MVP avoids real crawls; design parser templates as a Source row schema so the legal team can sign off per source. |
| Razorpay GST invoice rules | Medium | Use Razorpay Invoices API; store our own `Payment` row regardless. |
| DPDP Act compliance for PII | Medium | Encrypt phone/email at rest; consent flags on User; audit log on PII access. |
| Search cost spiral | Low (early) | Postgres FTS is the firewall; OpenSearch only if metrics demand it. |
| Vendor lock | Low | Prisma + S3-compatible storage + NextAuth all portable. |
