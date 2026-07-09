'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Button, Overline } from '@/components/ui';

type Plan = {
  code: string;
  name: string;
  tagline: string;
  monthly: number; // rupees / month
  featuresHeading: string;
  features: string[];
  popular?: boolean;
};

const plans: Plan[] = [
  {
    code: 'BASIC',
    name: 'Basic',
    tagline: 'For first-time buyers exploring their first few auctions.',
    monthly: 499,
    featuresHeading: "What's included",
    features: [
      'Full listing details',
      'Reserve price & EMD shown',
      'Document previews',
      'High-level risk score',
      'Save searches & alerts',
    ],
  },
  {
    code: 'PRO',
    name: 'Pro',
    tagline: 'For serious buyers who need the full picture before bidding.',
    monthly: 999,
    featuresHeading: 'Everything in Basic, plus',
    features: [
      'Exact address & bank contact',
      'Full document downloads',
      'Detailed risk breakdown',
      'WhatsApp deadline alerts',
      'Unlimited saved listings',
    ],
    popular: true,
  },
  {
    code: 'INVESTOR',
    name: 'Investor',
    tagline: 'For repeat investors tracking deals across cities.',
    monthly: 2499,
    featuresHeading: 'Everything in Pro, plus',
    features: [
      'Re-auction history dashboards',
      'Portfolio watchlists',
      'Priority support',
      'Dedicated auction advisor',
      'Team seats & CSV export',
    ],
  },
];

export function PlansPricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div>
      {/* Billing toggle */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex items-center rounded-full border border-line bg-canvas p-1">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
              !annual ? 'bg-surface text-ink shadow-sm' : 'text-muted'
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
              annual ? 'bg-surface text-ink shadow-sm' : 'text-muted'
            )}
          >
            Annual · save 17%
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const price = annual ? p.monthly * 10 : p.monthly;
          return (
            <div
              key={p.code}
              className={cn(
                'relative flex h-full flex-col rounded-2xl bg-surface p-6',
                p.popular ? 'border-2 border-navy shadow-lg' : 'border border-line'
              )}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-3 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-ink">{p.name}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{p.tagline}</p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-mono text-[32px] font-extrabold leading-none text-ink">
                  ₹{price.toLocaleString('en-IN')}
                </span>
                <span className="text-[13px] text-muted">{annual ? '/ year' : '/ month'}</span>
              </div>
              <div className="mt-1.5 text-[12px] text-muted">
                {annual ? 'billed annually · save 17%' : 'billed monthly · per 30 days'}
              </div>

              <Link href={`/account/subscribe?plan=${p.code}`} className="mt-5 block">
                <Button variant={p.popular ? 'dark' : 'secondary'} className="w-full">
                  Choose {p.name}
                </Button>
              </Link>

              <div className="mt-6 border-t border-line pt-4">
                <Overline>{p.featuresHeading}</Overline>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-[13px] text-ink">
                      <span className="flex-none font-bold text-risk-low">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
