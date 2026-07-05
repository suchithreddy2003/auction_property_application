import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasActiveSubscription } from '@/lib/subscription';
import { projectListing, viewerTier } from '@/lib/gating';
import { ListingCard } from '@/components/listing-card';
import { Button, Card } from '@/components/ui';

export const revalidate = 60;

export default async function Home() {
  const session = await getSession();
  const subscribed = session ? await hasActiveSubscription(session.uid) : false;
  const tier = await viewerTier(session, subscribed);

  const featured = await prisma.listing.findMany({
    where: { published: true, isPremium: true },
    orderBy: [{ publishedAt: 'desc' }],
    take: 6,
  });
  const recent = await prisma.listing.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: 'desc' }],
    take: 8,
  });

  return (
    <div className="space-y-10">
      <section className="rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white">
        <h1 className="text-3xl font-bold md:text-4xl">
          Auction properties — verified, summarised, decided.
        </h1>
        <p className="mt-3 max-w-2xl text-white/90">
          Aggregated notices from official platforms, bank sites and engines.
          Risk-scored, document-checked, and ready for action.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/listings">
            <Button size="lg" variant="secondary">Browse listings</Button>
          </Link>
          <Link href="/plans">
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
              See plans
            </Button>
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-2xl font-semibold">Premium picks</h2>
            <Link href="/listings?premium=1" className="text-sm text-brand-700 hover:underline">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={projectListing(l, tier)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Recent listings</h2>
          <Link href="/listings" className="text-sm text-brand-700 hover:underline">
            See all
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No published listings yet. Run <code>npm run db:seed</code>.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((l) => (
              <ListingCard key={l.id} listing={projectListing(l, tier)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-semibold">How it works</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="p-5">
            <div className="text-xs font-semibold uppercase text-brand-600">1. Discover</div>
            <p className="mt-2 text-gray-700">
              We aggregate notices from banks, official platforms and auction engines daily.
            </p>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-semibold uppercase text-brand-600">2. Decode</div>
            <p className="mt-2 text-gray-700">
              Plain-English summaries, risk score and document checks — ready to read.
            </p>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-semibold uppercase text-brand-600">3. Decide</div>
            <p className="mt-2 text-gray-700">
              Subscribe, save searches, get alerts. Or hire an agent to handle it for you.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
