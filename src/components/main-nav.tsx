'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const items: [string, string][] = [
  ['Home', '/'],
  ['Browse listings', '/listings'],
  ['Auction calendar', '/calendar'],
  ['Services', '/services'],
  ['About', '/about'],
  ['Plans', '/plans'],
];

export function MainNav() {
  const path = usePathname();
  return (
    <nav className="ml-3 hidden items-center gap-[22px] text-sm font-medium text-[#3c4a56] md:flex">
      {items.map(([label, href]) => {
        const active = href === '/' ? path === '/' : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn('transition-colors', active ? 'font-semibold text-ink' : 'hover:text-trust')}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
