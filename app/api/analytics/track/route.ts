import { NextRequest, NextResponse } from 'next/server';
import { trackPageView } from '@/lib/actions/analytics.actions';

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

    // Resolve client IP (works behind proxies like Vercel)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() || '::1';

    // Geo data is available on Vercel/Edge runtime
    const geo = (request as unknown as { geo?: { country?: string; region?: string; city?: string } }).geo;

    await trackPageView({
      sessionCartId,
      path: path || '/',
      referrer: referrer || null,
      country: geo?.country || null,
      region: geo?.region || null,
      city: geo?.city || null,
      userAgent: request.headers.get('user-agent') || null,
      ip,
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
