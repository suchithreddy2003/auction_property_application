import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { hasActiveSubscription } from '@/lib/subscription';
import { projectListing, viewerTier, canSeeDocument } from '@/lib/gating';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { events: true, documents: true },
  });
  if (!listing || !listing.published) {
    return new NextResponse('Not found', { status: 404 });
  }

  const session = await getSession();
  const subscribed = session ? await hasActiveSubscription(session.uid) : false;
  const tier = await viewerTier(session, subscribed);

  return NextResponse.json({
    listing: projectListing(listing, tier),
    events: listing.events.map((e) => ({
      id: e.id,
      auctionDateTime: e.auctionDateTime,
      inspectionStart: e.inspectionStart,
      inspectionEnd: e.inspectionEnd,
      emdLastDate: e.emdLastDate,
      venueOrPlatform: e.venueOrPlatform,
      // Contact only when tier permits
      contactPhone: tier === 'SUBSCRIBED' ? e.contactPhone : null,
      contactEmail: tier === 'SUBSCRIBED' ? e.contactEmail : null,
    })),
    documents: listing.documents
      .filter((d) => canSeeDocument(d.visibility, tier))
      .map((d) => ({
        id: d.id,
        docType: d.docType,
        fileName: d.fileName,
        visibility: d.visibility,
        sizeBytes: d.sizeBytes,
      })),
  });
}
