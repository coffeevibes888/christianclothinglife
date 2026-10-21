'use client';

import { useState, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ProductPrice from '@/components/shared/product/product-price';
import ProductImages from '@/components/shared/product/product-images';
import VariantSelector, { type Variant } from '@/components/shared/product/variant-selector';
import Rating from '@/components/shared/product/rating';
import { Cart } from '@/types';

type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  rating: number;
  numReviews: number;
  price: number;
  stock: number;
  images: string[];
  imageColors?: string[];
  variants?: Variant[];
};

export default function ProductDetailClient({
  product,
  cart,
}: {
  product: Product;
  cart?: Cart;
}) {
  const baseImages = useMemo(() => product.images || [], [product.images]);
  const [activeImage, setActiveImage] = useState<string>(baseImages[0] || '');
  const [activeColorName, setActiveColorName] = useState<string | undefined>();

  // Map imageColors to base images by index
  const imageColorMap = useMemo(
    () => {
      if (!product.imageColors || !product.imageColors.length) return [] as { image: string; colorName: string }[];
      return baseImages.map((img, index) => ({ image: img, colorName: product.imageColors?.[index] || '' }));
    },
    [baseImages, product.imageColors]
  );

  // Combine all unique images for thumbnails
  const allImages = useMemo(() => {
    const imagesSet = new Set(baseImages);
    (product.variants || []).forEach((v) => v.images?.forEach((img) => imagesSet.add(img)));
    return Array.from(imagesSet);
  }, [baseImages, product.variants]);

  // Handle when a color is selected.
  const handleColorSelected = useCallback(
    (colorSlug: string | undefined, colorName?: string) => {
      setActiveColorName(colorName);

      if (!colorName) {
        setActiveImage(baseImages[0] || '');
        return;
      }

      // Switch to the owner's uploaded image tagged with this color (images[]
      // tagged via imageColors[]). This drives color→image switching now that
      // images come from the owner rather than Printful variants.
      const directMatch = imageColorMap.find(
        (entry) => entry.colorName && entry.colorName.toLowerCase() === colorName.toLowerCase()
      );
      if (directMatch) {
        setActiveImage(directMatch.image);
        return;
      }

      const normalized = colorName.toLowerCase().replace(/\s+/g, '');
      const byName = allImages.find((img) =>
        img.toLowerCase().replace(/\s+/g, '').includes(normalized)
      );
      if (byName) setActiveImage(byName);
      // If nothing matches, the main image stays on the current selection.
    },
    [allImages, baseImages, imageColorMap]
  );

  // Handle variant change (color and/or size). The selected variant is the
  // single source of truth for the main image.
  const handleVariantChange = useCallback(
    (variant?: Variant) => {
      if (!variant) return;
      if (variant.color?.name) setActiveColorName(variant.color.name);

      // Prefer this variant's own mockup; if it has none (e.g. only the size
      // differs), borrow an image from another variant of the same color.
      const image =
        variant.images?.[0] ||
        (product.variants || []).find(
          (v) =>
            v.color?.slug === variant.color?.slug && v.images && v.images.length > 0
        )?.images?.[0];

      if (image) setActiveImage(image);
    },
    [product.variants]
  );

  // Handle thumbnail click
  const handleImageChange = useCallback((url?: string) => {
    if (url) setActiveImage(url);
  }, []);

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Images Column */}
        <div className="col-span-2">
          <ProductImages
            images={allImages}
            activeImage={activeImage}
            onImageClick={handleImageChange}
            colorName={activeColorName}
            productName={product.name}
          />
        </div>

        {/* Details Column */}
        <div className="col-span-2 p-5">
          <div className="flex flex-col gap-6">
            <p>{product.brand} {product.category}</p>
            <h1 className="h3-bold">{product.name}</h1>
            <Rating value={Number(product.rating)} />
            <p>{product.numReviews} reviews</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <ProductPrice
                value={Number(product.price)}
                className="w-24 rounded-full bg-green-100 text-green-700 px-5 py-2"
              />
            </div>
          </div>
          <div className="mt-10">
            <p className="font-semibold">Description</p>
            <p>{product.description}</p>
          </div>
        </div>

        {/* Action Column */}
        <div>
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex justify-between">
                <div>Price</div>
                <div><ProductPrice value={Number(product.price)} /></div>
              </div>
              <div className="mb-2 flex justify-between">
                <div>Status</div>
                {product.stock > 0 ? (
                  <Badge variant="outline">In Stock</Badge>
                ) : (
                  <Badge variant="destructive">Out Of Stock</Badge>
                )}
              </div>
              {product.stock > 0 && (
                <div className="flex-center mt-4">
                  <div className="w-full">
                    <VariantSelector
                      variants={product.variants || []}
                      product={product}
                      cart={cart}
                      onColorSelected={handleColorSelected}
                      onVariantChange={handleVariantChange}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

