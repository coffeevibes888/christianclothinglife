import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getMyCart } from "@/lib/actions/cart.actions";
import { formatError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestDetails } = body as {
      guestDetails?: {
        fullName?: string;
        email?: string;
        phone?: string;
        streetAddress?: string;
        city?: string;
        postalCode?: string;
        country?: string;
      };
    };

    if (!guestDetails || !guestDetails.email || !guestDetails.phone) {
      return NextResponse.json(
        { success: false, message: "Missing guest contact details" },
        { status: 400 }
      );
    }

    const cart = await getMyCart();

    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Your cart is empty" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(cart.totalPrice) * 100),
      currency: "USD",
      metadata: {
        cartId: cart.id,
        guestEmail: guestDetails.email,
        guestName: guestDetails.fullName || "Guest",
        guestPhone: guestDetails.phone,
        guestAddress: JSON.stringify({
          streetAddress: guestDetails.streetAddress || "",
          city: guestDetails.city || "",
          postalCode: guestDetails.postalCode || "",
          country: guestDetails.country || "",
        }),
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: formatError(error) },
      { status: 500 }
    );
  }
}
