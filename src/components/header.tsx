import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/rbac';
import { Button } from './ui';
import { MainNav } from './main-nav';
import { logoutAction } from '@/app/(auth)/actions';

export async function SiteHeader() {
  const session = await getSession();
  const admin = session && isAdminRole(session.role);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-5 px-[22px]">
        <Link href="/" className="flex items-center gap-[9px]">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[linear-gradient(150deg,#12507e,#0f3350)] text-[15px] font-extrabold text-white">
            H
          </span>
          <span className="text-lg font-extrabold tracking-[-0.01em] text-ink">Hanshitha Auctions</span>
        </Link>

        <MainNav />

        <div className="ml-auto flex items-center gap-[10px]">
          {admin && (
            <Link href="/admin" className="text-sm font-semibold text-navy hover:underline">
              Admin
            </Link>
          )}
          {session ? (
            <>
              <Link href="/account" className="hidden text-sm text-ink hover:text-trust sm:inline">
                {session.email}
              </Link>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm">Logout</Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-ink transition-colors hover:text-trust"
              >
                Log in
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
