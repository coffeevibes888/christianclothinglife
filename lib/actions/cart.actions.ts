'use server';

import { cookies } from 'next/headers';
import { CartItem } from '@/types';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { cartItemSchema, insertCartSchema } from '../validators';
import {
  CATEGORY_WEIGHTS_OZ,
  DEFAULT_ITEM_WEIGHT_OZ,
  SHIPPING_BASE_HANDLING,
  SHIPPING_RATE_PER_LB,
} from '../constants';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { logCartEvent } from './tracking-events.actions';

type PricingProduct = {
  id: string;
  category: string;
  price: Prisma.Decimal;
  onSale: boolean;
  salePercent: Prisma.Decimal | null;
  saleUntil: Date | null;
  saleDiscountType: string;
};

// Authoritative unit price for an item, computed from the DB product/variant
// and any active sale. NEVER trust a client-supplied price. Mirrors the sale
// logic shown on product cards so the cart matches what the customer sees.
function computeEffectiveUnitPrice(
  product: PricingProduct | undefined,
  variant: { price: Prisma.Decimal } | null | undefined
): number {
  if (!product && !variant) return 0;
  const base = variant ? Number(variant.price) : Number(product!.price);

  if (!product?.onSale) return round2(base);
  if (product.saleUntil && new Date(product.saleUntil) < new Date()) return round2(base);

  const salePercent = product.salePercent != null ? Number(product.salePercent) : null;
  if (!salePercent || Number.isNaN(salePercent)) return round2(base);

  if (product.saleDiscountType === 'amount') {
    return round2(Math.max(0, base - salePercent));
  }
  return round2(base * (1 - salePercent / 100));
}

// Calculate cart prices with dynamic settings. All unit prices are re-derived
// from the database here, so a tampered client price cannot affect any total.
// Mutates each item's `price` in place to the authoritative value so the
// stored cart (and any order built from it) carries correct prices.
const calcPrice = async (
  items: CartItem[],
  promoCodeId?: string
) => {
  const productIds = Array.from(
    new Set(items.map((i) => i.productId).filter(Boolean))
  );
  const variantIds = Array.from(
    new Set(items.map((i) => i.variantId).filter((v): v is string => Boolean(v)))
  );

  const [shippingSettings, promoCode, products, variants] = await Promise.all([
    prisma.shippingSettings.findFirst(),
    promoCodeId
      ? prisma.promoCode.findFirst({ where: { id: promoCodeId } })
      : null,
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            category: true,
            price: true,
            onSale: true,
            salePercent: true,
            saleUntil: true,
            saleDiscountType: true,
          },
        })
      : Promise.resolve([] as PricingProduct[]),
    variantIds.length
      ? prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, price: true },
        })
      : Promise.resolve([] as { id: string; price: Prisma.Decimal }[]),
  ]);

  const productById = new Map(products.map((p) => [p.id, p as PricingProduct]));
  const variantById = new Map(variants.map((v) => [v.id, v]));

  // Re-derive the authoritative unit price for every item and overwrite the
  // (untrusted) client price on the item itself.
  let itemsPrice = 0;
  for (const item of items) {
    const product = productById.get(item.productId);
    const variant = item.variantId ? variantById.get(item.variantId) : null;
    const unit = computeEffectiveUnitPrice(product, variant);
    item.price = unit;
    itemsPrice += unit * item.qty;
  }
  itemsPrice = round2(itemsPrice);

  const freeShippingThreshold = shippingSettings
    ? Number(shippingSettings.freeShippingThreshold)
    : 100;

  // --- Weight-based shipping -------------------------------------------------
  const categoryByProductId = new Map(
    products.map((p) => [p.id, (p.category || '').trim().toLowerCase()])
  );
  const totalWeightOz = items.reduce((acc, item) => {
    const cat = categoryByProductId.get(item.productId) || '';
    const perItemOz = CATEGORY_WEIGHTS_OZ[cat] ?? DEFAULT_ITEM_WEIGHT_OZ;
    return acc + perItemOz * item.qty;
  }, 0);
  const totalWeightLb = totalWeightOz / 16;

  // Promo discount applies to the item subtotal — only if active, not expired,
  // and under its usage cap.
  let discountedPrice = itemsPrice;
  if (promoCode && promoCode.isActive) {
    const notExpired = !promoCode.expiresAt || new Date(promoCode.expiresAt) > new Date();
    const underCap =
      promoCode.maxUses == null || promoCode.usedCount < promoCode.maxUses;
    const meetsMin =
      !promoCode.minOrderAmount || itemsPrice >= Number(promoCode.minOrderAmount);

    if (notExpired && underCap && meetsMin) {
      const discountValue = Number(promoCode.discountValue);
      if (promoCode.discountType === 'percentage') {
        discountedPrice = round2(itemsPrice * (1 - discountValue / 100));
      } else {
        discountedPrice = round2(Math.max(0, itemsPrice - discountValue));
      }
    }
  }

  const shippingPrice =
    discountedPrice >= freeShippingThreshold
      ? 0
      : round2(SHIPPING_BASE_HANDLING + totalWeightLb * SHIPPING_RATE_PER_LB);

  // Tax removed per store policy.
  const taxPrice = 0;
  const totalPrice = round2(discountedPrice + taxPrice + shippingPrice);

  return {
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  };
};

