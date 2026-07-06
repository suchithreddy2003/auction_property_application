import Link from 'next/link';
import { Card, Button, Overline } from '@/components/ui';

export const metadata = {
  title: 'About — Hanshitha Auctions',
  description: 'Aggregated auction notices with risk insights and assisted services.',
};

const steps: { icon: string; tint: string; title: string; desc: string }[] = [
  {
    icon: '🗂',
    tint: 'bg-trust/10',
    title: 'Aggregate',
    desc: 'We pull auction notices from official platforms, bank websites, auction engines and newspapers — then verify each against its source.',
  },
  {
    icon: '💠',
    tint: 'bg-premium/10',
    title: 'Decode',
    desc: 'Every listing is risk-scored by our own rules: possession status, document completeness, encumbrance and litigation mentions, re-auction history and source-trust tier.',
  },
  {
    icon: '🔎',
    tint: 'bg-trust/10',
    title: 'Serve',
    desc: 'Filtered, searchable listings — free to browse. Subscribe to unlock exact addresses, contacts, full documents and the detailed risk breakdown.',
  },
  {
    icon: '🤝',
    tint: 'bg-risk-low/10',
    title: 'Assist',
    desc: 'When you want a human, get on-demand legal review, valuation, inspection and bid-day support from vetted partners.',
  },
];

// Grouped into columns to match the design layout (2 / 1 / 1).
const trustColumns: string[][] = [
  [
    'Hanshitha Auctions is an information platform — not a legal, valuation, or investment adviser. Use us to inform your own due diligence.',
    'Always confirm the terms, dues and possession status directly with the lender before you transact.',
  ],
  ['Every listing links back to its original source notice, so you can always verify the details first-hand.'],
  ['Auction outcomes are subject to tribunal and lender processes that are outside our control.'],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1120px] space-y-14 py-4">
      {/* Intro */}
      <section className="text-center">
        <Overline className="text-trust">About us</Overline>
        <h1 className="mt-3 text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-0.02em] text-ink">
          About Hanshitha Auctions
        </h1>
        <p className="mx-auto mt-3 max-w-[640px] text-[15px] leading-relaxed text-muted">
          We aggregate property-auction notices from across India and turn dense legal and auction
          text into something a buyer can actually read, compare and act on.
        </p>
      </section>

      {/* What we do */}
      <section>
        <h2 className="text-center text-[24px] font-extrabold tracking-[-0.02em]">What we do</h2>
        <p className="mx-auto mt-1 max-w-[560px] text-center text-[13.5px] text-muted">
          Four things, done carefully — so you spend less time hunting and more time deciding.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title} className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-[15px] ${s.tint}`}>
                  {s.icon}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#8a97a1]">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="text-base font-bold text-ink">{s.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust & accuracy */}
      <section>
        <div className="rounded-2xl border border-trust/15 bg-trust/[0.06] p-6 sm:p-8">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-trust/15 bg-surface text-[15px]">
              🛡
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-ink">Trust &amp; accuracy</h2>
              <p className="text-[13px] text-muted">
                How to read what we publish — and what we don&apos;t do.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
            {trustColumns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-4">
                {col.map((p) => (
                  <div key={p} className="flex gap-2 text-[13px] leading-relaxed text-[#3c4a56]">
                    <span className="flex-none text-muted">—</span>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data, privacy & payments */}
      <section>
        <Card className="p-6 sm:p-8">
          <Overline>Data, privacy &amp; payments</Overline>
          <div className="mt-4 grid grid-cols-1 gap-6 text-[13px] leading-relaxed text-ink md:grid-cols-3">
            <DataPoint>We store the minimum personal data needed to run your account.</DataPoint>
            <DataPoint>
              Payments are processed via Razorpay — we never see or store your card details.
            </DataPoint>
            <DataPoint>
              Request a data export or deletion anytime at{' '}
              <a href="mailto:privacy@hanshitha.in" className="font-medium text-trust hover:underline">
                privacy@hanshitha.in
              </a>
              .
            </DataPoint>
          </div>
        </Card>
      </section>

      {/* CTA band */}
      <section>
        <div className="rounded-2xl bg-[linear-gradient(165deg,#12385a,#0e2a41)] px-6 py-10 text-center text-white">
          <h2 className="text-[22px] font-extrabold tracking-[-0.02em]">
            Clear information, calmly presented.
          </h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[14px] leading-relaxed text-[#c4d6e6]">
            Browse every verified listing for free. Subscribe or ask us for help only when you&apos;re
            ready.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/listings">
              <Button size="lg">Start browsing listings</Button>
            </Link>
            <Link
              href="/account/services/new?type=OTHER"
              className="inline-flex h-12 items-center rounded-md border border-white/25 bg-white/[0.06] px-6 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              Have questions? Talk to us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function DataPoint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="flex-none font-bold text-risk-low">✓</span>
      <span>{children}</span>
    </div>
  );
}
