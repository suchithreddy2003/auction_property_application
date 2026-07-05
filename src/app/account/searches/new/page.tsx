import { Card, Input, Label, Select, Button } from '@/components/ui';
import { saveSearchAction } from './actions';
import { PropertyTypes } from '@/types/enums';

export default function NewSavedSearchPage() {
  return (
    <div className="mx-auto max-w-md py-6">
      <Card className="p-6">
        <h1 className="mb-4 text-2xl font-semibold">New saved search</h1>
        <form action={saveSearchAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Search name</Label>
            <Input id="name" name="name" placeholder="2BHK in Pune under 50L" required />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" />
          </div>
          <div>
            <Label htmlFor="propertyType">Property type</Label>
            <Select id="propertyType" name="propertyType">
              <option value="">Any</option>
              {PropertyTypes.map((t) => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="minPrice">Min ₹</Label>
              <Input id="minPrice" name="minPrice" inputMode="numeric" />
            </div>
            <div>
              <Label htmlFor="maxPrice">Max ₹</Label>
              <Input id="maxPrice" name="maxPrice" inputMode="numeric" />
            </div>
          </div>
          <div>
            <Label htmlFor="frequency">Alert frequency</Label>
            <Select id="frequency" name="frequency" defaultValue="DAILY">
              <option value="INSTANT">Instant</option>
              <option value="DAILY">Daily digest</option>
              <option value="WEEKLY">Weekly digest</option>
            </Select>
          </div>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Card>
    </div>
  );
}
