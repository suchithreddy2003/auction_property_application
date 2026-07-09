import './globals.css';
import type { Metadata } from 'next';
import { Hanken_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import { SiteHeader } from '@/components/header';
import { SiteFooter } from '@/components/footer';

// Interface & headings.
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

// Figures & metadata — prices, EMD, dates, IDs.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hanshitha Auctions — auction properties, decoded',
  description:
    'Aggregated auction property listings with risk insights, document summaries, and assisted services.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hanken.variable} ${plexMono.variable}`}>
      <body>
        <SiteHeader />
        <main className="mx-auto min-h-screen max-w-7xl px-4 py-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