export async function applyPromoCodeToCart(code: string) {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    const cart = await getMyCart();
    if (!cart || cart.items.length === 0) {
      throw new Error('Your cart is empty');
    }

    const promoCode = await prisma.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!promoCode) {
      throw new Error('Promo code is invalid or inactive');
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) <= new Date()) {
      throw new Error('This promo code has expired');
    }

    if (promoCode.maxUses != null && promoCode.usedCount >= promoCode.maxUses) {
      throw new Error('This promo code has reached its usage limit');
    }

    const prices = await calcPrice(cart.items as CartItem[], promoCode.id);

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        appliedPromoCodeId: promoCode.id,
        ...prices,
      },
    });

    return {
      success: true,
      message: 'Promo code applied',
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function addItemToCart(data: CartItem) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Get cart
    const cart = await getMyCart();

    // Parse and validate item
    const item = cartItemSchema.parse(data);

    // Find product in database
    const product = await prisma.product.findFirst({ where: { id: item.productId } });
    if (!product) throw new Error('Product not found');

    // If variant provided, fetch it
    const variant = item.variantId
      ? await prisma.productVariant.findUnique({ where: { id: item.variantId } })
      : null;

    if (!cart) {
      const prices = await calcPrice([item]);
      const newCart = insertCartSchema.parse({
        userId: userId,
        items: [item],
        sessionCartId: sessionCartId,
        ...prices,
      });

      await prisma.cart.create({
        data: newCart,
      });

      await logCartEvent({
        eventType: 'add',
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.qty,
        price: Number(item.price),
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    } else {
      const existItem = (cart.items as CartItem[]).find(
        (x) => x.productId === item.productId && x.variantId === item.variantId
      );

      const addQty = item.qty && item.qty > 0 ? item.qty : 1;

      if (existItem) {
        const available = variant ? variant.stock : product.stock;
        if (available < existItem.qty + addQty) {
          throw new Error('Not enough stock');
        }

        (cart.items as CartItem[]).find(
          (x) => x.productId === item.productId && x.variantId === item.variantId
        )!.qty = existItem.qty + addQty;
      } else {
        const available = variant ? variant.stock : product.stock;
        if (available < addQty) throw new Error('Not enough stock');

        cart.items.push(item);
      }

      const prices = await calcPrice(
        cart.items as CartItem[],
        cart.appliedPromoCodeId ?? undefined
      );
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as Prisma.CartUpdateitemsInput[],
          ...prices,
        },
      });

      await logCartEvent({
        eventType: existItem ? 'update_qty' : 'add',
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.qty,
        price: Number(item.price),
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${existItem ? 'updated in' : 'added to'} cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function getMyCart() {
  // Check for cart cookie
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) throw new Error('Cart session not found');

  // Get session and user ID
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  // Get user cart from database
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
  });

  if (!cart) return undefined;

  // Convert decimals and return
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: Number(cart.itemsPrice),
    totalPrice: Number(cart.totalPrice),
    shippingPrice: Number(cart.shippingPrice),
    taxPrice: Number(cart.taxPrice),
  });
}

export async function removeItemFromCart(
  productId: string,
  variantId?: string,
  removeEntireLine = false
) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // The product may no longer exist (deleted or re-synced to a new id). That
    // must NOT block removing the stale item — look it up but don't require it.
    const product = await prisma.product.findFirst({
      where: { id: productId },
    });

    // Get user cart
    const cart = await getMyCart();
    if (!cart) throw new Error('Cart not found');

    // Check for item (consider variantId when provided)
    const exist = (cart.items as CartItem[]).find(
      (x) => x.productId === productId && (variantId ? x.variantId === variantId : true)
    );
    if (!exist) throw new Error('Item not found');

    if (removeEntireLine || exist.qty === 1) {
      // Remove the whole line (filter by productId + variantId when provided)
      cart.items = (cart.items as CartItem[]).filter(
        (x) => !(x.productId === productId && (variantId ? x.variantId === variantId : true))
      );
    } else {
      // Decrease qty by one
      (cart.items as CartItem[]).find(
        (x) => x.productId === productId && (variantId ? x.variantId === variantId : true)
      )!.qty = exist.qty - 1;
    }

    const prices = await calcPrice(
      cart.items as CartItem[],
      cart.appliedPromoCodeId ?? undefined
    );
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...prices,
      },
    });

    await logCartEvent({
      eventType: 'remove',
      productId,
      variantId: variantId ?? null,
    });

    if (product?.slug) revalidatePath(`/product/${product.slug}`);
    revalidatePath('/cart');

    return {
      success: true,
      message:
        removeEntireLine || exist.qty === 1
          ? `${product?.name ?? 'Item'} removed from cart`
          : `${product?.name ?? 'Item'} updated in cart`,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
