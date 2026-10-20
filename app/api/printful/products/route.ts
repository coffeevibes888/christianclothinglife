import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchPrintfulStoreProducts } from '@/lib/printful';
import { syncProductsFromPrintful } from '@/lib/actions/product.actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminSession() {
  const session = await auth();
  const role = session?.user?.role;
  return role === 'admin' || role === 'superAdmin';
}

// List the store's Printful products (admin only).
export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.PRINTFUL_SECRET_KEY) {
    return NextResponse.json(
      { success: false, message: 'PRINTFUL_SECRET_KEY is not configured.' },
      { status: 503 },
    );
  }

  try {
    const products = await fetchPrintfulStoreProducts();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Printful request failed' },
      { status: 502 },
    );
  }
}

// Trigger a product/variant sync from Printful (admin only).
export async function POST() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncProductsFromPrintful();
  return NextResponse.json(result, { status: result.success ? 200 : 502 });
}
