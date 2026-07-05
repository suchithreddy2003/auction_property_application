// Candidate-duplicate detection (§4.1.3).
// Designed to be cheap in MVP — a single pass that scores pairs against
// already-existing listings within the same state. Real prod will swap
// in pg_trgm and a candidate-window query.

import { prisma } from '@/lib/db';
import type { Listing } from '@prisma/client';

const DEFAULT_THRESHOLD = 0.7;

export type DedupeCandidate = {
  otherId: string;
  similarity: number;
  reasons: string[];
};

export async function findCandidates(
  listing: Pick<Listing, 'id' | 'state' | 'city' | 'lenderName' | 'reservePrice' | 'addressText' | 'borrowerName'>,
  threshold = DEFAULT_THRESHOLD
): Promise<DedupeCandidate[]> {
  const peers = await prisma.listing.findMany({
    where: {
      id: { not: listing.id },
      state: listing.state,
    },
    take: 500,
    select: {
      id: true,
      lenderName: true,
      reservePrice: true,
      addressText: true,
      borrowerName: true,
      city: true,
    },
  });

  return peers
    .map((p) => score(listing, p))
    .filter((c) => c.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

function score(
  a: Pick<Listing, 'lenderName' | 'reservePrice' | 'addressText' | 'borrowerName' | 'city'>,
  b: { id: string; lenderName: string; reservePrice: number; addressText: string | null; borrowerName: string | null; city: string }
): DedupeCandidate {
  const reasons: string[] = [];
  let total = 0;
  let weight = 0;

  // Lender (heavy)
  const lenderEq = norm(a.lenderName) === norm(b.lenderName);
  if (lenderEq) reasons.push('same lender');
  total += (lenderEq ? 1 : 0) * 0.3; weight += 0.3;

  // City
  const cityEq = norm(a.city) === norm(b.city);
  if (cityEq) reasons.push('same city');
  total += (cityEq ? 1 : 0) * 0.1; weight += 0.1;

  // Reserve price within ±5%
  const priceSim = priceSimilarity(a.reservePrice, b.reservePrice);
  if (priceSim > 0.95) reasons.push(`price within ${Math.round((1 - priceSim) * 100)}%`);
  total += priceSim * 0.2; weight += 0.2;

  // Address token overlap (Jaccard)
  const addrSim = tokenSimilarity(a.addressText, b.addressText);
  if (addrSim > 0.4) reasons.push('address tokens overlap');
  total += addrSim * 0.3; weight += 0.3;

  // Borrower name
  const borrowSim = a.borrowerName && b.borrowerName
    ? tokenSimilarity(a.borrowerName, b.borrowerName)
    : 0;
  if (borrowSim > 0.5) reasons.push('borrower name matches');
  total += borrowSim * 0.1; weight += 0.1;

  return {
    otherId: b.id,
    similarity: weight > 0 ? total / weight : 0,
    reasons,
  };
}

function norm(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function priceSimilarity(a: number, b: number): number {
  if (!a || !b) return 0;
  const ratio = Math.min(a, b) / Math.max(a, b);
  // Map [0.95, 1.0] → [0.5, 1.0] linearly; anything below 0.95 → 0
  if (ratio >= 0.95) return 0.5 + (ratio - 0.95) * 10;
  return 0;
}

function tokenSimilarity(a: string | null, b: string | null): number {
  const ta = new Set(norm(a).split(/\s+/).filter((t) => t.length > 2));
  const tb = new Set(norm(b).split(/\s+/).filter((t) => t.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersect = 0;
  for (const t of ta) if (tb.has(t)) intersect++;
  return intersect / (ta.size + tb.size - intersect);
}
