import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ListingForm } from '../_form';
import { submitForReviewAction, deleteDocumentAction } from '../actions';
import { Card, Button, Badge } from '@/components/ui';
import { DocumentUploader } from './documents';

function toLocalInput(d: Date | null | undefined) {
  if (!d) return '';
  // datetime-local needs "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(d: Date | null | undefined) {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      events: { orderBy: { auctionDateTime: 'asc' }, take: 1 },
      workflowTask: true,
      documents: { orderBy: { uploadedAt: 'desc' } },
    },
  });
  if (!listing) notFound();
  const ev = listing.events[0];

  const update = async (prev: unknown, fd: FormData) => {
    'use server';
    const { updateListingAction } = await import('../actions');
    fd.append('id', listing.id);
    return updateListingAction(prev, fd);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/admin/listings" className="text-sm text-brand-700 hover:underline">← Listings</Link>
        <div className="flex items-center gap-2">
          {listing.published ? <Badge tone="success">Published</Badge> : <Badge tone="warning">Draft</Badge>}
          {listing.workflowTask && (
            <Link href={`/admin/workflows/${listing.workflowTask.id}`}>
              <Button variant="secondary" size="sm">View workflow</Button>
            </Link>
          )}
          {!listing.published && listing.workflowTask?.state !== 'SUBMITTED_FOR_REVIEW' && (
            <form action={submitForReviewAction}>
              <input type="hidden" name="id" value={listing.id} />
              <Button size="sm">Submit for review</Button>
            </form>
          )}
        </div>
      </div>

      <h1 className="text-3xl font-bold">{listing.title}</h1>

      <Card className="p-3 text-xs text-gray-600">
        Risk: <span className="font-mono">{listing.riskScore ?? '—'}</span>
        {listing.riskLabel && <Badge className="ml-2" tone={listing.riskLabel === 'LOW' ? 'success' : listing.riskLabel === 'MEDIUM' ? 'warning' : 'danger'}>{listing.riskLabel}</Badge>}
      </Card>

      <ListingForm
        action={update}
        defaults={{
          ...listing,
          auctionDateTime: toLocalInput(ev?.auctionDateTime ?? null),
          inspectionStart: toLocalInput(ev?.inspectionStart ?? null),
          inspectionEnd: toLocalInput(ev?.inspectionEnd ?? null),
          emdLastDate: toDateInput(ev?.emdLastDate ?? null),
          venueOrPlatform: ev?.venueOrPlatform ?? '',
          contactPhone: ev?.contactPhone ?? '',
          contactEmail: ev?.contactEmail ?? '',
          hasEncumbrance: listing.hasEncumbrance,
          hasLitigation: listing.hasLitigation,
          reauctionCount: listing.reauctionCount,
          sourceTrustTier: listing.sourceTrustTier,
        }}
      />

      <DocumentUploader listingId={listing.id} />

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Documents ({listing.documents.length})</h2>
        {listing.documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {listing.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <div className="font-medium">{d.fileName}</div>
                  <div className="text-xs text-gray-500">
                    {d.docType.replace('_', ' ')} · {d.visibility} · {(d.sizeBytes / 1024).toFixed(0)} KB
                  </div>
                </div>
                <form action={deleteDocumentAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <Button type="submit" variant="ghost" size="sm">Delete</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
