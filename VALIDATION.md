# Validation Plan

## 1. Validation gates

| Gate | What it proves | How |
|---|---|---|
| G1 Schema coverage | All §9 entities + the additions are in `schema.prisma` | Cross-check table in `ARCHITECTURE.md §3` |
| G2 Type safety | No `any` leaks at module boundaries | `npx tsc --noEmit` clean |
| G3 RBAC enforcement | Roles cannot exceed §2.2 matrix | `__tests__/rbac.test.ts` table-driven |
| G4 Gating enforcement | §5.4 visibility rules honoured server-side | `__tests__/gating.test.ts` for each viewer × field |
| G5 Workflow transitions | Only allowed §4.1.1 transitions succeed | `__tests__/workflow.test.ts` matrix |
| G6 Acceptance walkthrough | The 6 acceptance criteria in §12 each pass manually | Checklist below |
| G7 Seed smoke | App boots, can log in as each role, can render listings | `npm run dev` + 5-min manual run |

## 2. Acceptance criteria (from requirements §12) — mapped to verification

| # | Criterion | Verification |
|---|---|---|
| AC1 | Notice → workflow task with source traceability & draft listing within X minutes | Manual: hit `/api/ingest` with sample payload; verify `WorkflowTask` row + `SourceNotice` row linked. |
| AC2 | Dedupe flags duplicates with merge/link + audit | Manual: ingest 2 near-identical notices; verify `DedupeFlag` row appears in `/admin/workflows` with side-by-side UI; merge action recorded in `AuditLog`. |
| AC3 | No listing visible publicly without Manager approval | Manual: create listing as Executive → SUBMITTED_FOR_REVIEW; query `/listings` anonymously → not present. Approve as Manager → appears. |
| AC4 | Gating rules hide contact/location/documents for non-subscribed | Manual: visit `/listings/[id]` as anon, logged-in-not-subscribed, subscribed; diff what's returned. Automated: `gating.test.ts`. |
| AC5 | Alerts deliver correctly with opt-out | Manual: create SavedSearch, publish matching listing, trigger `/api/jobs/alerts`; verify Resend log shows send + Alert row written. Opt-out link revokes future. |
| AC6 | All admin actions audit-logged + exportable | Manual: perform 3 admin mutations; check `/admin/audit` shows entries with actor/before/after; export CSV. |

## 3. Test matrix

### G3 RBAC table

| Action \ Role | SUPER_ADMIN | MANAGER | EXECUTIVE | BUYER |
|---|---|---|---|---|
| listing.create (draft) | ✓ | ✓ | ✓ | ✗ |
| listing.approve | ✓ | ✓ | ✗ | ✗ |
| listing.publish | ✓ | ✓ | ✗ | ✗ |
| listing.reject | ✓ | ✓ | ✗ | ✗ |
| workflow.assign (others) | ✓ | ✓ | ✗ | ✗ |
| workflow.assign (self) | ✓ | ✓ | ✓ | ✗ |
| user.manage | ✓ | ✗ | ✗ | ✗ |
| plan.manage | ✓ | ✗ | ✗ | ✗ |
| promo.manage | ✓ | ✓ | ✗ | ✗ |
| audit.export | ✓ | limited (90d) | ✗ | ✗ |

### G4 Gating matrix (from §5.4)

| Field \ Viewer | anonymous | logged-in not sub | subscribed |
|---|---|---|---|
| Summary fields | ✓ | ✓ | ✓ |
| Reserve price, EMD, auction date | partial (price hidden) | ✓ | ✓ |
| Exact address + map | ✗ | partial (locality only) | ✓ |
| Bank contact | ✗ | ✗ | ✓ |
| Documents | ✗ | preview-only | ✓ |
| Risk score high-level | teaser only | ✓ | ✓ |
| Risk breakdown | ✗ | paid upgrade | ✓ (plan-based) |

### G5 Workflow transition matrix

Valid transitions from §4.1.1:
- `DISCOVERED → {DEDUPE_FLAGGED, ASSIGNED, ARCHIVED}`
- `DEDUPE_FLAGGED → {ASSIGNED, ARCHIVED}`
- `ASSIGNED → {IN_PROCESSING, ARCHIVED}`
- `IN_PROCESSING → {SUBMITTED_FOR_REVIEW, ARCHIVED}`
- `SUBMITTED_FOR_REVIEW → {APPROVED_PUBLISHED, REJECTED}`
- `REJECTED → {IN_PROCESSING, ARCHIVED}`
- `APPROVED_PUBLISHED → {ARCHIVED}`

Any other source/target pair throws.

## 4. Manual smoke script (5 minutes)

1. `npm run dev` → http://localhost:3000 renders home with featured listings.
2. `/listings` shows seed listings, filters work.
3. `/listings/<id>` as anonymous → address hidden, contact hidden.
4. Login as `buyer@example.com / Buyer@123` → address partial, contact still hidden.
5. Login as `exec@example.com / Exec@123` → /admin/workflows shows queue.
6. Submit listing for review → log out, log in as `manager@example.com / Manager@123` → approve.
7. Re-visit listing publicly → it appears.
8. Visit `/admin/audit` → see the create + approve entries.

## 5. Production readiness checklist (Phase 1 → live)

- [ ] `.env` filled: `DATABASE_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `R2_*`, `RAZORPAY_*`
- [ ] `prisma migrate deploy` against Neon
- [ ] Vercel cron set up for `/api/jobs/alerts` and `/api/jobs/sla-escalations`
- [ ] Razorpay webhook endpoint signed
- [ ] SPF/DKIM/DMARC on sender domain
- [ ] Sentry DSN wired up
- [ ] Robots.txt allows public `/listings`, blocks `/admin`
- [ ] `next.config` `images.remotePatterns` includes R2 domain
- [ ] One-time: seed Super Admin via secured admin-seed script, then disable
