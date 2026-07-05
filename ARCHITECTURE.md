# Architecture

## 1. Cloud topology (MVP)

```
                          ┌────────────────────────────────────────┐
                          │                Cloudflare              │
                          │  CDN + DNS + WAF (free tier)           │
                          └───────────────┬────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Vercel                                 │
│  Next.js 15 App (App Router)                                    │
│    • / (public buyer UI)       SSR + ISR for SEO                │
│    • /admin (RBAC-gated)       SSR only                         │
│    • /api/* + Server Actions   business logic                   │
│  Vercel Cron → /api/jobs/alerts                                 │
│  Vercel Cron → /api/jobs/sla-escalations                        │
└──────────┬─────────────────────────────┬────────────────────────┘
           │                             │
           ▼                             ▼
   ┌───────────────────┐         ┌───────────────────┐
   │   Neon Postgres   │         │  Cloudflare R2    │
   │  (managed PG 16)  │         │  (S3-compatible,  │
   │   pg_trgm + FTS   │         │   zero egress)    │
   └───────────────────┘         └───────────────────┘

External (per request):
   • Resend (email)
   • Razorpay (payments)
   • Sentry (errors)

Phase 2 (separate worker, not in MVP):
   • Fly.io machine: Playwright crawler → /api/ingest endpoint
```

**Why a single Vercel deployment for both buyer and admin UIs.** Admin is a few internal users; isolation comes from RBAC, not from a separate deploy. We save the cost and ops of a second hosting target, and admin actions can share Server Actions + Prisma client with the public app.

## 2. Module layout (modular monolith)

```
src/
  app/
    (public)/                  buyer-facing routes
      page.tsx                 home
      listings/
      calendar/
      services/
      about/
    (auth)/                    login, signup, magic-link
    account/                   logged-in buyer area
    admin/                     RBAC-gated; layout asserts session.role
    api/
      auth/[...nextauth]/
      listings/                public listing JSON (filters)
      admin/                   admin-only mutations
      jobs/                    cron endpoints (alerts, SLA)
      webhooks/razorpay/
  lib/
    db.ts                      Prisma client (singleton)
    auth.ts                    NextAuth config
    rbac.ts                    role + permission matrix (§2.2)
    gating.ts                  field-level visibility per subscription tier (§5.4)
    risk-score.ts              rules-based scorer (§6.1)
    dedupe.ts                  candidate-duplicate detection (§4.1.3)
    audit.ts                   audit-log wrapper
    storage.ts                 R2 client + signed-URL helpers
    email.ts                   Resend wrapper
  components/
    ui/                        Button, Input, Card, Badge
    listing-card.tsx
    filters.tsx
    header.tsx
  types/
prisma/
  schema.prisma
  seed.ts
```

**Boundary rule:** UI never imports `lib/db.ts` directly. All DB access goes through Server Actions or `/api/*` routes which apply auth + gating before returning.

## 3. Data model (covers §9 of requirements)

Every entity in the requirements §9 table is represented. Additions for operational completeness are marked `[+]`.

| Entity | Status | Notes |
|---|---|---|
| `Source` | ✓ | crawl config |
| `SourceNotice` | ✓ | raw capture, parse confidence |
| `Listing` | ✓ | + `riskScore`, `riskFactors` (jsonb), `published` |
| `AuctionEvent` | ✓ | one Listing → many AuctionEvents (re-auctions) |
| `Document` | ✓ | `visibility ∈ {public, partial, subscribed}` |
| `WorkflowTask` | ✓ | state machine §4.1.1 |
| `User` | ✓ | role ∈ {BUYER, EXECUTIVE, MANAGER, SUPER_ADMIN} |
| `SubscriptionPlan` | ✓ | jsonb `entitlements` |
| `Subscription` | ✓ | with status lifecycle |
| `Payment` | ✓ | gateway_ref unique |
| `CommunicationLog` | ✓ | links to user + optional listing |
| `Partner` | ✓ | service providers |
| `ServiceOrder` | ✓ | assisted-service ticket |
| `SavedSearch` `[+]` | ✓ | for alerts engine |
| `Alert` `[+]` | ✓ | delivery ledger |
| `AuditLog` `[+]` | ✓ | all admin mutations |
| `DedupeFlag` `[+]` | ✓ | candidate pair + score |

State transitions on `WorkflowTask.state`: `DISCOVERED → DEDUPE_FLAGGED → ASSIGNED → IN_PROCESSING → SUBMITTED_FOR_REVIEW → APPROVED_PUBLISHED | REJECTED → ARCHIVED`. Enforced by a single `transition()` helper in `lib/workflow.ts`.

