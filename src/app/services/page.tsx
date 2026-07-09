import Link from 'next/link';
import { Hero } from '@/components/hero';
import { Card, Button, Badge, type BadgeTone } from '@/components/ui';

type Service = {
  type: string; // maps to /account/services/new?type=
  icon: string;
  iconTint: string;
  name: string;
  desc: string;
  features: string[];
  priceLabel: string;
  price: string;
  turnaround: string;
  badge?: { text: string; tone: BadgeTone };
};

const services: Service[] = [
  {
    type: 'LEGAL_REVIEW',
    icon: '⚖️',
    iconTint: 'bg-trust/10',
    name: 'Legal & title review',
    desc: 'Encumbrance, title chain and lender process — verified by a partner advocate.',
    features: ['Encumbrance certificate (EC) review', 'Title & ownership check', 'Auction notice cross-verification'],
    priceLabel: 'Starting at',
    price: '₹ 4,999',
    turnaround: '3–5 days',
    badge: { text: 'POPULAR', tone: 'info' },
  },
  {
    type: 'VALUATION',
    icon: '📊',
    iconTint: 'bg-trust/10',
    name: 'Property valuation',
    desc: 'Independent market estimate with on-ground comparables and a fair-value range.',
    features: ['Comparable sales analysis', 'Fair value & reserve benchmark', 'Locality price trend note'],
    priceLabel: 'Starting at',
    price: '₹ 3,499',
    turnaround: '2–3 days',
  },
  {
    type: 'INSPECTION',
    icon: '🔍',
    iconTint: 'bg-trust/10',
    name: 'Physical inspection',
    desc: 'A coordinated site visit with a full photo and video condition report.',
    features: ['Occupancy & possession check', 'Condition report with photos', 'Neighbourhood & access notes'],
    priceLabel: 'Starting at',
    price: '₹ 2,999',
    turnaround: '4–6 days',
  },
  {
    type: 'BID_ASSIST',
    icon: '🎯',
    iconTint: 'bg-trust/10',
    name: 'Bid-day assistance',
    desc: 'EMD logistics, document prep and live support through the auction itself.',
    features: ['EMD & KYC preparation', 'e-Auction portal walkthrough', 'Live bidding support'],
    priceLabel: 'Pricing',
    price: 'Quoted',
    turnaround: 'On auction date',
    badge: { text: 'POPULAR', tone: 'info' },
  },
  {
    type: 'OTHER',
    icon: '🏦',
    iconTint: 'bg-trust/10',
    name: 'Loan assistance',
    desc: 'Get matched with lenders who finance auction purchases and track the sanction.',
    features: ['Eligibility pre-check', 'Lender matching', 'Sanction follow-up'],
    priceLabel: 'Pricing',
    price: 'Free',
    turnaround: '5–7 days',
  },
  {
    type: 'OTHER',
    icon: '💠',
    iconTint: 'bg-premium/10',
    name: 'End-to-end concierge',
    desc: 'A dedicated manager handles the full journey — from shortlist to possession.',
    features: ['Dedicated auction manager', 'All checks above, bundled', 'Post-auction possession help'],
    priceLabel: 'Pricing',
    price: 'Quoted',
    turnaround: 'Full cycle',
    badge: { text: 'PREMIUM', tone: 'premium' },
  },
];

const steps: [string, string][] = [
  ['Request a service', 'Pick a service and share the listing or your requirement.'],
  ['Free consult & quote', 'We confirm scope and send a fixed price quote for you to approve.'],
  ['Expert assigned', 'A vetted partner is assigned and begins the agreed work.'],
  ['Delivered to you', 'You receive the report or live support; payment is released on delivery.'],
];

export default function ServicesPage() {
  return (
    <div className="relative left-1/2 -mb-6 -mt-6 w-screen -translate-x-1/2">
      <Hero
        eyebrow="Assisted services"
        align="left"
        title="Expert help at every step, from due diligence to bid day."
        subtitle="Not sure if a listing is clean, or how to bid safely? Hand the hard parts to our vetted partners — scope and price confirmed upfront, before any work begins."
      >
        <div className="mt-5 flex flex-wrap gap-2">
          {['✓ Vetted partner experts', '₹ Fixed-scope quotes', '🛡 Payment held until delivery'].map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.18] bg-white/10 px-[13px] py-[7px] text-[12.5px] font-medium"
            >
              {p}
            </span>
          ))}
        </div>
      </Hero>

      {/* Service cards */}
      <section className="mx-auto max-w-[1200px] px-[22px] py-12">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.name} s={s} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-[#fbfaf7] px-[22px] py-12">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">How assisted services work</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            No surprises — you approve the quote before anything starts.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, body], i) => (
              <Card key={title} className="p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-trust/10 font-mono text-sm font-bold text-trust">
                  {i + 1}
                </div>
                <h3 className="text-[15px] font-bold text-ink">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-[1200px] px-[22px] py-12">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-[linear-gradient(165deg,#12385a,#0e2a41)] p-8 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">Not sure which service you need?</h2>
            <p className="mt-1 max-w-[520px] text-[14px] leading-relaxed text-[#c4d6e6]">
              Tell us the listing you&apos;re eyeing. An auction specialist will recommend the right
              checks — free, no obligation.
            </p>
          </div>
          <div className="flex flex-none flex-wrap gap-3">
            <Link href="/account/services/new?type=OTHER">
              <Button size="lg">💬 Talk to an agent</Button>
            </Link>
            <Link
              href="/account/services/new?type=LEGAL_REVIEW"
              className="inline-flex h-12 items-center rounded-md border border-white/25 bg-white/[0.06] px-6 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              Order a full report
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ s }: { s: Service }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-3 flex items-start justify-between">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-[16px] ${s.iconTint}`}>
          {s.icon}
        </span>
        {s.badge && <Badge tone={s.badge.tone}>{s.badge.text}</Badge>}
      </div>
      <h3 className="text-[17px] font-bold text-ink">{s.name}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.desc}</p>

      <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
        {s.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-ink">
            <span className="mt-[1px] flex-none font-bold text-premium">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4">
        <div className="flex items-end justify-between border-t border-line pt-4">
          <div>
            <div className="text-[11px] text-muted">{s.priceLabel}</div>
            <div className="font-mono text-[17px] font-bold text-navy">{s.price}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted">Turnaround</div>
            <div className="text-[13px] font-semibold text-ink">{s.turnaround}</div>
          </div>
        </div>
        <Link href={`/account/services/new?type=${s.type}`} className="mt-4 block">
          <Button className="w-full">Request this service</Button>
        </Link>
      </div>
    </Card>
  );
}
