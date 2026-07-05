'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Label, Select } from '@/components/ui';
import { DocTypes, DocVisibilities } from '@/types/enums';

export function DocumentUploader({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set('listingId', listingId);
    setBusy(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed (${res.status})`);
      }
      setOk(true);
      form.reset();
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 text-lg font-semibold">Upload document</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor="docType">Type</Label>
          <Select id="docType" name="docType" defaultValue="SALE_NOTICE">
            {DocTypes.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="visibility">Visibility</Label>
          <Select id="visibility" name="visibility" defaultValue="SUBSCRIBED">
            {DocVisibilities.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="file">File (PDF, image, ≤10 MB)</Label>
          <input
            id="file"
            type="file"
            name="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            required
            className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
          />
        </div>
        <div className="md:col-span-3 flex items-center gap-3">
          <Button type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Upload'}</Button>
          {ok && <span className="text-sm text-green-700">Uploaded.</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </Card>
  );
}
