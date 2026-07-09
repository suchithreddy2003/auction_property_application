import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasActiveSubscription } from '@/lib/subscription';
import { projectListing, viewerTier } from '@/lib/gating';
import type { Prisma } from '@prisma/client';

// Public-ish JSON endpoint. Gating is applied based on the requester's
// session, identical to the SSR listing pages — anonymous calls see the
// teaser projection, subscribed users see full details.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? undefined;
  const state = url.searchParams.get('state') ?? undefined;
  const city = url.searchParams.get('city') ?? undefined;
  const type = url.searchParams.get('type') ?? undefined;
  const status = url.searchParams.get('status') ?? undefined;
  const premium = url.searchParams.get('premium') === '1';
  const minPrice = parseIntOrUndef(url.searchParams.get('minPrice'));
  const maxPrice = parseIntOrUndef(url.searchParams.get('maxPrice'));
  const page = Math.max(1, parseIntOrUndef(url.searchParams.get('page')) ?? 1);
  const pageSize = Math.min(50, Math.max(1, parseIntOrUndef(url.searchParams.get('pageSize')) ?? 20));

  const where: Prisma.ListingWhereInput = { published: true };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { lenderName: { contains: q, mode: 'insensitive' } },
      { addressText: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (state) where.state = state;
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (type) where.propertyType = type;
  if (status) where.status = status;
  if (premium) where.isPremium = true;
  if (minPrice != null || maxPrice != null) {
    where.reservePrice = {};
    if (minPrice != null) where.reservePrice.gte = minPrice;
    if (maxPrice != null) where.reservePrice.lte = maxPrice;
  }

  const session = await getSession();
  const subscribed = session ? await hasActiveSubscription(session.uid) : false;
  const tier = await viewerTier(session, subscribed);

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ isPremium: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    items: items.map((l) => projectListing(l, tier)),
  });
}

function parseIntOrUndef(v: string | null) {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}
