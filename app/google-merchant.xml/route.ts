import { prisma } from '@/db/prisma';
import { APP_NAME } from '@/lib/constants';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

// Regenerate at most once an hour. Google fetches this on its own schedule
// (usually daily), so hourly freshness is plenty.
export const revalidate = 3600;

// Escape the five XML-significant characters so product copy never breaks the feed.
function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Resolve a stored image (UploadThing absolute URL or local path) to an absolute URL.
function imageUrl(src: string): string {
  return /^https?:\/\//i.test(src) ? src : absoluteUrl(src);
}

// Compute the effective sale price (or null if there's no active sale).
function salePrice(p: {
  price: unknown;
  onSale: boolean;
  salePercent: unknown;
  saleUntil: Date | null;
  saleDiscountType: string;
}): number | null {
  if (!p.onSale) return null;
  if (p.saleUntil && p.saleUntil.getTime() < Date.now()) return null;

  const base = Number(p.price);
  const amount = Number(p.salePercent ?? 0);
  if (!amount) return null;

  const discounted =
    p.saleDiscountType === 'amount' ? base - amount : base * (1 - amount / 100);

  if (!(discounted > 0) || discounted >= base) return null;
  return Math.round(discounted * 100) / 100;
}

/**
 * Google Merchant Center product feed (RSS 2.0 + Google Shopping namespace).
 * Add this URL in Merchant Center → Data sources → Add products from a file →
 * "Scheduled fetch". No API key or service account required.
 *
 * One entry per product (not per variant) to keep the feed simple. Items are
 * print-on-demand with no GTIN, so identifier_exists=no is set.
 */
export async function GET() {
  const products = await prisma.product
    .findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        brand: true,
        category: true,
        images: true,
        stock: true,
        price: true,
        onSale: true,
        salePercent: true,
        saleUntil: true,
        saleDiscountType: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    .catch(() => []);

  const items = products
    .filter((p) => p.images && p.images.length > 0)
    .map((p) => {
      const link = `${SITE_URL}/product/${p.slug}`;
      const price = Number(p.price).toFixed(2);
      const sale = salePrice(p);
      const availability = p.stock > 0 ? 'in_stock' : 'out_of_stock';

      const extraImages = p.images
        .slice(1, 11)
        .map((img) => `    <g:additional_image_link>${xml(imageUrl(img))}</g:additional_image_link>`)
        .join('\n');

      return [
        '  <item>',
        `    <g:id>${xml(p.slug)}</g:id>`,
        `    <title>${xml(p.name)}</title>`,
        `    <description>${xml(p.description || p.name)}</description>`,
        `    <link>${xml(link)}</link>`,
        `    <g:image_link>${xml(imageUrl(p.images[0]))}</g:image_link>`,
        extraImages,
        `    <g:availability>${availability}</g:availability>`,
        `    <g:price>${price} USD</g:price>`,
        sale ? `    <g:sale_price>${sale.toFixed(2)} USD</g:sale_price>` : '',
        `    <g:brand>${xml(p.brand || APP_NAME)}</g:brand>`,
        `    <g:condition>new</g:condition>`,
        `    <g:identifier_exists>no</g:identifier_exists>`,
        `    <g:product_type>${xml(p.category)}</g:product_type>`,
        '  </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${xml(APP_NAME)}</title>
  <link>${SITE_URL}</link>
  <description>${xml(APP_NAME)} product feed for Google Merchant Center</description>
${items}
</channel>
</rss>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
