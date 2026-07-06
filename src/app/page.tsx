import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasActiveSubscription } from '@/lib/subscription';
import { projectListing, viewerTier } from '@/lib/gating';
import { ListingCard } from '@/components/listing-card';
import { Button, Card } from '@/components/ui';
import { formatCompactINR, formatAuctionDate, titleCase } from '@/lib/format';

export const revalidate = 60;

export default async function Home() {
  const session = await getSession();
  const subscribed = session ? await hasActiveSubscription(session.uid) : false;
  const tier = await viewerTier(session, subscribed);
  const now = new Date();

  const [featured, recent, nextEvent, upcomingCount, cityRows, bankRows] = await Promise.all([
    prisma.listing.findMany({
      where: { published: true, isPremium: true },
      orderBy: [{ publishedAt: 'desc' }],
      take: 6,
      include: { events: { orderBy: { auctionDateTime: 'asc' }, take: 1 } },
    }),
    prisma.listing.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: 'desc' }],
      take: 8,
      include: { events: { orderBy: { auctionDateTime: 'asc' }, take: 1 } },
    }),
    prisma.auctionEvent.findFirst({
      where: { auctionDateTime: { gte: now }, listing: { published: true } },
      orderBy: { auctionDateTime: 'asc' },
      include: { listing: true },
    }),
    prisma.auctionEvent.count({ where: { auctionDateTime: { gte: now }, listing: { published: true } } }),
    prisma.listing.findMany({ where: { published: true }, distinct: ['city'], select: { city: true } }),
    prisma.listing.findMany({ where: { published: true }, distinct: ['lenderName'], select: { lenderName: true } }),
  ]);

  const nextListing = nextEvent ? projectListing(nextEvent.listing, tier) : null;

  return (
    <div className="relative left-1/2 -mb-6 -mt-6 w-screen -translate-x-1/2">
      {/* Hero B — split + live panel */}
      <section className="bg-[linear-gradient(165deg,#12385a,#0e2a41)] px-[22px] py-14 text-white">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left — headline + search */}
          <div>
            <div className="mb-[18px] inline-flex items-center gap-[7px] rounded-full border border-white/20 bg-white/10 px-[13px] py-[6px] text-[12.5px] font-medium">
              <span className="text-[#7fd6a3]">●</span> India&apos;s verified auction marketplace
            </div>
            <h1 className="mb-3 text-[clamp(30px,5vw,48px)] font-extrabold leading-[1.08] tracking-[-0.025em]">
              Auction properties — verified, decoded, decided.
            </h1>
            <p className="mb-6 max-w-[560px] text-[clamp(15px,2vw,18px)] leading-[1.55] text-[#c4d6e6]">
              Aggregated bank &amp; tribunal auction notices, risk-scored and document-checked, so
              you can act with confidence — without wading through jargon.
            </p>

            <form action="/listings" className="flex flex-col gap-2 sm:flex-row">
              <input
                name="q"
                placeholder="Search by city, locality, bank or listing ID"
                className="h-12 flex-1 rounded-[10px] border border-white/15 bg-white px-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-trust"
              />
              <Button type="submit" size="lg">Search auctions</Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[#9fb6cc]">
              <span>✓ Risk-checked</span>
              <span>✓ Document-verified</span>
              <span>✓ Loan-ready options</span>
            </div>
          </div>

          {/* Right — live "next auction" panel */}
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9fb6cc]">
                Next auction
              </span>
              <Link href="/calendar" className="text-[12.5px] font-semibold text-[#7fb2e6] hover:underline">
                View calendar →
              </Link>
            </div>

            {nextEvent && nextListing ? (
              <Link
                href={`/listings/${nextListing.id}`}
                className="block rounded-xl bg-white p-4 text-ink transition-shadow hover:shadow-lg"
              >
                <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.05em] text-[#8a8375]">
                  {titleCase(nextListing.propertyType)} · {nextListing.city}
                </div>
                <div className="mb-2 text-[15px] font-semibold leading-snug">{nextListing.title}</div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[11px] text-[#8a97a1]">Reserve price</div>
                    <div className="font-mono text-lg font-bold text-navy">
                      {nextListing.reservePrice != null
                        ? formatCompactINR(nextListing.reservePrice)
                        : nextListing.priceDisplay}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-[#8a97a1]">Auction date</div>
                    <div className="text-[13px] font-semibold">
                      {formatAuctionDate(nextEvent.auctionDateTime)}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-xl bg-white/90 p-4 text-center text-[13px] text-muted">
                No upcoming auctions yet — check back soon.
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat value={upcomingCount} label="Upcoming" />
              <Stat value={cityRows.length} label="Cities" />
              <Stat value={bankRows.length} label="Banks" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured (premium) */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-[22px] py-12">
          <SectionHead title="Premium picks" href="/listings?premium=1" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={projectListing(l, tier)} auctionDate={l.events[0]?.auctionDateTime} />
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="border-t border-line bg-[#fbfaf7] px-[22px] py-12">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead title="Recent listings" href="/listings" />
          {recent.length === 0 ? (
            <Card className="p-8 text-center text-muted">
              No published listings yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((l) => (
                <ListingCard key={l.id} listing={projectListing(l, tier)} auctionDate={l.events[0]?.auctionDateTime} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1200px] px-[22px] py-12">
        <h2 className="mb-6 text-[26px] font-extrabold tracking-[-0.02em]">How it works</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ['1. Discover', 'We aggregate notices from banks, official platforms and auction engines daily.'],
            ['2. Decode', 'Plain-English summaries, a risk score and document checks — ready to read.'],
            ['3. Decide', 'Subscribe, save searches, get alerts — or hire an agent to handle it for you.'],
          ].map(([step, body]) => (
            <Card key={step} className="p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-trust">{step}</div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">{body}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-white/[0.06] px-3 py-3 text-center">
      <div className="font-mono text-2xl font-bold text-white">{value}</div>
      <div className="mt-0.5 text-[11px] text-[#9fb6cc]">{label}</div>
    </div>
  );
}

function SectionHead({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-trust hover:underline">
        See all →
      </Link>
    </div>
  );
}
