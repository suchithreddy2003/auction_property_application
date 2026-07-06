import * as React from 'react';
import Link from 'next/link';
import { Badge, type BadgeTone } from './ui';
import type { GatedListing } from '@/lib/gating';
import { formatCompactINR, formatAuctionDate, titleCase } from '@/lib/format';

const riskTone: Record<string, BadgeTone> = {
  LOW: 'risk-low',
  MEDIUM: 'risk-medium',
  HIGH: 'risk-high',
};

const statusMeta: Record<string, { label: string; tone: BadgeTone }> = {
  UPCOMING: { label: 'Upcoming', tone: 'upcoming' },
  LIVE: { label: 'Open', tone: 'open' },
  RE_AUCTION: { label: 'Re-auction', tone: 'reauction' },
  COMPLETED: { label: 'Closed', tone: 'closed' },
  SOLD: { label: 'Sold', tone: 'closed' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'closed' },
};

// Design "Card A" — image-forward listing card. Used on Home and the /listings grid.
export function ListingCard({
  listing,
  auctionDate,
}: {
  listing: GatedListing;
  auctionDate?: Date | null;
}) {
  const status = statusMeta[listing.status] ?? { label: titleCase(listing.status), tone: 'closed' as BadgeTone };
  const reserve = listing.reservePrice != null ? formatCompactINR(listing.reservePrice) : listing.priceDisplay;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_1px_2px_rgba(16,33,46,.04)] transition-shadow hover:shadow-md"
    >
      {/* Photo */}
      <div className="relative h-[170px] bg-[repeating-linear-gradient(135deg,#edeae3,#edeae3_11px,#e4e0d7_11px,#e4e0d7_22px)]">
        {listing.isPremium && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-premium/15 px-2 py-[3px] text-[11px] font-semibold text-premium ring-1 ring-premium/30">
            ★ PREMIUM
          </span>
        )}
        <span className="absolute bottom-3 left-3">
          <Badge tone={status.tone} dot>{status.label}</Badge>
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-[#8a8375]">
            {titleCase(listing.propertyType)} · {listing.city}
          </div>
          {listing.riskLabel && (
            <Badge tone={riskTone[listing.riskLabel] ?? 'neutral'}>{titleCase(listing.riskLabel)} risk</Badge>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-[1.3] text-ink">{listing.title}</h3>
        <p className="text-[13px] text-muted">{listing.addressDisplay}</p>

        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] text-[#8a97a1]">Reserve price</div>
            <div className="font-mono text-lg font-bold text-navy">{reserve}</div>
          </div>
          {auctionDate && (
            <div className="text-right">
              <div className="text-[11px] text-[#8a97a1]">Auction date</div>
              <div className="text-[13px] font-semibold text-ink">{formatAuctionDate(auctionDate)}</div>
            </div>
          )}
        </div>

        <div className="mt-1 flex flex-wrap gap-[6px]">
          {listing.emd != null && <MetaChip>EMD {formatCompactINR(listing.emd)}</MetaChip>}
          {listing.possession && <MetaChip>{titleCase(listing.possession)}</MetaChip>}
          {listing.loanAvailable && (
            <span className="rounded-md border border-[#bfe0e1] bg-[#e5f2f2] px-2 py-[3px] text-[11px] text-verified">
              Loan available
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
          <span className="truncate text-[12px] text-muted">{listing.lenderName ?? ' '}</span>
          <span className="flex-none text-[13px] font-semibold text-trust group-hover:underline">View details →</span>
        </div>
      </div>
    </Link>
  );
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line bg-[#f4f2ec] px-2 py-[3px] text-[11px] text-muted">
      {children}
    </span>
  );
}
