'use client';

import { useState } from 'react';

export function DocumentDownloadLink({ documentId, label }: { documentId: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/url`);
      if (!res.ok) throw new Error(res.status === 403 ? 'Subscribe to view this document.' : `Error ${res.status}`);
      const { url } = (await res.json()) as { url: string };
      window.open(url, '_blank', 'noopener');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="rounded-md bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
      >
        {busy ? 'Opening…' : label ?? 'Open'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
