'use server';

import { prisma } from '@/db/prisma';
import { formatError } from '../utils';

export async function trackPageView(params: {
  sessionCartId: string;
  userId?: string | null;
  path: string;
  referrer?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  eventType?: string | null;
  eventData?: Record<string, unknown> | null;
  timeOnPage?: number | null;
  scrollDepth?: number | null;
  screenWidth?: number | null;
  screenHeight?: number | null;
  deviceType?: string | null;
  browserLang?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}) {
  try {
    const {
      sessionCartId,
      userId,
      path,
      referrer,
      country,
      region,
      city,
      userAgent,
      ip,
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
    } = params;

    if (!sessionCartId || !path) return;

    await prisma.analyticsEvent.create({
      data: {
        sessionCartId,
        userId: userId ?? undefined,
        path,
        referrer: referrer ?? undefined,
        country: country ?? undefined,
        region: region ?? undefined,
        city: city ?? undefined,
        userAgent: userAgent ?? undefined,
        ip: ip ?? undefined,
        eventType: eventType ?? undefined,
        eventData: eventData ?? undefined,
        timeOnPage: timeOnPage ?? undefined,
        scrollDepth: scrollDepth ?? undefined,
        screenWidth: screenWidth ?? undefined,
        screenHeight: screenHeight ?? undefined,
        deviceType: deviceType ?? undefined,
        browserLang: browserLang ?? undefined,
        utmSource: utmSource ?? undefined,
        utmMedium: utmMedium ?? undefined,
        utmCampaign: utmCampaign ?? undefined,
        utmContent: utmContent ?? undefined,
        utmTerm: utmTerm ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to track page view', formatError(error));
  }
}

export async function getAnalyticsOverview() {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOf7DaysAgo = new Date(startOfToday);
    startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);

    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [
      totalEvents,
      uniqueVisitors,
      topPages,
      countries,
      recentEvents,
      eventsToday,
      eventsYesterday,
      eventsLast7Days,
      activeRecentSessions,
      userAgentGroups,
      sessionDurations,
    ] = await Promise.all([
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.groupBy({
        by: ['sessionCartId'],
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['path'],
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['country'],
        _count: { _all: true },
      }),
      prisma.analyticsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.analyticsEvent.count({
        where: {
          createdAt: {
            gte: startOfToday,
          },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          createdAt: {
            gte: startOf7DaysAgo,
          },
        },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['sessionCartId'],
        where: {
          createdAt: {
            gte: fiveMinutesAgo,
          },
        },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['userAgent'],
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['sessionCartId'],
        where: {
          createdAt: {
            gte: startOf7DaysAgo,
          },
        },
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
    ]);

    const visitorsCount = uniqueVisitors.length;

    const sortedTopPages = topPages
      .slice()
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 10);

    const sortedCountries = countries
      .slice()
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 10);

    const currentOnlineVisitors = activeRecentSessions.length;

    const deviceBuckets: Record<string, number> = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      other: 0,
    };

    for (const ua of userAgentGroups) {
      const raw = (ua.userAgent || '').toLowerCase();
      let bucket: keyof typeof deviceBuckets = 'other';

      if (raw.includes('iphone') || raw.includes('android') || raw.includes('mobile')) {
        bucket = 'mobile';
      } else if (raw.includes('ipad') || raw.includes('tablet')) {
        bucket = 'tablet';
      } else if (raw.includes('macintosh') || raw.includes('windows') || raw.includes('linux')) {
        bucket = 'desktop';
      }

      deviceBuckets[bucket] += ua._count._all;
    }

    let averageSessionDurationMs = 0;
    if (sessionDurations.length > 0) {
      let totalDuration = 0;
      let countedSessions = 0;

      for (const s of sessionDurations) {
        if (!s._min.createdAt || !s._max.createdAt) continue;
        const diff =
          s._max.createdAt.getTime() -
          s._min.createdAt.getTime();
        if (diff < 0) continue;
        totalDuration += diff;
        countedSessions += 1;
      }

      if (countedSessions > 0) {
        averageSessionDurationMs = Math.round(totalDuration / countedSessions);
      }
    }

    return {
      totalEvents,
      visitorsCount,
      topPages: sortedTopPages,
      countries: sortedCountries,
      recentEvents,
      eventsToday,
      eventsYesterday,
      eventsLast7Days,
      currentOnlineVisitors,
      devices: deviceBuckets,
      averageSessionDurationMs,
    };
  } catch (error) {
    console.error('Failed to get analytics overview', formatError(error));
    return {
      totalEvents: 0,
      visitorsCount: 0,
      topPages: [],
      countries: [],
      recentEvents: [],
      eventsToday: 0,
      eventsYesterday: 0,
      eventsLast7Days: 0,
      currentOnlineVisitors: 0,
      devices: {
        desktop: 0,
        mobile: 0,
        tablet: 0,
        other: 0,
      },
      averageSessionDurationMs: 0,
    };
  }
}