## 4. Authentication & authorization

- **NextAuth Credentials provider** with Argon2id-hashed passwords. JWT session, 7-day rolling.
- **Role enforcement** lives in two layers:
  1. `middleware.ts` redirects `/admin/*` to `/login` if no session, and to `/` if `session.role === BUYER`.
  2. `lib/rbac.ts` exports `can(user, action, resource)` keyed off the permission matrix from §2.2. Server Actions and `/api/admin/*` handlers call `can()` before any DB write.
- **MFA** for admin: deferred to Phase 2 (TOTP). Requirement §8.5 says "recommended", not required.

## 5. Subscription gating (§5.4)

Gating is a single function:

```ts
function project(listing, viewer) {
  // viewer ∈ {anonymous, logged_in, subscribed_basic, subscribed_pro, subscribed_investor}
  // returns Listing with fields removed/redacted per the gating table in §5.4
}
```

Applied in `/api/listings/[id]/route.ts` and in Server Components fetching detail. UI never receives gated fields for unauthorized viewers — no client-side bypass possible.

## 6. Workflow engine (§4.1)

A `WorkflowTask` is created automatically for every new `SourceNotice` (or manually by an Executive). State is a string-typed enum, with transitions in `lib/workflow.ts::transition(task, newState, actor)`. SLA timers are computed (`createdAt` + `slaHours`) and a Vercel Cron job at `/api/jobs/sla-escalations` flags overdue tasks daily.

Dedupe: when a new notice is parsed, `lib/dedupe.ts::findCandidates(notice)` runs key + fuzzy matching (lender, address tokens via `pg_trgm`, reserve price ±5%, date) and inserts `DedupeFlag` rows with a similarity score. Admin UI shows side-by-side comparison.

## 7. Storage & documents

- Documents POSTed to `/api/admin/listings/:id/documents` are virus-scanned (Phase 2 hook; MVP just type+size validates), uploaded to R2 under `listings/<id>/<docId>.<ext>`, and stored as a `Document` row with `visibility`.
- User downloads always go through `/api/documents/:id/url` which checks the viewer's session + subscription tier against `Document.visibility` and returns a short-lived (5 min) R2 signed URL. We never expose direct R2 URLs.

## 8. Risk score (§6.1)

Deterministic rules engine in `lib/risk-score.ts`. Inputs come from the Listing row + linked AuctionEvents + Documents. Returns `{score: 0–100, label: LOW|MEDIUM|HIGH, factors: [{key, weight, contribution}]}`. The factors array is what powers the "explainable" UI. Score is recomputed in a `Listing.beforeUpdate` Prisma extension whenever inputs change, so the stored value never drifts from the rules.

## 9. Alerts engine (§5.6, §8.3)

- `SavedSearch` rows store query JSON + channels + frequency.
- Vercel Cron at `/api/jobs/alerts` (every 30 min) finds new `Listing.published` since `SavedSearch.lastRunAt`, matches against each search's filter JSON, and enqueues `Alert` rows.
- `Alert` rows are sent via Resend in the same job (no separate queue in MVP). Status tracked (sent/failed/bounced). Rate-limited per user.

## 10. Audit log (§8.5)

`lib/audit.ts::log(actorId, action, target, before, after)` is called from every admin Server Action. `AuditLog` is append-only, has a `gin` index on the JSON delta, and is exportable from `/admin/audit` as CSV.

## 11. Performance + cost levers

- **ISR (revalidate: 60s)** on `/listings` and `/listings/[id]` for anonymous traffic. Authenticated traffic is SSR with cache: no-store for accuracy of gating.
- **Postgres indexes** on hot filter columns (`status`, `auctionDate`, `propertyType`, `state`, `city`, `published`).
- **`pg_trgm` GIN index** on `addressText` and `lenderName` for fuzzy filters and dedupe.
- **Image optimization** via Next/Image + R2 — automatic AVIF/WebP, no extra service.
- **No Redis in MVP** — Vercel KV is the migration path if rate limiting needs centralizing.

## 12. Migration path (when to break this architecture)

| Trigger | Action |
|---|---|
| >50 admin users editing concurrently | Move `/admin` to a separate Vercel project so deploys don't affect buyer traffic |
| >100k listings or filter p95 >500ms | Mirror to OpenSearch via Prisma middleware |
| Crawler exceeds Vercel function timeout | Move to Fly.io machine + queue via Postgres `LISTEN/NOTIFY` |
| >10 admin writes/sec | Introduce read replica on Neon |
| Multi-region buyers | Vercel Edge + Neon read replicas regionally |
