import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt — allow crawling of public storefront/marketing content while
 * keeping account, checkout, admin, and API surfaces out of the index.
 *
 * Note: trailing slashes scope a rule to a subtree. Bare prefixes are avoided
 * where they could collide with public pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/search',
          '/product/',
          '/blog',
          '/about',
          '/contact',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/super-admin',
          '/super-admin-sign-in',
          '/user/',
          '/chat',
          // Transactional / per-user funnel pages — no SEO value.
          '/cart',
          '/checkout',
          '/order/',
          '/place-order',
          '/payment-method',
          '/shipping-address',
          '/verify-payment-method',
          // Auth surfaces.
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/unauthorized',
          // Next internals.
          '/_next/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
