import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { GatedListing } from '@/lib/gating';
import { formatCompactINR, formatAuctionDate, titleCase } from '@/lib/format';

const riskChip: Record<string, { label: string; cls: string }> = {
  LOW: { label: 'Low', cls: 'bg-risk-low/10 text-risk-low border-risk-low/25' },
  MEDIUM: { label: 'Medium', cls: 'bg-risk-medium/10 text-risk-medium border-risk-medium/25' },
  HIGH: { label: 'High', cls: 'bg-risk-high/10 text-risk-high border-risk-high/25' },
};

// Horizontal listing row (design "Card B" / calendar upcoming rows).
// Reused on the calendar page and the /listings list view. Respects gating:
// anon viewers get the teaser price string, not real figures.
export function AuctionRow({
  listing,
  auctionDate,
}: {
  listing: GatedListing;
  auctionDate?: Date | null;
}) {
  const risk = listing.riskLabel ? riskChip[listing.riskLabel] : undefined;
  const reserve = listing.reservePrice != null ? formatCompactINR(listing.reservePrice) : listing.priceDisplay;
  const emd = listing.emd != null ? formatCompactINR(listing.emd) : '—';

  return (
    <div className="grid grid-cols-1 gap-4 rounded-[14px] border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(16,33,46,.04)] sm:grid-cols-[180px_1fr_auto] sm:items-start">
      {/* Photo placeholder */}
      <div className="flex h-[140px] items-center justify-center rounded-[10px] bg-[repeating-linear-gradient(135deg,#edeae3,#edeae3_11px,#e4e0d7_11px,#e4e0d7_22px)]">
        <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[#a49c8d]">photo</span>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-col gap-[10px]">
        <div className="flex items-start justify-between gap-[10px]">
          <div className="min-w-0">
            <div className="mb-[3px] font-mono text-[10.5px] uppercase tracking-[0.05em] text-[#8a8375]">
              {titleCase(listing.propertyType)} · {listing.city}
            </div>
            <div className="text-base font-semibold leading-[1.3] text-ink">{listing.title}</div>
          </div>
          {risk && (
            <span
              className={cn(
                'flex-none rounded-md border px-[9px] py-[3px] text-[11px] font-semibold',
                risk.cls
              )}
            >
              {risk.label} risk
            </span>
          )}
        </div>

        <div className="mt-[2px] flex flex-wrap gap-5">
          <Figure label="Reserve price" value={reserve} strong />
          <Figure label="EMD" value={emd} />
          {auctionDate && (
            <div>
              <div className="mb-[1px] text-[11px] text-[#8a97a1]">Auction date</div>
              <div className="text-[15px] font-semibold text-ink">{formatAuctionDate(auctionDate)}</div>
            </div>
          )}
        </div>

        <div className="mt-1 flex flex-wrap gap-[6px]">
          {listing.lenderName && <MetaChip>{listing.lenderName}</MetaChip>}
          {listing.possession && <MetaChip>{titleCase(listing.possession)}</MetaChip>}
          {listing.loanAvailable && (
            <span className="rounded-md border border-[#bfe0e1] bg-[#e5f2f2] px-2 py-[3px] text-[11px] text-verified">
              Loan available
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-none gap-2 sm:flex-col">
        <Link
          href={`/listings/${listing.id}`}
          className="whitespace-nowrap rounded-[9px] bg-trust px-4 py-[10px] text-center text-[13px] font-semibold text-white transition-colors hover:bg-trust-dark"
        >
          View details
        </Link>
        <Link
          href={`/listings/${listing.id}`}
          className="whitespace-nowrap rounded-[9px] border border-line bg-surface px-4 py-[10px] text-center text-[13px] font-semibold text-ink transition-colors hover:bg-canvas"
        >
          + Remind me
        </Link>
      </div>
    </div>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="mb-[1px] text-[11px] text-[#8a97a1]">{label}</div>
      <div
        className={cn(
          'font-mono',
          strong ? 'text-base font-bold text-navy' : 'text-[15px] font-semibold text-ink'
        )}
      >
        {value}
      </div>
    </div>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line bg-[#f4f2ec] px-2 py-[3px] text-[11px] text-muted">
      {children}
    </span>
  );
}
