import { NextRequest, NextResponse } from 'next/server';
import { trackPageView } from '@/lib/actions/analytics.actions';
import { extractGeo } from '@/lib/tracking/geo';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionCartId,
      path,
      referrer,
      eventType,
      eventData,
      timeOnPage,
      scrollDepth,
      screenWidth,
      screenHeight,
      deviceType,
      browserLang,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    } = body;

    if (!sessionCartId) {
      return NextResponse.json({ error: 'Missing sessionCartId' }, { status: 400 });
    }

    // Resolve client IP + approximate location from edge headers.
    // NOTE: `request.geo` does not exist in App Router route handlers
    // (removed in Next 15) — geo comes from x-vercel-ip-* / cf-* headers.
    const { ip, country, region, city } = extractGeo(request.headers);

    // Attach the authenticated user id so the dashboard can exclude the owner's
    // and staff's own activity. Anonymous visitors stay null.
    let userId: string | undefined;
    try {
      const session = await auth();
      userId = (session?.user?.id as string | undefined) ?? undefined;
    } catch {
      userId = undefined;
    }

    await trackPageView({
      sessionCartId,
      userId,
      path: path || '/',
      referrer: referrer || null,
      country,
      region,
      city,
      userAgent: request.headers.get('user-agent') || null,
      ip: ip || '::1',
      eventType: eventType || 'pageview',
      eventData: eventData || null,
      timeOnPage: timeOnPage || null,
      scrollDepth: scrollDepth || null,
      screenWidth: screenWidth || null,
      screenHeight: screenHeight || null,
      deviceType: deviceType || null,
      browserLang: browserLang || null,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      utmContent: utmContent || null,
      utmTerm: utmTerm || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 });
  }
}
