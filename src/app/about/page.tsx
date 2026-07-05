import Link from 'next/link';
import { Card, Button } from '@/components/ui';

export const metadata = {
  title: 'About — Hanshitha Auctions',
  description: 'Aggregated auction notices with risk insights and assisted services.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <header>
        <h1 className="text-4xl font-bold">About Hanshitha Auctions</h1>
        <p className="mt-3 text-lg text-gray-600">
          We aggregate property auction notices from across India and turn raw,
          dense legal text into something a buyer can actually act on.
        </p>
      </header>

      <Card className="p-6">
        <h2 className="text-xl font-semibold">What we do</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>
            <strong>Aggregate:</strong> notices from official platforms (BAANKNET),
            bank websites, auction engines and newspapers — verified against the source.
          </li>
          <li>
            <strong>Decode:</strong> risk-score each listing using rules our analysts
            built (possession status, document completeness, encumbrance / litigation
            mentions, re-auction history, source trust tier).
          </li>
          <li>
            <strong>Serve:</strong> filtered, searchable, gated by subscription tier.
            Free to browse; subscribe for exact addresses, bank contacts, full documents
            and the detailed risk breakdown.
          </li>
          <li>
            <strong>Assist:</strong> on-demand legal review, valuation, inspection
            and bid-day support from vetted partners.
          </li>
        </ul>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold">A note on accuracy</h2>
        <p className="mt-3 text-sm text-gray-700">
          We are an <em>information</em> platform — not a legal, valuation or investment
          adviser. Every listing carries a link to its source notice; always verify
          terms with the lender before transacting. Auction outcomes are subject to
          tribunal and lender processes outside our control.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold">Data, privacy, payments</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>We store the minimum personal data needed to run your account.</li>
          <li>Payments are processed by Razorpay; we never see card details.</li>
          <li>You can request export or deletion of your data anytime — write to us.</li>
        </ul>
      </Card>

      <div className="flex gap-3">
        <Link href="/listings"><Button>Browse listings</Button></Link>
        <Link href="/plans"><Button variant="secondary">See plans</Button></Link>
      </div>
    </div>
  );
}
