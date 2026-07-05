import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/listings', '/listings/', '/plans', '/services', '/calendar', '/about'],
        disallow: ['/admin', '/account', '/api', '/login', '/signup', '/forgot', '/reset'],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
