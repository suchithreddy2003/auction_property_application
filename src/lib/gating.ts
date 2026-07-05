// Field-level visibility per the §5.4 gating table.
// This is the *server-side* projection. The UI never sees gated fields
// because they are removed before serialization.

import type { Listing } from '@prisma/client';
import type { Session } from '@/lib/auth';

export type ViewerTier = 'ANON' | 'LOGGED_IN' | 'SUBSCRIBED';

export type GatedListing = Partial<Listing> & {
  // Always present
  id: string;
  title: string;
  propertyType: string;
  status: string;
  city: string;
  state: string;
  riskScore?: number | null;
  riskLabel?: string | null;
  isPremium: boolean;
  // Computed
  priceDisplay: string;
  addressDisplay: string;
  contactRevealed: boolean;
  documentsAccessible: boolean;
  detailedRiskAvailable: boolean;
};

export async function viewerTier(
  session: Session | null,
  hasActiveSubscription: boolean
): Promise<ViewerTier> {
  if (!session) return 'ANON';
  if (hasActiveSubscription) return 'SUBSCRIBED';
  return 'LOGGED_IN';
}

function formatPrice(paise: number | null | undefined, viewer: ViewerTier): string {
  if (paise == null) return '—';
  if (viewer === 'ANON') return 'Login to view';
  const rupees = paise;
  // Indian-format separators
  return '₹' + rupees.toLocaleString('en-IN');
}

function projectAddress(
  listing: Pick<Listing, 'addressLine' | 'locality' | 'city' | 'state' | 'pincode'>,
  viewer: ViewerTier
): string {
  const parts: string[] = [];
  if (viewer === 'SUBSCRIBED' && listing.addressLine) parts.push(listing.addressLine);
  if (viewer !== 'ANON' && listing.locality) parts.push(listing.locality);
  parts.push(listing.city, listing.state);
  if (viewer === 'SUBSCRIBED' && listing.pincode) parts.push(listing.pincode);
  return parts.filter(Boolean).join(', ');
}

export function projectListing(
  listing: Listing,
  viewer: ViewerTier
): GatedListing {
  const base: GatedListing = {
    id: listing.id,
    title: listing.title,
    propertyType: listing.propertyType,
    status: listing.status,
    city: listing.city,
    state: listing.state,
    isPremium: listing.isPremium,
    priceDisplay: formatPrice(listing.reservePrice, viewer),
    addressDisplay: projectAddress(listing, viewer),
    contactRevealed: viewer === 'SUBSCRIBED',
    documentsAccessible: viewer === 'SUBSCRIBED',
    detailedRiskAvailable: viewer === 'SUBSCRIBED',
  };

  if (viewer !== 'ANON') {
    base.reservePrice = listing.reservePrice;
    base.emd = listing.emd;
    base.bidIncrement = listing.bidIncrement;
    base.lenderName = listing.lenderName;
    base.auctionType = listing.auctionType;
    base.possession = listing.possession;
    base.riskScore = listing.riskScore;
    base.riskLabel = listing.riskLabel;
    base.loanAvailable = listing.loanAvailable;
  } else {
    // Teaser only
    base.riskLabel = listing.riskLabel;
  }

  if (viewer === 'SUBSCRIBED') {
    base.addressLine = listing.addressLine;
    base.locality = listing.locality;
    base.pincode = listing.pincode;
    base.latitude = listing.latitude;
    base.longitude = listing.longitude;
    base.branch = listing.branch;
    base.authorizedOfficer = listing.authorizedOfficer;
    base.borrowerName = listing.borrowerName;
    base.riskFactors = listing.riskFactors;
  }

  return base;
}

export function canSeeDocument(
  documentVisibility: string,
  viewer: ViewerTier
): boolean {
  if (documentVisibility === 'PUBLIC') return true;
  if (documentVisibility === 'PARTIAL') return viewer !== 'ANON';
  // SUBSCRIBED
  return viewer === 'SUBSCRIBED';
}
