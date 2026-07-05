import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, Badge } from '@/components/ui';

export const revalidate = 300;

export default async function CalendarPage() {
  const events = await prisma.auctionEvent.findMany({
    where: { auctionDateTime: { gte: new Date() }, listing: { published: true } },
    orderBy: { auctionDateTime: 'asc' },
    take: 50,
    include: { listing: { select: { id: true, title: true, city: true, state: true, isPremium: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Auction calendar</h1>
      <p className="text-gray-600">Upcoming auctions across all published listings.</p>
      {events.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">No upcoming auctions.</Card>
      ) : (
        <Card className="divide-y divide-gray-100">
          {events.map((ev) => (
            <Link key={ev.id} href={`/listings/${ev.listing.id}`} className="block px-5 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{ev.listing.title}</div>
                  <div className="text-sm text-gray-600">
                    {ev.listing.city}, {ev.listing.state}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{ev.auctionDateTime.toLocaleString('en-IN')}</div>
                  {ev.listing.isPremium && <Badge tone="info">Premium</Badge>}
                </div>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
