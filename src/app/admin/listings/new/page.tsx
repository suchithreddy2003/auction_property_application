import { ListingForm } from '../_form';
import { createListingAction } from '../actions';

export default function NewListingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">New listing</h1>
      <ListingForm action={createListingAction} />
    </div>
  );
}
