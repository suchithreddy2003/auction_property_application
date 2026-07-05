import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import type { Role } from '@/types/enums';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'dev-only-secret-change-me'
);
const SESSION_COOKIE = 'auction_session';
const SESSION_TTL_DAYS = 7;
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'production' ? 12 : 10;

export type Session = {
  uid: string;
  email: string;
  role: Role;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: Session) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(SECRET);

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.uid === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.role === 'string'
    ) {
      return { uid: payload.uid, email: payload.email, role: payload.role as Role };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getUserFromSession() {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({ where: { id: s.uid } });
}

export async function login(email: string, password: string): Promise<Session | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  const session: Session = { uid: user.id, email: user.email, role: user.role as Role };
  await createSession(session);
  return session;
}

// Validate post-login `next` redirect target — only allow same-origin relative paths.
// Prevents open-redirect attacks (?next=https://evil.example).
export function safeRedirect(next: string | undefined | null, fallback = '/'): string {
  if (!next) return fallback;
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//')) return fallback;
  if (next.includes('\\')) return fallback;
  try {
    const u = new URL(next, 'http://localhost');
    if (u.origin !== 'http://localhost') return fallback;
  } catch {
    return fallback;
  }
  return next;
}

// Password policy used by signup and password-reset flows.
export function validatePasswordStrength(pwd: string): string | null {
  if (pwd.length < 8) return 'Password must be at least 8 characters.';
  if (pwd.length > 128) return 'Password must be 128 characters or fewer.';
  let classes = 0;
  if (/[a-z]/.test(pwd)) classes++;
  if (/[A-Z]/.test(pwd)) classes++;
  if (/[0-9]/.test(pwd)) classes++;
  if (/[^a-zA-Z0-9]/.test(pwd)) classes++;
  if (classes < 3) return 'Use a mix of upper, lower, numbers and symbols (3 of 4).';
  return null;
}
