import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ProductPrice from './product-price';
import { Product } from '@/types';
import Rating from './rating';

type ProductWithSale = Product & {
  onSale?: boolean | null;
  saleUntil?: string | Date | null;
  salePercent?: number | string | null;
  saleDiscountType?: 'percentage' | 'amount' | string | null;
};

const ProductCard = ({ product }: { product: Product }) => {
  const extendedProduct = product as ProductWithSale;

  const isOnSaleActive = (() => {
    const onSale = extendedProduct.onSale ?? undefined;
    const saleUntil = extendedProduct.saleUntil ?? undefined;
    if (!onSale) return false;
    if (!saleUntil) return true;
    const end = new Date(saleUntil as string | number | Date);
    if (Number.isNaN(end.getTime())) return true;
    return end > new Date();
  })();

  const rawSalePercent = extendedProduct.salePercent ?? null;
  const salePercent = isOnSaleActive && rawSalePercent ? Number(rawSalePercent) : null;

  const originalPrice = Number(product.price);
  const saleType = (extendedProduct.saleDiscountType as 'percentage' | 'amount' | undefined) ?? 'percentage';

  let salePrice = originalPrice;
  if (isOnSaleActive && salePercent && !Number.isNaN(salePercent)) {
    if (saleType === 'amount') {
      const discount = Math.min(salePercent, originalPrice);
      salePrice = originalPrice - discount;
    } else {
      salePrice = originalPrice * (1 - salePercent / 100);
    }
  }

  const hasSecondImage = product.images && product.images.length > 1;
  const lowStock = product.stock > 0 && product.stock < 5;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-2xl hover:shadow-indigo-500/20">
      {/* Always-on gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600" />
      {/* Gradient ring on hover */}
      <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 ring-2 ring-inset ring-transparent transition-opacity duration-300 group-hover:opacity-100 group-hover:[box-shadow:inset_0_0_0_1.5px_rgba(99,102,241,0.35)]" />

      <CardHeader className="relative items-center p-0">
        <Link href={`/product/${product.slug}`} className="block w-full">
          <div className="relative aspect-square w-full overflow-hidden bg-transparent">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority={true}
                sizes="250px"
                className={`bg-transparent object-contain transition-all duration-500 group-hover:scale-105 ${
                  hasSecondImage ? 'group-hover:opacity-0' : ''
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-medium text-slate-400">
                Image coming soon
              </div>
            )}
            {hasSecondImage && (
              <Image
                src={product.images[1]}
                alt={product.name}
                fill
                sizes="250px"
                className="absolute inset-0 scale-105 bg-transparent object-contain opacity-0 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100"
              />
            )}

            {/* View overlay */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-slate-900/80 to-transparent px-3 pb-3 pt-8 transition-transform duration-300 group-hover:translate-y-0">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-white">
                View details
                <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </Link>

        {isOnSaleActive && salePercent && (
          <div className="absolute left-3 top-3 z-20 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md shadow-rose-500/30">
            {saleType === 'amount'
              ? `-$${salePercent.toFixed(2)}`
              : `-${Math.round(salePercent)}% OFF`}
          </div>
        )}

        {product.stock <= 0 && (
          <div className="absolute right-3 top-3 z-20 rounded-full bg-slate-900/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Sold out
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5 p-4">
        {product.brand && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
            {product.brand}
          </div>
        )}

        <Link href={`/product/${product.slug}`}>
          <h2 className="line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
            {product.name}
          </h2>
        </Link>

        <div className="mt-1 flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Rating value={Number(product.rating)} />
              <span className="text-[10px] text-slate-400">({product.numReviews})</span>
            </div>
            {lowStock && (
              <span className="text-[10px] font-medium text-orange-500">
                Only {product.stock} left
              </span>
            )}
          </div>

          {product.stock > 0 ? (
            salePercent ? (
              <div className="flex flex-col items-end leading-none">
                <span className="text-[11px] text-slate-400 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
                <ProductPrice value={salePrice} className="text-base font-bold text-slate-900" />
              </div>
            ) : (
              <ProductPrice value={originalPrice} className="text-base font-bold text-slate-900" />
            )
          ) : (
            <p className="text-xs font-medium text-destructive">Out Of Stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
