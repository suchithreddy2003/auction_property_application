import './globals.css';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/header';

export const metadata: Metadata = {
  title: 'Hanshitha Auctions — auction properties, decoded',
  description:
    'Aggregated auction property listings with risk insights, document summaries, and assisted services.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">{children}</main>
        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-gray-500">
            © Hanshitha Management Services. Information platform; not legal or
            investment advice. Subject to lender/tribunal processes.
          </div>
        </footer>
      </body>
    </html>
  );
}
