import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, Badge, Button } from '@/components/ui';

export default async function AdminListingsPage({ searchParams }: { searchParams: { q?: string; published?: string } }) {
  const where: any = {};
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q } },
      { lenderName: { contains: searchParams.q } },
      { city: { contains: searchParams.q } },
    ];
  }
  if (searchParams.published === '1') where.published = true;
  if (searchParams.published === '0') where.published = false;

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Listings</h1>
        <Link href="/admin/listings/new">
          <Button>+ New listing</Button>
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={searchParams.q ?? ''}
          placeholder="Search title / lender / city"
          className="h-10 flex-1 rounded-md border border-gray-300 px-3 text-sm"
        />
        <select
          name="published"
          defaultValue={searchParams.published ?? ''}
          className="h-10 rounded-md border border-gray-300 px-3 text-sm"
        >
          <option value="">All</option>
          <option value="1">Published</option>
          <option value="0">Draft</option>
        </select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      {listings.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">No listings yet.</Card>
      ) : (
        <Card className="divide-y divide-gray-100">
          {listings.map((l) => (
            <Link key={l.id} href={`/admin/listings/${l.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
              <div className="min-w-0">
                <div className="font-medium">{l.title}</div>
                <div className="text-xs text-gray-500">
                  {l.lenderName} · {l.city}, {l.state} · Reserve ₹{l.reservePrice.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {l.published ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Draft</Badge>}
                {l.isPremium && <Badge tone="info">Premium</Badge>}
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
