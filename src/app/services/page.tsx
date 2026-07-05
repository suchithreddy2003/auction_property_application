import { Card, Button } from '@/components/ui';
import Link from 'next/link';

const services = [
  { code: 'LEGAL_REVIEW', name: 'Legal review', desc: 'Encumbrance, title, lender process — by partner advocate.' },
  { code: 'VALUATION',    name: 'Valuation', desc: 'Independent market estimate with comparables.' },
  { code: 'INSPECTION',   name: 'Inspection', desc: 'Coordinated physical visit + photo report.' },
  { code: 'BID_ASSIST',   name: 'Bid-day assistance', desc: 'EMD logistics, document prep, auction-day support.' },
];

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Assisted services</h1>
      <p className="text-gray-600">
        From due diligence to bid-day support. Quoted per request; partner-fulfilled.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {services.map((s) => (
          <Card key={s.code} className="p-5">
            <h3 className="text-lg font-semibold">{s.name}</h3>
            <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
            <Link href={`/account/services/new?type=${s.code}`} className="mt-3 inline-block">
              <Button variant="secondary" size="sm">Request</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
