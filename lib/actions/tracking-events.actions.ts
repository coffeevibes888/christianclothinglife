'use server';

import { cookies, headers } from 'next/headers';
import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { extractGeo } from '@/lib/tracking/geo';

type TrackingContext = {
  sessionCartId: string | null;
  ip: string | null;
  country: string | null;
  userId: string | undefined;
};

async function getTrackingContext(): Promise<TrackingContext> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const sessionCartId = cookieStore.get('sessionCartId')?.value || null;
  const { ip, country } = extractGeo(headerStore);

  let userId: string | undefined;
  try {
    const session = await auth();
    userId = (session?.user?.id as string | undefined) ?? undefined;
  } catch {
    userId = undefined;
  }

  return { sessionCartId, ip, country, userId };
}

export async function logProductView(input: {
  productId: string;
  variantViewed?: string | null;
  fromPage?: string | null;
  duration?: number | null;
}) {
  try {
    const { sessionCartId, ip, country, userId } = await getTrackingContext();
    if (!sessionCartId || !input.productId) return;

    await prisma.productView.create({
      data: {
        productId: input.productId,
        sessionCartId,
        userId: userId ?? undefined,
        ip: ip ?? undefined,
        country: country ?? undefined,
        duration: input.duration ?? undefined,
        variantViewed: input.variantViewed ?? undefined,
        fromPage: input.fromPage ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log product view', error);
  }
}

export async function logSearchQuery(input: {
  query: string;
  resultsCount?: number | null;
  clickedResult?: string | null;
}) {
  try {
    const query = input.query?.trim();
    if (!query) return;

    const { sessionCartId, ip, userId } = await getTrackingContext();
    if (!sessionCartId) return;

    await prisma.searchQuery.create({
      data: {
        sessionCartId,
        userId: userId ?? undefined,
        query,
        resultsCount: input.resultsCount ?? undefined,
        clickedResult: input.clickedResult ?? undefined,
        ip: ip ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log search query', error);
  }
}

export async function logCartEvent(input: {
  eventType: 'add' | 'remove' | 'update_qty' | 'abandon' | 'checkout_started';
  productId?: string | null;
  variantId?: string | null;
  quantity?: number | null;
  price?: number | null;
}) {
  try {
    const { sessionCartId, ip, userId } = await getTrackingContext();
    if (!sessionCartId) return;

    await prisma.cartEvent.create({
      data: {
        sessionCartId,
        userId: userId ?? undefined,
        eventType: input.eventType,
        productId: input.productId ?? undefined,
        variantId: input.variantId ?? undefined,
        quantity: input.quantity ?? undefined,
        price: input.price ?? undefined,
        ip: ip ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log cart event', error);
  }
}
