"use server";
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  fetchPrintfulStoreProducts,
  fetchPrintfulStoreProduct,
  fetchPrintfulCatalogProduct,
} from '@/lib/printful';

function slugifyValue(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Printful sync-variant names look like "Product Name - Color / Size" (or just
// "- Size" / "- Color"). Parsing color/size from the name avoids a per-variant
// catalog API call, which is what was tripping Printful's rate limit (429).
// Map a Printful product type / name to one of the store's homepage categories.
// Returns 'Uncategorized' only when nothing matches.
function mapPrintfulTypeToCategory(typeName?: string, productName?: string): string {
  const hay = `${typeName || ''} ${productName || ''}`.toLowerCase();
  if (/\b(hoodie|sweatshirt|crewneck|pullover|sweater)\b/.test(hay)) return 'Hoodies';
  if (/\b(mug|cup|tumbler|bottle|drinkware)\b/.test(hay)) return 'Coffee Mugs';
  if (/\b(t-?shirt|tee|tank|top|v-?neck|long.?sleeve|polo|jersey)\b/.test(hay)) return 'T-Shirts';
  return 'Uncategorized';
}

function parseVariantNameColorSize(name: string): { color?: string; size?: string } {
  const idx = name.lastIndexOf(' - ');
  if (idx === -1) return {};
  const tail = name.slice(idx + 3).trim();
  if (!tail) return {};

  if (tail.includes('/')) {
    const parts = tail.split('/').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { color: parts[0], size: parts[parts.length - 1] };
    }
    if (parts.length === 1) return { color: parts[0] };
  }

  const sizeTokens = new Set([
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', '5XL', '2XLT', '3XLT',
  ]);
  if (sizeTokens.has(tail.toUpperCase())) return { size: tail };
  return { color: tail };
}

// Type for variant creation
type VariantInput = {
  productId: string;
  colorId?: string;
  sizeId?: string;
  price: number;
  stock: number;
  images: string[];
};

// Get latest products
export async function getLatestProducts(limit = LATEST_PRODUCTS_LIMIT) {
  const data = await prisma.product.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return convertToPlainObject(
    data.map((p) => ({
      ...p,
      subCategory: p.subCategory ?? undefined,
      price: Number(p.price),
      rating: Number(p.rating),
    }))
  );
}

// Get latest products for a specific category (for themed sections like Faith, Funny, Deals, etc.)
export async function getLatestProductsByCategory(category: string, limit = LATEST_PRODUCTS_LIMIT) {
  const trimmed = category.trim();
  // Tolerate singular/plural mismatches (e.g. "T-Shirt" vs "T-Shirts").
  const variants = Array.from(
    new Set(
      [
        trimmed,
        trimmed.endsWith('s') ? trimmed.slice(0, -1) : `${trimmed}s`,
      ].filter(Boolean)
    )
  );

  const data = await prisma.product.findMany({
    where: {
      OR: variants.flatMap((v) => [
        { category: { equals: v, mode: 'insensitive' as const } },
        { subCategory: { equals: v, mode: 'insensitive' as const } },
      ]),
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return convertToPlainObject(
    data.map((p) => ({
      ...p,
      subCategory: p.subCategory ?? undefined,
      price: Number(p.price),
      rating: Number(p.rating),
    }))
  );
}

// Sync products from the Printful Store API into local Product/ProductVariant
// tables. Owner-managed fields (category, name, description, flags) are left
// untouched on products that already exist; only price, images, variants, and
// the Printful id are refreshed.
export async function syncProductsFromPrintful() {
  try {
    if (!process.env.PRINTFUL_SECRET_KEY) {
      return { success: false, message: 'PRINTFUL_SECRET_KEY is not configured.' };
    }

    const summaries = await fetchPrintfulStoreProducts();

    let created = 0;
    let updated = 0;
    let variantCount = 0;

    // Cache catalog variant data (color + real hex + size). We fetch one catalog
    // PRODUCT at a time (a single API call per product) rather than one request
    // per variant, which keeps us well under Printful's rate limit.
    const catalogVariantCache = new Map<
      number,
      { color?: string; colorCode?: string; size?: string }
    >();
    const fetchedCatalogProducts = new Set<number>();
    const catalogTypeByProductId = new Map<number, string>();

    const ensureCatalogForProduct = async (catalogProductId?: number) => {
      if (!catalogProductId || fetchedCatalogProducts.has(catalogProductId)) return;
      fetchedCatalogProducts.add(catalogProductId);
      const { typeName, variants: catalogVariants } =
        await fetchPrintfulCatalogProduct(catalogProductId);
      if (typeName) catalogTypeByProductId.set(catalogProductId, typeName);
      for (const cv of catalogVariants) {
        catalogVariantCache.set(cv.id, {
          color: cv.color ?? undefined,
          colorCode: cv.color_code ?? undefined,
          size: cv.size ?? undefined,
        });
      }
    };

    for (const summary of summaries) {
      const detail = await fetchPrintfulStoreProduct(summary.id);
      const sp = detail.sync_product;
      const variants = detail.sync_variants || [];

      // One catalog call per product gives authoritative color names + hex and
      // the product type we use to auto-assign a store category.
      const catalogProductId = variants.find((v) => v.product?.product_id)?.product
        ?.product_id;
      await ensureCatalogForProduct(catalogProductId);

      const detectedCategory = mapPrintfulTypeToCategory(
        catalogProductId ? catalogTypeByProductId.get(catalogProductId) : undefined,
        sp.name
      );

      const firstVariant = variants[0];
      const basePrice = firstVariant ? Number(firstVariant.retail_price) || 0 : 0;

      const images = Array.from(
        new Set(
          [
            sp.thumbnail_url,
            ...variants.flatMap((v) =>
              (v.files || []).map((f) => f.preview_url).filter((u): u is string => Boolean(u))
            ),
            ...variants.map((v) => v.product?.image).filter((u): u is string => Boolean(u)),
          ].filter((u): u is string => Boolean(u))
        )
      ).slice(0, 10);

      const existing = await prisma.product.findFirst({
        where: {
          OR: [{ printfulProductId: String(sp.id) }, { slug: slugifyValue(sp.name) }],
        },
      });

      let productId: string;

      if (existing) {
        // Preserve a manually-set category; only (re)assign when the existing
        // one is still blank/Uncategorized so re-syncs can upgrade older imports.
        const keepCategory =
          existing.category &&
          existing.category.toLowerCase() !== 'uncategorized';

        const updatedProduct = await prisma.product.update({
          where: { id: existing.id },
          data: {
            printfulProductId: String(sp.id),
            price: basePrice,
            images: images.length ? images : existing.images,
            ...(keepCategory ? {} : { category: detectedCategory }),
          },
        });
        productId = updatedProduct.id;
        updated++;
      } else {
        const newProduct = await prisma.product.create({
          data: {
            name: sp.name,
            slug: slugifyValue(sp.name),
            category: detectedCategory,
            brand: 'Christian Clothing Life',
            description: sp.name,
            images: images.length ? images : [],
            stock: 999,
            price: basePrice,
            printfulProductId: String(sp.id),
          },
        });
        productId = newProduct.id;
        created++;
      }

      for (const v of variants) {
        // Use the authoritative Printful catalog color (name + hex) and size;
        // fall back to parsing the variant name only if the catalog had nothing.
        const catalog = catalogVariantCache.get(v.variant_id);
        let color = catalog?.color;
        let size = catalog?.size;
        const colorCode = catalog?.colorCode;
        if (!color && !size) {
          const parsed = parseVariantNameColorSize(v.name);
          color = parsed.color;
          size = parsed.size;
        }

        let colorId: string | null = null;
        if (color) {
          const colorSlug = slugifyValue(color);
          const colorRec = await prisma.color.upsert({
            where: { slug: colorSlug },
            // Backfill/refresh the real hex from Printful on every sync.
            update: colorCode ? { hex: colorCode } : {},
            create: { name: color, slug: colorSlug, hex: colorCode ?? null },
          });
          colorId = colorRec.id;
        }

        let sizeId: string | null = null;
        if (size) {
          const sizeSlug = slugifyValue(size);
          const sizeRec = await prisma.size.upsert({
            where: { slug: sizeSlug },
            update: {},
            create: { name: size, slug: sizeSlug },
          });
          sizeId = sizeRec.id;
        }

        // Prefer the generated garment mockup (Printful "preview" file) so the
        // stored image matches the variant's color; then any other previews,
        // then the catalog garment image as a last resort.
        const previewFiles = (v.files || []).filter(
          (f) => f.type === 'preview' && f.preview_url
        );
        const otherFiles = (v.files || []).filter(
          (f) => f.type !== 'preview' && f.preview_url
        );
        const variantImages = [
          ...previewFiles.map((f) => f.preview_url as string),
          ...otherFiles.map((f) => f.preview_url as string),
        ];
        if (variantImages.length === 0 && v.product?.image) {
          variantImages.push(v.product.image);
        }
        const price = Number(v.retail_price) || basePrice;

        if (v.sku) {
          await prisma.productVariant.upsert({
            where: { sku: v.sku },
            update: {
              productId,
              colorId,
              sizeId,
              images: variantImages,
              price,
              printfulExternalId: String(v.id),
            },
            create: {
              productId,
              sku: v.sku,
              colorId,
              sizeId,
              images: variantImages,
              price,
              stock: 999,
              printfulExternalId: String(v.id),
            },
          });
        } else {
          const existingVar = await prisma.productVariant.findFirst({
            where: { printfulExternalId: String(v.id) },
          });
          if (existingVar) {
            await prisma.productVariant.update({
              where: { id: existingVar.id },
              data: { productId, colorId, sizeId, images: variantImages, price },
            });
          } else {
            await prisma.productVariant.create({
              data: {
                productId,
                colorId,
                sizeId,
                images: variantImages,
                price,
                stock: 999,
                printfulExternalId: String(v.id),
              },
            });
          }
        }
        variantCount++;
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/');

    return {
      success: true,
      message: `Synced ${summaries.length} product(s): ${created} created, ${updated} updated, ${variantCount} variant(s).`,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get single product by it's slug
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug: slug },
    include: { variants: { include: { color: true, size: true } } },
  });
  return convertToPlainObject(product);
}

// Get related products in the same category (for "You may also like").
export async function getRelatedProducts(
  category: string,
  excludeProductId: string,
  limit = 4
) {
  const data = await prisma.product.findMany({
    where: {
      id: { not: excludeProductId },
      OR: [
        { category: { equals: category, mode: 'insensitive' } },
        { subCategory: { equals: category, mode: 'insensitive' } },
      ],
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return convertToPlainObject(
    data.map((p) => ({
      ...p,
      subCategory: p.subCategory ?? undefined,
      price: Number(p.price),
      rating: Number(p.rating),
      salePercent: p.salePercent != null ? Number(p.salePercent) : undefined,
      saleUntil: p.saleUntil ? new Date(p.saleUntil).toISOString() : undefined,
    }))
  );
}

// Get all colors
export async function getAllColors() {
  return await prisma.color.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
}

// Get all sizes
export async function getAllSizes() {
  return await prisma.size.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
}

// Get variants for a product by product id
export async function getVariantsByProductId(productId: string) {
  return await prisma.productVariant.findMany({ where: { productId }, include: { color: true, size: true } });
}

// Get single product by it's ID
export async function getProductById(productId: string) {
  const data = await prisma.product.findFirst({
    where: { id: productId },
  });

  if (!data) return null;

  const normalized = {
    ...data,
    subCategory: data.subCategory ?? undefined,
    price: Number(data.price),
    rating: Number(data.rating),
  };

  return convertToPlainObject(normalized);
}

// Get all products
export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
  price,
  rating,
  sort,
  sizeSlug,
  colorSlug,
  inStockOnly,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
  sizeSlug?: string;
  colorSlug?: string;
  inStockOnly?: boolean;
}) {
  // Query filter
  const queryFilter: Prisma.ProductWhereInput =
    query && query !== 'all'
      ? {
          name: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  // Category filter
  const categoryFilter = category && category !== 'all' ? { category } : {};

  // Price filter
  const priceFilter: Prisma.ProductWhereInput =
    price && price !== 'all'
      ? {
          price: {
            gte: Number(price.split('-')[0]),
            lte: Number(price.split('-')[1]),
          },
        }
      : {};

  // Rating filter
  const ratingFilter =
    rating && rating !== 'all'
      ? {
          rating: {
            gte: Number(rating),
          },
        }
      : {};

  const sizeFilter: Prisma.ProductWhereInput =
    sizeSlug && sizeSlug !== 'all'
      ? {
          variants: {
            some: {
              size: { slug: sizeSlug },
            },
          },
        }
      : {};

  const colorFilter: Prisma.ProductWhereInput =
    colorSlug && colorSlug !== 'all'
      ? {
          variants: {
            some: {
              color: { slug: colorSlug },
            },
          },
        }
      : {};

  const stockFilter: Prisma.ProductWhereInput = inStockOnly
    ? {
        OR: [
          { stock: { gt: 0 } },
          {
            variants: {
              some: {
                stock: { gt: 0 },
              },
            },
          },
        ],
      }
    : {};

  const where: Prisma.ProductWhereInput = {
    ...queryFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
    ...sizeFilter,
    ...colorFilter,
    ...stockFilter,
  };

  const data = await prisma.product.findMany({
    where,
    orderBy:
      sort === 'lowest'
        ? { price: 'asc' }
        : sort === 'highest'
        ? { price: 'desc' }
        : sort === 'rating'
        ? { rating: 'desc' }
        : { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const dataCount = await prisma.product.count({ where });

  return {
    data: data.map((p) => ({
      ...p,
      price: Number(p.price),
      rating: Number(p.rating),
    })),
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete a product
export async function deleteProduct(id: string) {
  try {
    const productExists = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExists) throw new Error('Product not found');

    await prisma.product.delete({ where: { id } });

    revalidatePath('/admin/products');

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Create a product
export async function createProduct(data: z.infer<typeof insertProductSchema>) {
  try {
    const product = insertProductSchema.parse(data);
    // Extract only Product model fields, excluding sizeIds and colorIds (variant metadata)
    const { sizeIds, colorIds, saleUntil, ...rest } = product;

    const productData = {
      ...rest,
      // Convert saleUntil from string (from datetime-local input) to Date or null for Prisma
      saleUntil: saleUntil ? new Date(saleUntil) : null,
    };
    console.log('Color IDs:', colorIds);

    // create product and optionally create variants from provided sizeIds
    const created = await prisma.product.create({ data: productData });

    if (sizeIds && sizeIds.length) {
      const variants: VariantInput[] = [];
      for (const sizeId of sizeIds) {
        variants.push({
          productId: created.id,
          sizeId,
          price: Number(product.price),
          stock: product.stock,
          images: product.images || [],
        });
      }
      if (variants.length) {
        await prisma.productVariant.createMany({ data: variants });
      }
    }

    revalidatePath('/admin/products');

    return {
      success: true,
      message: 'Product created successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update a product
export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    const product = updateProductSchema.parse(data);
    const productExists = await prisma.product.findFirst({
      where: { id: product.id },
    });

    if (!productExists) throw new Error('Product not found');

    // Update product and optionally refresh variants
    await prisma.$transaction(async (tx) => {
      // Extract only Product model fields, excluding sizeIds and colorIds (variant metadata)
      const { sizeIds, colorIds, saleUntil, ...rest } = product;
      void colorIds;

      const productData = {
        ...rest,
        saleUntil: saleUntil ? new Date(saleUntil) : null,
      };

      await tx.product.update({ where: { id: product.id }, data: productData });

      // If sizeIds provided, remove existing variants and recreate (colorId no longer selected in UI)
      if (sizeIds && sizeIds.length) {
        await tx.productVariant.deleteMany({ where: { productId: product.id } });
        const variants: VariantInput[] = [];
        for (const sizeId of sizeIds) {
          if (!sizeId) continue; // skip any empty size ids to avoid invalid UUIDs

          variants.push({
            productId: product.id,
            sizeId,
            price: Number(product.price),
            stock: product.stock,
            images: product.images || [],
          });
        }
        if (variants.length) {
          await tx.productVariant.createMany({ data: variants });
        }
      }
    });

    revalidatePath('/admin/products');
    // Refresh the storefront so a category change shows on the homepage rows,
    // search, and the product page immediately.
    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: 'Product updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all categories
export async function getAllCategories() {
  const data = await prisma.product.groupBy({
    by: ['category'],
    _count: true,
  });

  return data;
}

// Get category tree with distinct subcategories (for navigation menus)
export async function getCategoryTree() {
  const rows = await prisma.product.groupBy({
    by: ['category', 'subCategory'],
    _count: { _all: true },
  });

  const map = new Map<string, { count: number; subCategories: string[] }>();

  for (const row of rows) {
    const entry = map.get(row.category) ?? { count: 0, subCategories: [] };
    entry.count += row._count._all ?? 0;

    if (row.subCategory) {
      if (!entry.subCategories.includes(row.subCategory)) {
        entry.subCategories.push(row.subCategory);
      }
    }

    map.set(row.category, entry);
  }

  return Array.from(map.entries()).map(([category, value]) => ({
    category,
    count: value.count,
    subCategories: value.subCategories,
  }));
}

// Get featured products
export async function getFeaturedProducts() {
  const data = await prisma.product.findMany({
    where: { isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  return convertToPlainObject(
    data.map((p) => ({
      ...p,
      subCategory: p.subCategory ?? undefined,
      price: Number(p.price),
      rating: Number(p.rating),
    }))
  );
}