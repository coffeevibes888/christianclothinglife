import { MetadataRoute } from 'next';
import { prisma } from '@/db/prisma';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

/**
 * Dynamic sitemap covering static marketing pages, category search landing
 * pages, every active product, and every published blog post. Each dynamic
 * query is failure-tolerant so a DB hiccup never blanks the whole sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = (
    [
      { path: '', freq: 'daily', pri: 1.0 },
      { path: '/search', freq: 'daily', pri: 0.9 },
      { path: '/blog', freq: 'weekly', pri: 0.7 },
      { path: '/about', freq: 'monthly', pri: 0.5 },
      { path: '/contact', freq: 'monthly', pri: 0.5 },
    ] as const
  ).map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.freq as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: p.pri,
  }));

  const categoryEntries: MetadataRoute.Sitemap = PRODUCT_CATEGORIES.map((category) => ({
    url: `${SITE_URL}/search?category=${encodeURIComponent(category)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const [products, blogPosts] = await Promise.all([
    prisma.product
      .findMany({ select: { slug: true, createdAt: true } })
      .catch(() => [] as { slug: string; createdAt: Date }[]),
    prisma.blogPost
      .findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => [] as { slug: string; updatedAt: Date }[]),
  ]);

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.createdAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries, ...blogEntries];
}
