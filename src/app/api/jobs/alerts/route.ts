import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { siteUrl } from '@/lib/env';

// Cron-triggered: scan saved searches, match against newly-published listings,
// write Alert rows, and send emails. Idempotent within a search by lastRunAt.

async function handle(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const searches = await prisma.savedSearch.findMany({
    where: { active: true },
    include: { user: { select: { id: true, email: true, name: true, marketingOptIn: true } } },
  });
  let created = 0;
  let sent = 0;
  let failed = 0;

  for (const s of searches) {
    const since = s.lastRunAt ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const filter = safeParse(s.filterJson) ?? {};
    const where: any = {
      published: true,
      publishedAt: { gt: since },
    };
    if (filter.state) where.state = filter.state;
    if (filter.city) where.city = { contains: filter.city };
    if (filter.propertyType) where.propertyType = filter.propertyType;
    if (filter.minPrice || filter.maxPrice) {
      where.reservePrice = {};
      if (filter.minPrice) where.reservePrice.gte = Number(filter.minPrice);
      if (filter.maxPrice) where.reservePrice.lte = Number(filter.maxPrice);
    }

    const matches = await prisma.listing.findMany({
      where,
      take: 10,
      select: { id: true, title: true, city: true, state: true, reservePrice: true },
    });

    if (matches.length === 0) {
      await prisma.savedSearch.update({ where: { id: s.id }, data: { lastRunAt: now } });
      continue;
    }

    const summaryLines = matches.map((m) => {
      const href = `${siteUrl()}/listings/${m.id}`;
      return `• ${m.title} — ${m.city}, ${m.state} — ₹${m.reservePrice.toLocaleString('en-IN')}\n  ${href}`;
    });

    const alertRow = await prisma.alert.create({
      data: {
        userId: s.userId,
        savedSearchId: s.id,
        channel: 'EMAIL',
        status: 'PENDING',
        payload: JSON.stringify({ count: matches.length, ids: matches.map((m) => m.id) }),
      },
    });
    created++;

    const subject = `${matches.length} new ${matches.length === 1 ? 'listing' : 'listings'} for "${s.name}"`;
    const text =
      `Hi ${s.user.name || s.user.email},\n\n` +
      `Your saved search "${s.name}" has new matches:\n\n` +
      summaryLines.join('\n\n') +
      `\n\n— Hanshitha Auctions\n` +
      `Manage your alerts: ${siteUrl()}/account`;

    const res = await sendEmail({ to: s.user.email, subject, text });
    if (res.ok) {
      sent++;
      await prisma.alert.update({
        where: { id: alertRow.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } else {
      failed++;
      await prisma.alert.update({
        where: { id: alertRow.id },
        data: { status: 'FAILED', error: res.error?.slice(0, 500) },
      });
    }

    await prisma.savedSearch.update({ where: { id: s.id }, data: { lastRunAt: now } });
  }

  return NextResponse.json({ ok: true, created, sent, failed });
}

export const GET = handle;
export const POST = handle;

function safeParse(s: string) { try { return JSON.parse(s); } catch { return null; } }
