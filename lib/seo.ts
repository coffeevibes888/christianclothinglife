import type { Metadata } from 'next';
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from '@/lib/constants';

/**
 * Canonical site origin with any trailing slash stripped. Every absolute URL
 * used for SEO (canonical tags, Open Graph, structured data) is built from
 * this so ranking signals never get split across host variants.
 */
export const SITE_URL = (SERVER_URL || 'https://www.christianclothinglife.com').replace(/\/+$/, '');

/** Default social share image (1200×630 recommended). */
export const DEFAULT_OG_IMAGE = '/images/christianHero.png';

/** Brand-level keywords reused as a sensible default across pages. */
export const DEFAULT_KEYWORDS = [
  'Christian clothing',
  'faith apparel',
  'Christian t-shirts',
  'Christian hoodies',
  'faith-based clothing',
  'Christian coffee mugs',
  'Christian humor shirts',
  'inspirational apparel',
  APP_NAME,
];

/** Build an absolute URL from a path (or pass through an existing absolute URL). */
export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

type BuildMetadataArgs = {
  title?: string;
  description?: string;
  /** Canonical path, e.g. `/about` or `/product/my-shirt`. */
  path?: string;
  /** Image paths or absolute URLs used for OG/Twitter cards. */
  images?: string[];
  type?: 'website' | 'article';
  noIndex?: boolean;
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

/**
 * Centralised metadata builder so every page ships a consistent canonical URL,
 * Open Graph object, Twitter card, and robots directive without repeating the
 * boilerplate. Returns a Next.js `Metadata` object.
 */
export function buildMetadata({
  title,
  description = APP_DESCRIPTION,
  path = '/',
  images,
  type = 'website',
  noIndex = false,
  keywords,
  publishedTime,
  modifiedTime,
  authors,
}: BuildMetadataArgs = {}): Metadata {
  const canonical = absoluteUrl(path);
  const ogImages = (images && images.length ? images : [DEFAULT_OG_IMAGE]).map((src) => ({
    url: absoluteUrl(src),
    width: 1200,
    height: 630,
    alt: title ? `${title} — ${APP_NAME}` : APP_NAME,
  }));

  const baseOg = {
    title: title ?? APP_NAME,
    description,
    url: canonical,
    siteName: APP_NAME,
    locale: 'en_US',
    images: ogImages,
  };

  const openGraph: Metadata['openGraph'] =
    type === 'article'
      ? { ...baseOg, type: 'article', publishedTime, modifiedTime, authors }
      : { ...baseOg, type: 'website' };

  return {
    title,
    description,
    keywords: keywords ?? DEFAULT_KEYWORDS,
    alternates: { canonical },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: title ?? APP_NAME,
      description,
      images: ogImages.map((i) => i.url),
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  };
}

/* ------------------------------------------------------------------ */
/* JSON-LD structured data builders                                    */
/* ------------------------------------------------------------------ */

/** Organization schema — identity of the brand for knowledge-panel use. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: APP_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/images/christianlogo.png'),
    description: APP_DESCRIPTION,
    sameAs: [] as string[],
  };
}

/** WebSite schema with a Sitelinks search box pointing at /search. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** BreadcrumbList schema from an ordered list of { name, path } crumbs. */
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

type ProductSchemaInput = {
  name: string;
  slug: string;
  description?: string | null;
  images?: string[];
  brand?: string | null;
  price: number | string;
  rating?: number;
  numReviews?: number;
  stock?: number;
  sku?: string | null;
};

/** Product schema with Offer + optional AggregateRating. */
export function productSchema(product: ProductSchemaInput) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const rating = Number(product.rating ?? 0);
  const reviews = Number(product.numReviews ?? 0);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || APP_DESCRIPTION,
    image: (product.images || []).map((img) => absoluteUrl(img)),
    sku: product.sku || product.slug,
    brand: {
      '@type': 'Brand',
      name: product.brand || APP_NAME,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'USD',
      price: Number(product.price).toFixed(2),
      availability:
        (product.stock ?? 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: APP_NAME,
      },
    },
  };

  if (reviews > 0 && rating > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.toFixed(1),
      reviewCount: reviews,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

type ArticleSchemaInput = {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  authorName?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
};

/** BlogPosting schema for article pages. */
export function articleSchema(post: ArticleSchemaInput) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || APP_DESCRIPTION,
    image: post.coverImage ? [absoluteUrl(post.coverImage)] : [absoluteUrl(DEFAULT_OG_IMAGE)],
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt || post.createdAt).toISOString(),
    author: {
      '@type': 'Person',
      name: post.authorName || APP_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/images/christianlogo.png'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}
