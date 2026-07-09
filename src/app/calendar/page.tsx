import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasActiveSubscription } from '@/lib/subscription';
import { projectListing, viewerTier } from '@/lib/gating';
import { PropertyTypes } from '@/types/enums';
import { Hero } from '@/components/hero';
import { CalendarMonth, type DayEvents } from '@/components/calendar-month';
import { AuctionRow } from '@/components/auction-row';
import { Card } from '@/components/ui';

export const revalidate = 300;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PRICE_BUCKETS: Record<string, { gte?: number; lt?: number; label: string }> = {
  lt25: { lt: 2_500_000, label: 'Under ₹ 25 L' },
  '25-100': { gte: 2_500_000, lt: 10_000_000, label: '₹ 25 L – 1 Cr' },
  '1-3cr': { gte: 10_000_000, lt: 30_000_000, label: '₹ 1 – 3 Cr' },
  gt3cr: { gte: 30_000_000, label: '₹ 3 Cr+' },
};

type SP = {
  m?: string;
  state?: string;
  city?: string;
  type?: string;
  risk?: string;
  price?: string;
};

function parseMonth(m: string | undefined): { year: number; month: number } {
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split('-').map(Number);
    if (mo >= 1 && mo <= 12) return { year: y, month: mo - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export default async function CalendarPage({ searchParams }: { searchParams: SP }) {
  const session = await getSession();
  const subscribed = session ? await hasActiveSubscription(session.uid) : false;
  const tier = await viewerTier(session, subscribed);

  const { year, month } = parseMonth(searchParams.m);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);
  const now = new Date();

  // Build listing filter shared by the grid and the upcoming list.
  const listingWhere: Prisma.ListingWhereInput = { published: true };
  if (searchParams.state) listingWhere.state = searchParams.state;
  if (searchParams.city) listingWhere.city = { contains: searchParams.city, mode: 'insensitive' };
  if (searchParams.type) listingWhere.propertyType = searchParams.type;
  if (searchParams.risk) listingWhere.riskLabel = searchParams.risk;
  const bucket = searchParams.price ? PRICE_BUCKETS[searchParams.price] : undefined;
  if (bucket) {
    listingWhere.reservePrice = {};
    if (bucket.gte != null) listingWhere.reservePrice.gte = bucket.gte;
    if (bucket.lt != null) listingWhere.reservePrice.lt = bucket.lt;
  }

  const [monthEvents, upcoming, states, cities] = await Promise.all([
    prisma.auctionEvent.findMany({
      where: { auctionDateTime: { gte: monthStart, lt: monthEnd }, listing: listingWhere },
      include: { listing: { select: { riskLabel: true } } },
    }),
    prisma.auctionEvent.findMany({
      where: { auctionDateTime: { gte: now }, listing: listingWhere },
      orderBy: { auctionDateTime: 'asc' },
      include: { listing: true },
      take: 6,
    }),
    prisma.listing.findMany({
      where: { published: true },
      distinct: ['state'],
      select: { state: true },
      orderBy: { state: 'asc' },
    }),
    prisma.listing.findMany({
      where: { published: true },
      distinct: ['city'],
      select: { city: true },
      orderBy: { city: 'asc' },
    }),
  ]);

  // Aggregate auctions per day, keeping the highest risk seen that day.
  const rank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const eventsByDay: Record<number, DayEvents> = {};
  for (const ev of monthEvents) {
    const d = ev.auctionDateTime.getDate();
    const r = ev.listing.riskLabel;
    const cur = eventsByDay[d] ?? { count: 0, risk: null };
    cur.count += 1;
    if (r && (cur.risk == null || (rank[r] ?? 0) > (rank[cur.risk] ?? 0))) cur.risk = r;
    eventsByDay[d] = cur;
  }

  // Preserve active filters across month navigation.
  const navHref = (y: number, mo: number) => {
    const p = new URLSearchParams();
    p.set('m', monthParam(y, mo));
    for (const k of ['state', 'city', 'type', 'risk', 'price'] as const) {
      if (searchParams[k]) p.set(k, searchParams[k]!);
    }
    return `/calendar?${p.toString()}`;
  };
  const prev = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const next = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };

  return (
    <div className="relative left-1/2 -mb-6 -mt-6 w-screen -translate-x-1/2">
      <Hero
        badge={
          <>
            <span className="text-[#7fd6a3]">●</span> Updated daily with verified auction dates
          </>
        }
        title="Auction calendar — plan ahead"
        subtitle="See all upcoming auctions across India. Filter by city, property type, and price to track the auctions you care about — then set reminders."
      />

      {/* Filters toolbar */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1200px] px-[22px] py-5">
          <form className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-end gap-3">
            <input type="hidden" name="m" value={monthParam(year, month)} />
            <FilterSelect name="state" label="State" value={searchParams.state} placeholder="All states">
              {states.map((s) => (
                <option key={s.state} value={s.state}>{s.state}</option>
              ))}
            </FilterSelect>
            <FilterSelect name="city" label="City" value={searchParams.city} placeholder="All cities">
              {cities.map((c) => (
                <option key={c.city} value={c.city}>{c.city}</option>
              ))}
            </FilterSelect>
            <FilterSelect name="type" label="Property type" value={searchParams.type} placeholder="All types">
              {PropertyTypes.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </FilterSelect>
            <FilterSelect name="risk" label="Risk level" value={searchParams.risk} placeholder="All risks">
              <option value="LOW">Low risk</option>
              <option value="MEDIUM">Medium risk</option>
              <option value="HIGH">High risk</option>
            </FilterSelect>
            <FilterSelect name="price" label="Reserve price" value={searchParams.price} placeholder="Any price">
              {Object.entries(PRICE_BUCKETS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </FilterSelect>
            <button
              type="submit"
              className="h-[42px] rounded-[9px] bg-trust px-4 text-sm font-semibold text-white transition-colors hover:bg-trust-dark"
            >
              Apply filters
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-[10px] border-t border-[#efece5] pt-3">
            <span className="text-[13px] text-[#8a97a1]">View:</span>
            <div className="flex overflow-hidden rounded-[9px] border border-[#d5cfc3]">
              <span className="bg-trust px-[14px] py-[10px] text-[13px] font-semibold text-white">Calendar</span>
              <Link href="/listings" className="border-l border-[#d5cfc3] px-[14px] py-[10px] text-[13px] font-semibold text-ink hover:bg-canvas">
                List view
              </Link>
            </div>
            <Link
              href="/account/searches/new"
              className="ml-auto text-[13px] font-semibold text-trust hover:underline"
            >
              + Set email alerts
            </Link>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="mx-auto max-w-[1200px] px-[22px] py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-[28px] font-extrabold tracking-[-0.02em]">
              {MONTHS[month]} {year}
            </h2>
            <div className="text-[13.5px] text-muted">
              <b className="font-mono text-ink">{monthEvents.length}</b> auction
              {monthEvents.length === 1 ? '' : 's'} this month
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={navHref(prev.y, prev.m)} className="rounded-[9px] border border-[#d5cfc3] bg-surface px-[14px] py-[10px] text-[13px] font-semibold hover:bg-canvas">
              ‹ Previous
            </Link>
            <Link href={navHref(now.getFullYear(), now.getMonth())} className="rounded-[9px] border border-[#d5cfc3] bg-surface px-[14px] py-[10px] text-[13px] font-semibold hover:bg-canvas">
              Today
            </Link>
            <Link href={navHref(next.y, next.m)} className="rounded-[9px] border border-[#d5cfc3] bg-surface px-[14px] py-[10px] text-[13px] font-semibold hover:bg-canvas">
              Next ›
            </Link>
          </div>
        </div>

        <CalendarMonth year={year} month={month} eventsByDay={eventsByDay} today={now} />
      </div>

      {/* Upcoming auctions */}
      <div className="border-t border-line bg-[#fbfaf7] px-[22px] py-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="mb-1 text-[26px] font-extrabold tracking-[-0.02em]">
                Upcoming auctions in your filters
              </h2>
              <p className="text-[13.5px] text-muted">
                Properties matched to your search, sorted by auction date
              </p>
            </div>
            <Link href="/listings" className="text-sm font-semibold text-trust hover:underline">
              See all upcoming →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <Card className="p-8 text-center text-muted">No upcoming auctions match these filters.</Card>
          ) : (
            <div className="flex flex-col gap-[14px]">
              {upcoming.map((ev) => (
                <AuctionRow
                  key={ev.id}
                  listing={projectListing(ev.listing, tier)}
                  auctionDate={ev.auctionDateTime}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  placeholder,
  children,
}: {
  name: string;
  label: string;
  value?: string;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-[6px] block text-xs font-semibold text-muted">{label}</label>
      <select
        name={name}
        defaultValue={value ?? ''}
        className="h-[42px] w-full rounded-[9px] border border-[#d5cfc3] bg-[#fdfcfa] px-3 text-sm text-ink focus:border-trust focus:outline-none focus:ring-1 focus:ring-trust"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </div>
  );
}
