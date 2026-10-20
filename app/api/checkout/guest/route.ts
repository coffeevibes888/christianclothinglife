import { NextResponse } from 'next/server';

// DISABLED: this route created orders BEFORE payment and upserted users with no
// authentication, which allowed anyone to mass-create orders/accounts. The live
// checkout flow is /api/checkout/create-payment-intent followed by order
// creation in the Stripe webhook after payment is confirmed.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: 'This endpoint is disabled. Checkout happens via Stripe payment confirmation.',
    },
    { status: 410 },
  );
}
