import Link from 'next/link';
import { Card, Badge } from './ui';
import type { GatedListing } from '@/lib/gating';

function riskTone(label?: string | null) {
  if (label === 'LOW') return 'success';
  if (label === 'MEDIUM') return 'warning';
  if (label === 'HIGH') return 'danger';
  return 'default';
}

export function ListingCard({ listing }: { listing: GatedListing }) {
  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="flex h-full flex-col p-4 transition-shadow hover:shadow-md">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
            {listing.title}
          </h3>
          {listing.isPremium && <Badge tone="info">Premium</Badge>}
        </div>
        <p className="mb-3 text-sm text-gray-600">{listing.addressDisplay}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-xs">
          <Badge>{listing.propertyType.replace('_', ' ')}</Badge>
          <Badge tone="default">{listing.status.replace('_', ' ')}</Badge>
          {listing.riskLabel && (
            <Badge tone={riskTone(listing.riskLabel)}>
              {listing.riskLabel} risk
            </Badge>
          )}
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-500">Reserve</div>
            <div className="text-lg font-bold text-gray-900">{listing.priceDisplay}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
