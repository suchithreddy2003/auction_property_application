'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-3 text-sm text-gray-600">
        An unexpected error occurred. Our team has been notified.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-gray-400">Ref: {error.digest}</p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" onClick={() => (window.location.href = '/')}>Go home</Button>
      </div>
    </div>
  );
}
