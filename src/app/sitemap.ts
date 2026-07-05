import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { siteUrl } from '@/lib/env';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const listings = await prisma.listing.findMany({
    where: { published: true },
    select: { id: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
    take: 2000,
  });

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/listings`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/plans`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/services`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/calendar`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const listingEntries: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${base}/listings/${l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticEntries, ...listingEntries];
}
