'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/db';
import {
  createSession,
  destroySession,
  hashPassword,
  login,
  safeRedirect,
  validatePasswordStrength,
  getSession,
  verifyPassword,
} from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';
import { siteUrl } from '@/lib/env';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  next: z.string().optional(),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120).optional(),
  phone: z.string().optional(),
});

function ipFromHeaders(): string {
  const h = headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}

export async function loginAction(prevState: unknown, formData: FormData) {
  const ip = ipFromHeaders();
  const limit = rateLimit(`login:${ip}`, { max: 10, windowSeconds: 300 });
  if (!limit.allowed) {
    return { error: `Too many attempts. Try again in ${limit.resetIn}s.` };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  });
  if (!parsed.success) {
    return { error: 'Please enter a valid email and password (min 6 chars).' };
  }
  const session = await login(parsed.data.email, parsed.data.password);
  if (!session) {
    return { error: 'Invalid credentials.' };
  }
  await logAudit({
    actorId: session.uid,
    action: 'auth.login',
    target: `user:${session.uid}`,
    ip,
  });
  redirect(safeRedirect(parsed.data.next));
}

export async function signupAction(prevState: unknown, formData: FormData) {
  const ip = ipFromHeaders();
  const limit = rateLimit(`signup:${ip}`, { max: 5, windowSeconds: 600 });
  if (!limit.allowed) {
    return { error: `Too many signups from this network. Try again in ${limit.resetIn}s.` };
  }

  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name') || undefined,
    phone: formData.get('phone') || undefined,
  });
  if (!parsed.success) {
    return { error: 'Email + password (min 8 chars) required.' };
  }
  const pwdErr = validatePasswordStrength(parsed.data.password);
  if (pwdErr) return { error: pwdErr };

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'An account with this email already exists.' };

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name ?? null,
      phone: parsed.data.phone ?? null,
      passwordHash: await hashPassword(parsed.data.password),
      role: 'BUYER',
    },
  });
  await createSession({ uid: user.id, email: user.email, role: 'BUYER' });
  await logAudit({
    actorId: user.id,
    action: 'auth.signup',
    target: `user:${user.id}`,
    ip,
  });
  redirect('/');
}

export async function logoutAction() {
  await destroySession();
  redirect('/');
}

// Forgot password — always returns success to avoid email enumeration.
export async function forgotPasswordAction(prevState: unknown, formData: FormData) {
  const ip = ipFromHeaders();
  const limit = rateLimit(`forgot:${ip}`, { max: 5, windowSeconds: 900 });
  if (!limit.allowed) {
    return { ok: true };
  }

  const email = String(formData.get('email') || '').toLowerCase().trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: true };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const raw = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt },
    });

    const link = `${siteUrl()}/reset?token=${raw}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your Hanshitha Auctions password',
      text:
        `We received a request to reset your password.\n\n` +
        `Reset link (valid 1 hour): ${link}\n\n` +
        `If you didn't request this, you can safely ignore this email.`,
    });
    await logAudit({
      actorId: user.id,
      action: 'auth.password.forgot',
      target: `user:${user.id}`,
      ip,
    });
  }
  return { ok: true };
}

export async function resetPasswordAction(prevState: unknown, formData: FormData) {
  const ip = ipFromHeaders();
  const limit = rateLimit(`reset:${ip}`, { max: 10, windowSeconds: 600 });
  if (!limit.allowed) {
    return { error: `Too many attempts. Try again in ${limit.resetIn}s.` };
  }

  const token = String(formData.get('token') || '');
  const pwd = String(formData.get('password') || '');
  if (!token || !pwd) return { error: 'Token and password required.' };
  const pwdErr = validatePasswordStrength(pwd);
  if (pwdErr) return { error: pwdErr };

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const rec = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!rec || rec.usedAt || rec.expiresAt <= new Date()) {
    return { error: 'This reset link is invalid or has expired.' };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: rec.userId },
      data: { passwordHash: await hashPassword(pwd) },
    }),
    prisma.passwordResetToken.update({
      where: { id: rec.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await logAudit({
    actorId: rec.userId,
    action: 'auth.password.reset',
    target: `user:${rec.userId}`,
    ip,
  });

  redirect('/login?reset=1');
}

export async function changePasswordAction(prevState: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const current = String(formData.get('current') || '');
  const next = String(formData.get('next') || '');
  if (!current || !next) return { error: 'Both current and new passwords required.' };
  const pwdErr = validatePasswordStrength(next);
  if (pwdErr) return { error: pwdErr };

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) return { error: 'Account not found.' };
  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) return { error: 'Current password is incorrect.' };

  await prisma.user.update({
    where: { id: session.uid },
    data: { passwordHash: await hashPassword(next) },
  });
  await logAudit({
    actorId: session.uid,
    action: 'auth.password.change',
    target: `user:${session.uid}`,
    ip: ipFromHeaders(),
  });
  return { ok: true };
}

export async function updateProfileAction(prevState: unknown, formData: FormData) {
  const session = await getSession();
  if (!session) redirect('/login');

  const name = String(formData.get('name') || '').trim().slice(0, 120);
  const phone = String(formData.get('phone') || '').trim().slice(0, 30);
  const marketingOptIn = !!formData.get('marketingOptIn');

  await prisma.user.update({
    where: { id: session.uid },
    data: {
      name: name || null,
      phone: phone || null,
      marketingOptIn,
    },
  });
  await logAudit({
    actorId: session.uid,
    action: 'user.profile.update',
    target: `user:${session.uid}`,
    ip: ipFromHeaders(),
    after: { name, phone, marketingOptIn },
  });
  return { ok: true };
}
