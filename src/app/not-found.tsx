import Link from 'next/link';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-5xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-gray-600">
        We couldn't find that page. It may have been removed or the link is wrong.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/"><Button>Go home</Button></Link>
        <Link href="/listings"><Button variant="secondary">Browse listings</Button></Link>
      </div>
    </div>
  );
}
