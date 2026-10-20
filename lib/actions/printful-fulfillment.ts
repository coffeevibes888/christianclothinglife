'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import {
  createPrintfulOrder,
  type PrintfulOrderItemInput,
  type PrintfulRecipient,
} from '@/lib/printful';
import { isPrintfulFulfillmentEnabled } from './settings.actions';

// Minimal mapping of common country names to ISO-3166 alpha-2 codes Printful
// expects. Falls back to the raw value when it already looks like a 2-letter
// code, otherwise defaults to US.
function toCountryCode(country: string): string {
  const c = country.trim();
  if (/^[A-Za-z]{2}$/.test(c)) return c.toUpperCase();
  const map: Record<string, string> = {
    'united states': 'US',
    usa: 'US',
    america: 'US',
    canada: 'CA',
    'united kingdom': 'GB',
    uk: 'GB',
    australia: 'AU',
  };
  return map[c.toLowerCase()] || 'US';
}

/**
 * Send a paid order to Printful for fulfillment. Safe to call unconditionally:
 * it no-ops when Printful fulfillment is disabled, and only includes line items
 * that are linked to a Printful sync variant. Never throws — returns a result.
 */
export async function fulfillOrderWithPrintful(orderId: string) {
  try {
    if (!(await isPrintfulFulfillmentEnabled())) {
      return { success: false, skipped: true, message: 'Printful fulfillment is disabled.' };
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        orderitems: true,
        user: { select: { email: true, name: true } },
      },
    });
    if (!order) return { success: false, message: 'Order not found.' };

    const variantIds = order.orderitems
      .map((i) => i.variantId)
      .filter((v): v is string => Boolean(v));

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, printfulExternalId: true },
    });
    const extByVariant = new Map(variants.map((v) => [v.id, v.printfulExternalId]));

    const items: PrintfulOrderItemInput[] = [];
    for (const item of order.orderitems) {
      const ext = item.variantId ? extByVariant.get(item.variantId) : null;
      if (!ext) continue; // not a Printful-linked line item
      items.push({ sync_variant_id: Number(ext), quantity: item.qty });
    }

    if (items.length === 0) {
      return {
        success: false,
        message: 'No Printful-linked items on this order — fulfill it manually.',
      };
    }

    const addr = (order.shippingAddress || {}) as Record<string, unknown>;
    const recipient: PrintfulRecipient = {
      name: String(addr.fullName || order.user?.name || 'Customer'),
      address1: String(addr.streetAddress || ''),
      city: String(addr.city || ''),
      state_code: addr.state ? String(addr.state) : undefined,
      country_code: toCountryCode(String(addr.country || 'US')),
      zip: String(addr.postalCode || ''),
      email: order.user?.email || undefined,
    };

    const result = await createPrintfulOrder({
      externalId: order.id,
      recipient,
      items,
      confirm: true,
    });

    return {
      success: true,
      message: `Printful order #${result.id} created (${result.status}).`,
      printfulOrderId: result.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
