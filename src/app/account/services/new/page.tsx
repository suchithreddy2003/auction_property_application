import { Card, Input, Label, Select, Textarea, Button } from '@/components/ui';
import { createServiceOrderAction } from './actions';

const TYPES = [
  ['LEGAL_REVIEW', 'Legal review'],
  ['VALUATION',    'Valuation'],
  ['INSPECTION',   'Inspection'],
  ['BID_ASSIST',   'Bid-day assistance'],
  ['OTHER',        'Other'],
] as const;

export default function NewServiceOrderPage({ searchParams }: { searchParams: { type?: string; listingId?: string } }) {
  return (
    <div className="mx-auto max-w-md py-6">
      <Card className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">Request a service</h1>
        <form action={createServiceOrderAction} className="space-y-4">
          {searchParams.listingId && (
            <input type="hidden" name="listingId" value={searchParams.listingId} />
          )}
          <div>
            <Label htmlFor="serviceType">Service</Label>
            <Select id="serviceType" name="serviceType" defaultValue={searchParams.type ?? 'LEGAL_REVIEW'}>
              {TYPES.map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="preferredTime">Preferred time</Label>
            <Input id="preferredTime" name="preferredTime" type="datetime-local" />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Tell us about the property or what you need." />
          </div>
          <Button type="submit" className="w-full">Submit request</Button>
        </form>
      </Card>
    </div>
  );
}
