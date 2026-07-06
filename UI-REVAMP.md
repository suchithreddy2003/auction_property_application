# UI Revamp — change log

A front-end redesign of Hanshitha Auctions onto a single, reusable design system
built from the client's design document. Behaviour, data access, gating and routes
are unchanged — this is a presentation-layer revamp plus the shared components that
back it.

> **Scope:** front-end only. No schema, API, auth, or business-logic changes.

---

## 1. Design foundation

| File | Change |
|---|---|
| `tailwind.config.ts` | Added the semantic colour tokens (`navy`, `ink`, `trust`, `canvas`, `surface`, `line`, `risk.{low,medium,high}`, `premium`, `verified`, `muted`) and `font-sans` / `font-mono` families. The legacy `brand` scale is **remapped to trust-blue** so any not-yet-migrated page still looks on-brand. |
| `src/app/layout.tsx` | Loads **Hanken Grotesk** (UI/headings) and **IBM Plex Mono** (figures/metadata) via `next/font/google` — self-hosted at build, so no external font CDN. Swapped the inline footer for `<SiteFooter />`. |
| `src/app/globals.css` | Canvas background + ink text, base `font-sans`, a `.font-figures` helper, and `body { overflow-x: clip }` so full-bleed sections don't cause horizontal scroll while keeping `position: sticky` working. |

## 2. Shared components

**Reworked**
- `src/components/ui.tsx` — `Button` (7 variants: primary, dark, secondary, ghost, link, success, danger), `Badge` (risk / status / meta tones + dot), `Card`, `Input`/`Select`/`Textarea`/`Label`, and new `Overline`, `Checkbox`, `Toggle`. Backward-compatible with existing callers.
- `src/components/header.tsx` — sticky header with backdrop blur, "H" logo tile, and account/logout vs log-in/sign-up.
- `src/components/listing-card.tsx` — upgraded to design **Card A** (image-forward). Same `{ listing }` prop, so the `/listings` grid picked it up automatically. Optional `auctionDate`.

**New**
- `src/components/hero.tsx` — navy gradient hero band; supports `align` (center/left), `eyebrow`, `badge`, and children.
- `src/components/footer.tsx` — global dark footer.
- `src/components/main-nav.tsx` — client nav with active-route highlighting.
- `src/components/auction-row.tsx` — horizontal listing row (design "Card B"); reused on the calendar and ready for the `/listings` list view.
- `src/components/calendar-month.tsx` — month grid; day chips coloured by that day's highest-risk auction.
- `src/lib/format.ts` — `formatCompactINR` (₹ 62.5 L / ₹ 1.25 Cr), `formatAuctionDate`, `titleCase`.

## 3. Pages redesigned

| Route | File(s) | Notes |
|---|---|---|
| Home `/` | `src/app/page.tsx` | Hero B (split headline + search / live "next auction" panel + stat tiles) and Card A grids (Premium picks, Recent), wired to real data + gating. |
| Calendar `/calendar` | `src/app/calendar/page.tsx` | Hero, filter toolbar, month grid with prev/today/next (preserves filters), and "upcoming auctions" rows. Real Prisma data + gating. |
| Services `/services` | `src/app/services/page.tsx` | Left-aligned hero + pills, 6-card service grid, "how it works" strip, navy CTA. "Request this service" → `/account/services/new?type=…`. |
| About `/about` | `src/app/about/page.tsx` | Light centered intro, "What we do" steps, trust-&-accuracy panel, data/privacy card, navy CTA. |
| Plans `/plans` | `src/app/plans/page.tsx`, `src/app/plans/plans-pricing.tsx` | Light hero, client-side **Monthly/Annual** billing toggle, 3 plan cards (Pro highlighted), trust strip, FAQ. "Choose X" → `/account/subscribe?plan=…`. |

## 4. Technical notes

- **Gating preserved.** Every price/address still flows through `projectListing` — anonymous viewers see "Login to view", not real figures.
- **Full-bleed sections** use a `left-1/2 -translate-x-1/2 w-screen` breakout so heroes/footers reach edge-to-edge without touching other pages or breaking the sticky header.
- **Backward compatibility.** Un-migrated pages keep working via the remapped `brand` scale and backward-compatible `Badge`/`Button` APIs.

## 5. Local data (NOT part of this PR)

To preview the redesign locally, sample rows were inserted into the local SQLite DB
(`prisma/dev.db`, which is git-ignored):

- **Users** — the four README demo accounts (super admin / manager / exec / buyer), email + password only.
- **Listings** — ~6 published listings with auction events across a few cities.
- **Plans** — the 3 subscription plans (Basic / Pro / Investor) so the "Choose plan" → subscribe flow resolves.

These live in the database file, not in code, so they are **not** included in the diff.
Reproduce with `npm run db:seed` (full sample set) if needed.

## 6. Verification

- `npm run typecheck` — clean.
- Dev server boots; `/`, `/calendar`, `/services`, `/about`, `/plans`, `/listings`, `/login` all return `200` with no runtime errors.
- Fonts fetch and self-host; design elements confirmed in rendered output; no cross-page regressions.

## 7. Not yet redesigned (follow-ups)

- `/listings` — grid uses Card A, but the sidebar filter + a grid/list toggle (using `AuctionRow`) still need the new styling.
- Listing detail `/listings/[id]` — pending **Card C** (risk-forward score ring), the one unbuilt card direction.
- `account/*`, `admin/*`, and the auth screens.
