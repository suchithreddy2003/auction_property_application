import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Card, Badge, Button } from '@/components/ui';
import { resolveDedupeAction } from './actions';

export default async function DedupePage() {
  const flags = await prisma.dedupeFlag.findMany({
    where: { resolved: false },
    orderBy: { similarity: 'desc' },
    take: 50,
    include: {
      listingA: { select: { id: true, title: true, lenderName: true, city: true, reservePrice: true, createdAt: true } },
      listingB: { select: { id: true, title: true, lenderName: true, city: true, reservePrice: true, createdAt: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dedupe flags</h1>
      <p className="text-sm text-gray-600">
        Candidate duplicates surfaced by the rules engine. Resolve as duplicate, re-auction, or no-match.
      </p>

      {flags.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">No open dedupe flags.</Card>
      ) : (
        <div className="space-y-4">
          {flags.map((f) => (
            <Card key={f.id} className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">
                  Similarity {(f.similarity * 100).toFixed(0)}%
                  {f.reason && <span className="ml-2 text-xs text-gray-500">({f.reason})</span>}
                </div>
                <Badge tone="warning">Open</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ListingSide title="Listing A" l={f.listingA} />
                <ListingSide title="Listing B" l={f.listingB} />
              </div>
              <form action={resolveDedupeAction} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="flagId" value={f.id} />
                <Button name="resolution" value="duplicate" variant="danger" size="sm">Mark duplicate</Button>
                <Button name="resolution" value="re_auction" variant="secondary" size="sm">Link as re-auction</Button>
                <Button name="resolution" value="not_a_match" variant="ghost" size="sm">Not a match</Button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ListingSide({ title, l }: { title: string; l: any }) {
  return (
    <div className="rounded-md bg-gray-50 p-3 text-sm">
      <div className="text-xs uppercase text-gray-500">{title}</div>
      <Link href={`/admin/listings/${l.id}`} className="font-medium text-brand-700 hover:underline">
        {l.title}
      </Link>
      <div className="text-xs text-gray-600">
        {l.lenderName} · {l.city} · Reserve ₹{l.reservePrice.toLocaleString('en-IN')}
      </div>
      <div className="text-xs text-gray-500">Created {l.createdAt.toLocaleDateString('en-IN')}</div>
    </div>
  );
}
