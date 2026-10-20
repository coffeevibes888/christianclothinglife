import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order-actions';
import { fulfillOrderWithPrintful } from '@/lib/actions/printful-fulfillment';
import { prisma } from '@/db/prisma';
import { insertOrderItemSchema, shippingAddressSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  // Verify the Stripe signature before trusting anything in the event.
  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(
      await req.text(),
      req.headers.get('stripe-signature') as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json(
      { message: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  if (event.type !== 'charge.succeeded') {
    return NextResponse.json({ message: 'event is not charge.succeeded' });
  }

  const { object } = event.data;

  // Idempotency: if an order already records this charge, do nothing. This
  // prevents duplicate orders when Stripe retries or double-delivers an event.
  const alreadyProcessed = await prisma.order.findFirst({
    where: { paymentResult: { path: ['id'], equals: object.id } },
    select: { id: true },
  });
  if (alreadyProcessed) {
    return NextResponse.json({
      message: 'Charge already processed',
      orderId: alreadyProcessed.id,
    });
  }

  // Legacy flow: an order already exists, just mark it paid.
  if (object.metadata.orderId) {
    try {
      await updateOrderToPaid({
        orderId: object.metadata.orderId,
        paymentResult: {
          id: object.id,
          status: 'COMPLETED',
          email_address: object.billing_details.email!,
          pricePaid: (object.amount / 100).toFixed(),
        },
      });
    } catch (err) {
      // e.g. "Order already paid" on a retry — acknowledge so Stripe stops retrying.
      console.error('updateOrderToPaid (webhook) error:', err);
      return NextResponse.json({ message: 'Order already paid or not processable' });
    }

    return NextResponse.json({ message: 'updateOrderToPaid was successful' });
  }

  // Guest checkout flow: create the order from the cart.
  if (object.metadata.cartId) {
    const cart = await prisma.cart.findUnique({
      where: { id: object.metadata.cartId },
    });

    if (!cart || !cart.items || (cart.items as unknown[]).length === 0) {
      // Return 200 so Stripe doesn't retry a cart that has already been cleared.
      return NextResponse.json({ message: 'Cart not found or already processed' });
    }

    const cartItems = cart.items as Array<Record<string, unknown>>;
    const guestAddress = JSON.parse(object.metadata.guestAddress || '{}');
    const shippingAddress = shippingAddressSchema.parse({
      fullName: object.metadata.guestName || 'Guest',
      streetAddress: guestAddress.streetAddress || '',
      city: guestAddress.city || '',
      state: guestAddress.state || '',
      postalCode: guestAddress.postalCode || '',
      country: guestAddress.country || '',
    });

    const guestUser = await prisma.user.upsert({
      where: { email: object.metadata.guestEmail },
      update: { phoneNumber: object.metadata.guestPhone },
      create: {
        email: object.metadata.guestEmail,
        name: object.metadata.guestName || 'Guest',
        phoneNumber: object.metadata.guestPhone,
      },
    });

    // Create the order, decrement stock, and clear the cart atomically.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: guestUser.id,
          shippingAddress,
          paymentMethod: 'Stripe',
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
          isPaid: true,
          paidAt: new Date(),
          paymentResult: {
            id: object.id,
            status: 'COMPLETED',
            email_address: object.billing_details.email!,
            pricePaid: (object.amount / 100).toFixed(),
          },
          isDelivered: false,
          orderitems: {
            create: cartItems.map((cartItem) =>
              insertOrderItemSchema.parse({
                productId: cartItem.productId,
                slug: cartItem.slug,
                image: cartItem.image,
                name: cartItem.name,
                price: cartItem.price,
                qty: cartItem.qty,
                variantId: cartItem.variantId || null,
                variantColor: cartItem.variantColor || null,
                variantSize: cartItem.variantSize || null,
              })
            ),
          },
        },
      });

      for (const cartItem of cartItems) {
        const qty = Number(cartItem.qty) || 0;
        const productId = String(cartItem.productId);
        const variantId = cartItem.variantId ? String(cartItem.variantId) : null;
        if (qty <= 0) continue;

        if (variantId) {
          await tx.productVariant.update({
            where: { id: variantId },
            data: { stock: { decrement: qty } },
          });
        }
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: qty } },
        });
      }

      // Count the promo redemption so maxUses is enforced over time.
      if (cart.appliedPromoCodeId) {
        await tx.promoCode.update({
          where: { id: cart.appliedPromoCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          totalPrice: 0,
          taxPrice: 0,
          shippingPrice: 0,
          itemsPrice: 0,
          appliedPromoCodeId: null,
        },
      });

      return created;
    });

    // Push to Printful if enabled (non-blocking).
    fulfillOrderWithPrintful(order.id).catch((err) =>
      console.error('Printful fulfillment (guest) error:', err)
    );

    return NextResponse.json({
      message: 'Order created successfully from guest checkout',
      orderId: order.id,
    });
  }

  return NextResponse.json({ message: 'No orderId or cartId in metadata' });
}
