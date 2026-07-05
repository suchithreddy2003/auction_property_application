import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/rbac';
import { Button } from './ui';
import { logoutAction } from '@/app/(auth)/actions';

export async function SiteHeader() {
  const session = await getSession();
  const admin = session && isAdminRole(session.role);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-brand-700">
          Hanshitha Auctions
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 md:flex">
          <Link href="/listings" className="hover:text-brand-600">Browse</Link>
          <Link href="/calendar" className="hover:text-brand-600">Calendar</Link>
          <Link href="/services" className="hover:text-brand-600">Services</Link>
          <Link href="/plans" className="hover:text-brand-600">Plans</Link>
          <Link href="/about" className="hover:text-brand-600">About</Link>
        </nav>
        <div className="flex items-center gap-2">
          {admin && (
            <Link href="/admin" className="text-sm font-medium text-brand-700 hover:underline">
              Admin
            </Link>
          )}
          {session ? (
            <>
              <Link href="/account" className="text-sm text-gray-700 hover:text-brand-700">
                {session.email}
              </Link>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm">Logout</Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary" size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
