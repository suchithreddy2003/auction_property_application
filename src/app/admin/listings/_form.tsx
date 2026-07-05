'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Card, Input, Label, Select, Textarea, Button } from '@/components/ui';
import {
  PropertyTypes,
  PossessionTypes,
  AuctionTypes,
  ListingStatuses,
} from '@/types/enums';

type FormAction = (state: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string } | undefined>;

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>;
}

export function ListingForm({ action, defaults }: { action: FormAction; defaults?: any }) {
  const [state, dispatch] = useFormState(action, undefined);
  const d = defaults ?? {};
  return (
    <form action={dispatch} className="space-y-6">
      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Basics</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={d.title ?? ''} required />
          </div>
          <div>
            <Label htmlFor="propertyType">Property type</Label>
            <Select id="propertyType" name="propertyType" defaultValue={d.propertyType ?? 'RESIDENTIAL'}>
              {PropertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="auctionType">Auction type</Label>
            <Select id="auctionType" name="auctionType" defaultValue={d.auctionType ?? 'E_AUCTION'}>
              {AuctionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="possession">Possession</Label>
            <Select id="possession" name="possession" defaultValue={d.possession ?? 'UNKNOWN'}>
              {PossessionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={d.status ?? 'UPCOMING'}>
              {ListingStatuses.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Lender</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="lenderName">Lender / bank</Label>
            <Input id="lenderName" name="lenderName" defaultValue={d.lenderName ?? ''} required />
          </div>
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input id="branch" name="branch" defaultValue={d.branch ?? ''} />
          </div>
          <div>
            <Label htmlFor="authorizedOfficer">Authorized officer</Label>
            <Input id="authorizedOfficer" name="authorizedOfficer" defaultValue={d.authorizedOfficer ?? ''} />
          </div>
          <div>
            <Label htmlFor="borrowerName">Borrower / guarantor</Label>
            <Input id="borrowerName" name="borrowerName" defaultValue={d.borrowerName ?? ''} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Address</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="addressLine">Address line</Label>
            <Input id="addressLine" name="addressLine" defaultValue={d.addressLine ?? ''} />
          </div>
          <div>
            <Label htmlFor="locality">Locality</Label>
            <Input id="locality" name="locality" defaultValue={d.locality ?? ''} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={d.city ?? ''} required />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" defaultValue={d.state ?? ''} required />
          </div>
          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" name="pincode" defaultValue={d.pincode ?? ''} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Commercials</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="reservePrice">Reserve price (₹)</Label>
            <Input id="reservePrice" name="reservePrice" type="number" min="0" defaultValue={d.reservePrice ?? ''} required />
          </div>
          <div>
            <Label htmlFor="emd">EMD (₹)</Label>
            <Input id="emd" name="emd" type="number" min="0" defaultValue={d.emd ?? ''} />
          </div>
          <div>
            <Label htmlFor="bidIncrement">Bid increment (₹)</Label>
            <Input id="bidIncrement" name="bidIncrement" type="number" min="0" defaultValue={d.bidIncrement ?? ''} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Auction event</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="auctionDateTime">Auction date/time</Label>
            <Input id="auctionDateTime" name="auctionDateTime" type="datetime-local" defaultValue={d.auctionDateTime ?? ''} />
          </div>
          <div>
            <Label htmlFor="emdLastDate">EMD last date</Label>
            <Input id="emdLastDate" name="emdLastDate" type="date" defaultValue={d.emdLastDate ?? ''} />
          </div>
          <div>
            <Label htmlFor="inspectionStart">Inspection start</Label>
            <Input id="inspectionStart" name="inspectionStart" type="datetime-local" defaultValue={d.inspectionStart ?? ''} />
          </div>
          <div>
            <Label htmlFor="inspectionEnd">Inspection end</Label>
            <Input id="inspectionEnd" name="inspectionEnd" type="datetime-local" defaultValue={d.inspectionEnd ?? ''} />
          </div>
          <div>
            <Label htmlFor="venueOrPlatform">Venue / platform</Label>
            <Input id="venueOrPlatform" name="venueOrPlatform" defaultValue={d.venueOrPlatform ?? ''} />
          </div>
          <div>
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" name="contactPhone" defaultValue={d.contactPhone ?? ''} />
          </div>
          <div>
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" name="contactEmail" defaultValue={d.contactEmail ?? ''} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Risk inputs</h2>
        <p className="mb-3 text-xs text-gray-500">
          These power the risk score (recomputed on save).
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="documentCompleteness">Document completeness (0–1)</Label>
            <Input id="documentCompleteness" name="documentCompleteness" type="number" min="0" max="1" step="0.05" defaultValue={d.documentCompleteness ?? '0.5'} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="hasEncumbrance" name="hasEncumbrance" type="checkbox" defaultChecked={d.hasEncumbrance ?? false} className="h-4 w-4" />
            <Label htmlFor="hasEncumbrance" className="mb-0">Encumbrance noted</Label>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id="hasLitigation" name="hasLitigation" type="checkbox" defaultChecked={d.hasLitigation ?? false} className="h-4 w-4" />
            <Label htmlFor="hasLitigation" className="mb-0">Litigation noted</Label>
          </div>
          <div>
            <Label htmlFor="reauctionCount">Re-auction count</Label>
            <Input id="reauctionCount" name="reauctionCount" type="number" min="0" defaultValue={d.reauctionCount ?? 0} />
          </div>
          <div>
            <Label htmlFor="sourceTrustTier">Source trust tier</Label>
            <Select id="sourceTrustTier" name="sourceTrustTier" defaultValue={d.sourceTrustTier ?? 'B'}>
              <option value="A">A — Official platform</option>
              <option value="B">B — Bank / engine</option>
              <option value="C">C — Newspaper / aggregator</option>
              <option value="D">D — Unverified</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Flags</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isPremium" defaultChecked={d.isPremium ?? false} className="h-4 w-4" />
            Premium listing
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="loanAvailable" defaultChecked={d.loanAvailable ?? false} className="h-4 w-4" />
            Loan available
          </label>
        </div>
      </Card>

      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Submit />
      </div>
    </form>
  );
}
