import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderToPaid } from '@/lib/actions/order-actions';
import { prisma } from '@/db/prisma';
import { insertOrderItemSchema, shippingAddressSchema } from '@/lib/validators';

export async function POST(req: NextRequest) {
  // Build the webhook event
  const event = await Stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature') as string,
    process.env.STRIPE_WEBHOOK_SECRET as string
  );

  // Check for successful payment
  if (event.type === 'charge.succeeded') {
    const { object } = event.data;

    // If orderId exists, update existing order (legacy flow)
    if (object.metadata.orderId) {
      await updateOrderToPaid({
        orderId: object.metadata.orderId,
        paymentResult: {
          id: object.id,
          status: 'COMPLETED',
          email_address: object.billing_details.email!,
          pricePaid: (object.amount / 100).toFixed(),
        },
      });

      return NextResponse.json({
        message: 'updateOrderToPaid was successful',
      });
    }

    // If cartId exists, create new order from cart (guest checkout flow)
    if (object.metadata.cartId) {
      const cart = await prisma.cart.findUnique({
        where: { id: object.metadata.cartId },
      });

      if (!cart || !cart.items || (cart.items as unknown[]).length === 0) {
        return NextResponse.json(
          { message: 'Cart not found or empty' },
          { status: 400 }
        );
      }

      const cartItems = cart.items as unknown[];
      const guestAddress = JSON.parse(object.metadata.guestAddress || '{}');
      const shippingAddress = shippingAddressSchema.parse({
        fullName: object.metadata.guestName || 'Guest',
        streetAddress: guestAddress.streetAddress || '',
        city: guestAddress.city || '',
        postalCode: guestAddress.postalCode || '',
        country: guestAddress.country || '',
      });

      const guestUser = await prisma.user.upsert({
        where: { email: object.metadata.guestEmail },
        update: {
          phoneNumber: object.metadata.guestPhone,
        },
        create: {
          email: object.metadata.guestEmail,
          name: object.metadata.guestName || 'Guest',
          phoneNumber: object.metadata.guestPhone,
        },
      });

      const order = await prisma.order.create({
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
            create: cartItems.map((item: unknown) => {
              const cartItem = item as Record<string, unknown>;
              const validatedItem = insertOrderItemSchema.parse({
                productId: cartItem.productId,
                slug: cartItem.slug,
                image: cartItem.image,
                name: cartItem.name,
                price: cartItem.price,
                qty: cartItem.qty,
                variantId: cartItem.variantId || null,
                variantColor: cartItem.variantColor || null,
                variantSize: cartItem.variantSize || null,
              });
              return validatedItem;
            }),
          },
        },
      });

      // Clear the cart
      await prisma.cart.update({
        where: { id: cart.id },
        data: { items: [], totalPrice: 0, taxPrice: 0, shippingPrice: 0, itemsPrice: 0 },
      });

      return NextResponse.json({
        message: 'Order created successfully from guest checkout',
        orderId: order.id,
      });
    }

    return NextResponse.json({
      message: 'No orderId or cartId in metadata',
    });
  }

  return NextResponse.json({
    message: 'event is not charge.succeeded',
  });
}
