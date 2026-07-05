import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasActiveSubscription } from '@/lib/subscription';
import { projectListing, viewerTier } from '@/lib/gating';
import { ListingCard } from '@/components/listing-card';
import { Card, Select, Input, Label, Button } from '@/components/ui';
import { PropertyTypes, ListingStatuses } from '@/types/enums';
import type { Prisma } from '@prisma/client';

type SearchParams = {
  q?: string;
  state?: string;
  city?: string;
  type?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
  premium?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 12;

function toInt(v: string | undefined) {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  const subscribed = session ? await hasActiveSubscription(session.uid) : false;
  const tier = await viewerTier(session, subscribed);
  const page = Math.max(1, toInt(searchParams.page) ?? 1);

  const where: Prisma.ListingWhereInput = { published: true };
  const minPrice = toInt(searchParams.minPrice);
  const maxPrice = toInt(searchParams.maxPrice);
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q } },
      { lenderName: { contains: searchParams.q } },
      { addressText: { contains: searchParams.q } },
    ];
  }
  if (searchParams.state) where.state = searchParams.state;
  if (searchParams.city) where.city = { contains: searchParams.city };
  if (searchParams.type) where.propertyType = searchParams.type;
  if (searchParams.status) where.status = searchParams.status;
  if (minPrice != null || maxPrice != null) {
    where.reservePrice = {};
    if (minPrice != null) where.reservePrice.gte = minPrice;
    if (maxPrice != null) where.reservePrice.lte = maxPrice;
  }
  if (searchParams.premium === '1') where.isPremium = true;

  let orderBy: Prisma.ListingOrderByWithRelationInput[] = [
    { isPremium: 'desc' },
    { publishedAt: 'desc' },
  ];
  switch (searchParams.sort) {
    case 'price_asc':  orderBy = [{ reservePrice: 'asc' }]; break;
    case 'price_desc': orderBy = [{ reservePrice: 'desc' }]; break;
    case 'risk_asc':   orderBy = [{ riskScore: 'asc' }]; break;
    case 'newest':     orderBy = [{ publishedAt: 'desc' }]; break;
  }

  const [items, total, states] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where: { published: true },
      distinct: ['state'],
      select: { state: true },
      orderBy: { state: 'asc' },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
      <aside>
        <Card className="p-4">
          <form className="space-y-3">
            <div>
              <Label htmlFor="q">Search</Label>
              <Input id="q" name="q" defaultValue={searchParams.q ?? ''} placeholder="Title / lender / address" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Select id="state" name="state" defaultValue={searchParams.state ?? ''}>
                <option value="">All states</option>
                {states.map((s) => (
                  <option key={s.state} value={s.state}>{s.state}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={searchParams.city ?? ''} />
            </div>
            <div>
              <Label htmlFor="type">Property type</Label>
              <Select id="type" name="type" defaultValue={searchParams.type ?? ''}>
                <option value="">Any</option>
                {PropertyTypes.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={searchParams.status ?? ''}>
                <option value="">Any</option>
                {ListingStatuses.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="minPrice">Min ₹</Label>
                <Input id="minPrice" name="minPrice" defaultValue={searchParams.minPrice ?? ''} inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="maxPrice">Max ₹</Label>
                <Input id="maxPrice" name="maxPrice" defaultValue={searchParams.maxPrice ?? ''} inputMode="numeric" />
              </div>
            </div>
            <div>
              <Label htmlFor="sort">Sort</Label>
              <Select id="sort" name="sort" defaultValue={searchParams.sort ?? ''}>
                <option value="">Premium first, newest</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
                <option value="risk_asc">Risk ↑</option>
              </Select>
            </div>
            <Button type="submit" className="w-full">Apply filters</Button>
            <Link href="/listings" className="block text-center text-xs text-gray-500 hover:underline">
              Clear all
            </Link>
          </form>
        </Card>
      </aside>

      <section>
        <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
          <span>{total} result{total === 1 ? '' : 's'}</span>
          <span>Page {page} of {pages}</span>
        </div>
        {items.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">No listings match these filters.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
              <ListingCard key={l.id} listing={projectListing(l, tier)} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: pages }).slice(0, 8).map((_, i) => {
              const p = i + 1;
              const params = new URLSearchParams(searchParams as Record<string, string>);
              params.set('page', String(p));
              return (
                <Link
                  key={p}
                  href={`/listings?${params.toString()}`}
                  className={`rounded-md border px-3 py-1 text-sm ${p === page ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
