import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchPrintfulStores, fetchPrintfulStoreProducts } from '@/lib/printful';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin-only diagnostic: shows which Printful store the configured token is
// actually talking to, every store the token can access, and the products it
// currently returns. Use it to confirm you're synced to the right store and to
// find the PRINTFUL_STORE_ID you may need to set.
export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== 'admin' && role !== 'superAdmin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.PRINTFUL_SECRET_KEY) {
    return NextResponse.json(
      { success: false, message: 'PRINTFUL_SECRET_KEY is not configured.' },
      { status: 503 },
    );
  }

  const configuredStoreId = process.env.PRINTFUL_STORE_ID || null;

  const [storesResult, productsResult] = await Promise.allSettled([
    fetchPrintfulStores(),
    fetchPrintfulStoreProducts(),
  ]);

  return NextResponse.json({
    success: true,
    configuredStoreId,
    stores:
      storesResult.status === 'fulfilled'
        ? storesResult.value
        : { error: (storesResult.reason as Error)?.message },
    productsReturnedByToken:
      productsResult.status === 'fulfilled'
        ? productsResult.value.map((p) => ({ id: p.id, name: p.name, variants: p.variants }))
        : { error: (productsResult.reason as Error)?.message },
  });
}
