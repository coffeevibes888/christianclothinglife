import { getProductBySlug, getRelatedProducts } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getMyCart } from '@/lib/actions/cart.actions';
import { logProductView } from '@/lib/actions/tracking-events.actions';
import ReviewList from './review-list';
import { auth } from '@/auth';
import ProductDetailClient from '@/components/shared/product/product-detail-client';
import ProductList from '@/components/shared/product/product-list';
import type { Product } from '@/types';
import { JsonLd } from '@/components/seo/json-ld';
import { buildMetadata, breadcrumbSchema, productSchema } from '@/lib/seo';

function toPlainText(value?: string | null, max = 160): string | undefined {
  if (!value) return undefined;
  const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return buildMetadata({
      title: 'Product Not Found',
      path: `/product/${slug}`,
      noIndex: true,
    });
  }

  const description =
    toPlainText(product.description) ||
    `Shop ${product.name} at great prices with secure checkout and easy returns.`;

  return buildMetadata({
    title: product.name,
    description,
    path: `/product/${slug}`,
    images: (product.images as string[] | undefined)?.length
      ? (product.images as string[])
      : undefined,
    keywords: [product.name, product.category, product.brand].filter(
      (k): k is string => Boolean(k),
    ),
  });
}

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Record the product view for the super-admin product analytics.
  await logProductView({ productId: product.id, fromPage: `/product/${slug}` });

  const session = await auth();
  const userId = session?.user?.id;

  const cart = await getMyCart();
  const relatedProducts = (await getRelatedProducts(
    product.category,
    product.id,
    4
  )) as Product[];

  const clientProduct = {
    ...product,
    // Ensure numeric fields are numbers for the client component typing
    price: Number(product.price),
    rating: Number(product.rating),
    variants: (product.variants || []).map((v) => ({
      id: v.id,
      price: Number(v.price),
      images: v.images as string[] | undefined,
      color: v.color
        ? { id: v.color.id, name: v.color.name, slug: v.color.slug, hex: v.color.hex }
        : null,
      size: v.size
        ? { id: v.size.id, name: v.size.name, slug: v.size.slug }
        : null,
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          productSchema({
            name: product.name,
            slug: product.slug,
            description: product.description,
            images: product.images as string[] | undefined,
            brand: product.brand,
            price: clientProduct.price,
            rating: clientProduct.rating,
            numReviews: product.numReviews,
            stock: product.stock,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            ...(product.category
              ? [
                  {
                    name: product.category,
                    path: `/search?category=${encodeURIComponent(product.category)}`,
                  },
                ]
              : []),
            { name: product.name, path: `/product/${product.slug}` },
          ]),
        ]}
      />
      <ProductDetailClient product={clientProduct} cart={cart} />
      {product.numReviews > 0 && (
        <section className='mt-10'>
          <h2 className='h2-bold mb-5'>Customer Reviews</h2>
          <ReviewList
            userId={userId || ''}
            productId={product.id}
            productSlug={product.slug}
          />
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className='mt-12'>
          <ProductList data={relatedProducts} title='You may also like' />
        </section>
      )}
    </>
  );
};

export default ProductDetailsPage;
