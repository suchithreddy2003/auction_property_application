import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'dev-only-secret-change-me'
);

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'MANAGER', 'EXECUTIVE']);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('auction_session')?.value;
    if (!token) return NextResponse.redirect(new URL('/login?next=' + pathname, req.url));
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const role = String(payload.role || '');
      if (!ADMIN_ROLES.has(role)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login?next=' + pathname, req.url));
    }
  }

  if (pathname.startsWith('/account')) {
    const token = req.cookies.get('auction_session')?.value;
    if (!token) return NextResponse.redirect(new URL('/login?next=' + pathname, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
