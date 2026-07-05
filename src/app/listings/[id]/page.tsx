import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasActiveSubscription } from '@/lib/subscription';
import { projectListing, viewerTier, canSeeDocument } from '@/lib/gating';
import { Card, Badge, Button } from '@/components/ui';
import { DocumentDownloadLink } from '@/components/document-download-link';

function riskTone(label?: string | null): 'success' | 'warning' | 'danger' | 'default' {
  if (label === 'LOW') return 'success';
  if (label === 'MEDIUM') return 'warning';
  if (label === 'HIGH') return 'danger';
  return 'default';
}

export default async function ListingDetail({ params }: { params: { id: string } }) {
  const session = await getSession();
  const subscribed = session ? await hasActiveSubscription(session.uid) : false;
  const tier = await viewerTier(session, subscribed);

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { events: { orderBy: { auctionDateTime: 'asc' } }, documents: true },
  });
  if (!listing || !listing.published) notFound();

  // Async fire-and-forget analytics
  if (session) {
    prisma.listingView.create({
      data: { listingId: listing.id, userId: session.uid },
    }).catch(() => {});
  }

  const projected = projectListing(listing, tier);
  const factors = projected.riskFactors ? safeParse(projected.riskFactors) : null;

  return (
    <article className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <header>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge>{listing.propertyType.replace('_', ' ')}</Badge>
            <Badge tone="default">{listing.status.replace('_', ' ')}</Badge>
            {listing.isPremium && <Badge tone="info">Premium</Badge>}
            {projected.riskLabel && (
              <Badge tone={riskTone(projected.riskLabel)}>{projected.riskLabel} risk</Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          <p className="mt-1 text-gray-600">{projected.addressDisplay}</p>
        </header>

        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold">Auction summary</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Row label="Reserve price" value={projected.priceDisplay} />
            <Row
              label="EMD"
              value={projected.emd != null ? '₹' + projected.emd.toLocaleString('en-IN') : (tier === 'ANON' ? 'Login to view' : '—')}
            />
            <Row label="Bid increment" value={projected.bidIncrement != null ? '₹' + projected.bidIncrement.toLocaleString('en-IN') : '—'} />
            <Row label="Auction type" value={(projected.auctionType ?? '—').toString().replace('_', ' ')} />
            <Row label="Possession" value={(projected.possession ?? '—').toString()} />
            <Row label="Lender" value={projected.lenderName ?? (tier === 'ANON' ? 'Login to view' : '—')} />
          </dl>
        </Card>

        {listing.events.length > 0 && (
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-semibold">Schedule</h2>
            <ul className="divide-y divide-gray-100">
              {listing.events.map((ev) => (
                <li key={ev.id} className="grid grid-cols-1 gap-2 py-3 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase text-gray-500">Auction</div>
                    <div className="font-medium">{ev.auctionDateTime.toLocaleString('en-IN')}</div>
                  </div>
                  {ev.emdLastDate && (
                    <div>
                      <div className="text-xs uppercase text-gray-500">EMD last date</div>
                      <div>{ev.emdLastDate.toLocaleDateString('en-IN')}</div>
                    </div>
                  )}
                  {ev.inspectionStart && (
                    <div className="md:col-span-2">
                      <div className="text-xs uppercase text-gray-500">Inspection window</div>
                      <div>
                        {ev.inspectionStart.toLocaleString('en-IN')}
                        {ev.inspectionEnd && ` → ${ev.inspectionEnd.toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  )}
                  {projected.contactRevealed && (ev.contactPhone || ev.contactEmail) && (
                    <div className="md:col-span-2">
                      <div className="text-xs uppercase text-gray-500">Contact</div>
                      <div>{[ev.contactPhone, ev.contactEmail].filter(Boolean).join(' · ')}</div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Risk insights</h2>
            {!projected.detailedRiskAvailable && tier !== 'SUBSCRIBED' && (
              <Link href="/plans" className="text-sm text-brand-700 hover:underline">
                Unlock breakdown →
              </Link>
            )}
          </div>
          {projected.riskScore != null ? (
            <>
              <div className="mb-3 flex items-end gap-3">
                <div className="text-4xl font-bold">{projected.riskScore}</div>
                <Badge tone={riskTone(projected.riskLabel)}>{projected.riskLabel}</Badge>
              </div>
              {factors && Array.isArray(factors) ? (
                <ul className="space-y-2 text-sm">
                  {factors.slice(0, projected.detailedRiskAvailable ? 6 : 2).map((f: any) => (
                    <li key={f.key} className="flex items-start justify-between gap-3">
                      <span className="text-gray-700">{f.reason}</span>
                      <span className="font-mono text-xs text-gray-500">
                        +{Math.round(f.contribution)} pts
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">High-level risk shown. Subscribe for the breakdown.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600">Risk score not yet computed.</p>
          )}
          <p className="mt-4 text-xs italic text-gray-500">
            Not legal advice. Always verify the original notice with the lender.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-lg font-semibold">Documents ({listing.documents.length})</h2>
          {listing.documents.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {listing.documents.map((d) => {
                const visible = canSeeDocument(d.visibility, tier);
                return (
                  <li key={d.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                    <div>
                      <div className="font-medium">{d.docType.replace('_', ' ')}</div>
                      <div className="text-xs text-gray-500">{d.fileName}</div>
                    </div>
                    {visible ? (
                      <DocumentDownloadLink documentId={d.id} label="View / download" />
                    ) : (
                      <Link href="/plans" className="text-xs text-brand-700 hover:underline">
                        Subscribe to view
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="p-5">
          <h3 className="mb-2 font-semibold">Talk to our agent</h3>
          <p className="mb-3 text-sm text-gray-600">
            Get legal review, valuation, inspection or bid-day support.
          </p>
          {session ? (
            <Link href="/services">
              <Button className="w-full">Request service</Button>
            </Link>
          ) : (
            <Link href={`/login?next=/listings/${listing.id}`}>
              <Button className="w-full">Login to request</Button>
            </Link>
          )}
        </Card>

        {tier !== 'SUBSCRIBED' && (
          <Card className="p-5">
            <h3 className="mb-2 font-semibold">Want full access?</h3>
            <p className="mb-3 text-sm text-gray-600">
              See exact address, bank contact, all documents, and the full risk breakdown.
            </p>
            <Link href="/plans">
              <Button className="w-full">View plans</Button>
            </Link>
          </Card>
        )}
      </aside>
    </article>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}
