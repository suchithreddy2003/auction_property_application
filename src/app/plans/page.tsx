import * as React from 'react';
import Link from 'next/link';
import { Card, Overline } from '@/components/ui';
import { PlansPricing } from './plans-pricing';

export const metadata = {
  title: 'Plans & subscriptions — Hanshitha Auctions',
  description:
    'Free browsing shows every listing. Subscribe to unlock exact addresses, bank contacts, full documents and detailed risk breakdowns.',
};

const trust = [
  'Cancel anytime',
  'GST invoice provided',
  'Secure UPI / card payments',
  'Free listing browsing forever',
];

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: 'What can I see without subscribing?',
    a: 'Every listing is browsable free — including risk tags, key dates, reserve price and a high-level summary. Subscriptions unlock exact addresses, bank contacts, full documents and detailed risk breakdowns.',
  },
  {
    q: 'Can I cancel or change plans anytime?',
    a: 'Yes. Upgrade, downgrade or cancel from your account at any time. Changes apply from your next billing cycle; no lock-in.',
  },
  {
    q: 'Do you guarantee a property is safe to buy?',
    a: (
      <>
        No — Hanshitha Auctions surfaces verified information and indicative risk scores to help your
        due diligence. Always confirm against the original notice, or use our assisted{' '}
        <Link href="/services" className="font-medium text-trust hover:underline">
          Legal review
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Is my payment secure?',
    a: 'Payments are processed through PCI-compliant gateways supporting UPI, cards and net-banking. You receive a GST invoice for every charge.',
  },
];

export default function PlansPage() {
  return (
    <div className="mx-auto max-w-[1120px] space-y-12 py-4">
      {/* Intro */}
      <section className="text-center">
        <Overline className="text-trust">Plans &amp; subscriptions</Overline>
        <h1 className="mt-3 text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-0.02em] text-ink">
          Unlock the full picture before you bid
        </h1>
        <p className="mx-auto mt-3 max-w-[620px] text-[15px] leading-relaxed text-muted">
          Free browsing shows every listing. Subscribe to reveal exact addresses, bank contacts, full
          document downloads and detailed risk breakdowns. Cancel anytime.
        </p>
      </section>

      <PlansPricing />

      {/* Trust strip */}
      <Card className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-4 text-[13px] text-muted">
        {trust.map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className="font-bold text-risk-low">✓</span>
            {t}
          </span>
        ))}
      </Card>

      {/* FAQ */}
      <section>
        <h2 className="mb-6 text-center text-[24px] font-extrabold tracking-[-0.02em]">
          Common questions
        </h2>
        <div className="mx-auto max-w-[760px] space-y-3">
          {faqs.map((f) => (
            <Card key={f.q} className="p-5">
              <h3 className="text-[15px] font-bold text-ink">{f.q}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.a}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
