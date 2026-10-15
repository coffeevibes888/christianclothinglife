'use server';

import { prisma } from '@/db/prisma';

// User Behavior Analytics
export async function getBehaviorMetrics() {
  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Average time on page
    const timeOnPageData = await prisma.analyticsEvent.aggregate({
      where: {
        eventType: { in: ['exit', 'pageview'] },
        timeOnPage: { not: null },
        createdAt: { gte: last7Days },
      },
      _avg: { timeOnPage: true },
    });

    // Scroll depth distribution
    const scrollData = await prisma.analyticsEvent.groupBy({
      by: ['scrollDepth'],
      where: {
        eventType: 'scroll',
        scrollDepth: { not: null },
        createdAt: { gte: last7Days },
      },
      _count: true,
    });

    // Pages per session
    const sessionPages = await prisma.analyticsEvent.groupBy({
      by: ['sessionCartId'],
      where: {
        eventType: 'pageview',
        createdAt: { gte: last7Days },
      },
      _count: true,
    });

    const avgPagesPerSession = sessionPages.reduce((acc, s) => acc + s._count, 0) / sessionPages.length || 0;

    // Exit pages (most common)
    const exitPages = await prisma.analyticsEvent.groupBy({
      by: ['path'],
      where: {
        eventType: 'exit',
        createdAt: { gte: last7Days },
      },
      _count: true,
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    });

    return {
      avgTimeOnPage: Math.round(timeOnPageData._avg.timeOnPage || 0),
      scrollDistribution: scrollData,
      avgPagesPerSession: Math.round(avgPagesPerSession * 10) / 10,
      topExitPages: exitPages,
    };
  } catch (error) {
    console.error('Failed to fetch behavior metrics:', error);
    return null;
  }
}

// Product Analytics
export async function getProductAnalytics() {
  try {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const topViewedProducts = await prisma.productView.groupBy({
      by: ['productId'],
      where: { createdAt: { gte: last7Days } },
      _count: true,
      _avg: { duration: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 10,
    });

    const productDetails = await Promise.all(
      topViewedProducts.map(async (pv) => {
        const product = await prisma.product.findUnique({
          where: { id: pv.productId },
          select: { name: true, slug: true, images: true },
        });
        return {
          productId: pv.productId,
          name: product?.name || 'Unknown',
          slug: product?.slug || '',
          image: (product?.images as string[])?.[0] || '',
          views: pv._count,
          avgDuration: Math.round(pv._avg.duration || 0),
        };
      })
    );

    return productDetails;
  } catch (error) {
    console.error('Failed to fetch product analytics:', error);
    return [];
  }
}

// Cart Analytics
export async function getCartAnalytics() {
  try {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const cartEvents = await prisma.cartEvent.groupBy({
      by: ['eventType'],
      where: { createdAt: { gte: last7Days } },
      _count: true,
    });

    const abandonedCarts = await prisma.cartEvent.findMany({
      where: {
        eventType: 'abandon',
        createdAt: { gte: last7Days },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const cartToCheckout = await prisma.cartEvent.groupBy({
      by: ['sessionCartId'],
      where: {
        eventType: 'checkout_started',
        createdAt: { gte: last7Days },
      },
      _count: true,
    });

    return {
      eventBreakdown: cartEvents,
      abandonedCarts,
      checkoutStarted: cartToCheckout.length,
    };
  } catch (error) {
    console.error('Failed to fetch cart analytics:', error);
    return null;
  }
}

// Search Analytics
export async function getSearchAnalytics() {
  try {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const topSearches = await prisma.searchQuery.groupBy({
      by: ['query'],
      where: { createdAt: { gte: last7Days } },
      _count: true,
      _avg: { resultsCount: true },
      orderBy: { _count: { query: 'desc' } },
      take: 20,
    });

    const zeroResultSearches = await prisma.searchQuery.groupBy({
      by: ['query'],
      where: {
        resultsCount: 0,
        createdAt: { gte: last7Days },
      },
      _count: true,
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    });

    return {
      topSearches,
      zeroResultSearches,
    };
  } catch (error) {
    console.error('Failed to fetch search analytics:', error);
    return { topSearches: [], zeroResultSearches: [] };
  }
}

// Device & Technical Analytics
export async function getDeviceAnalytics() {
  try {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deviceBreakdown = await prisma.analyticsEvent.groupBy({
      by: ['deviceType'],
      where: {
        deviceType: { not: null },
        createdAt: { gte: last7Days },
      },
      _count: true,
    });

    const screenResolutions = await prisma.analyticsEvent.groupBy({
      by: ['screenWidth', 'screenHeight'],
      where: {
        screenWidth: { not: null },
        screenHeight: { not: null },
        createdAt: { gte: last7Days },
      },
      _count: true,
      orderBy: { _count: { screenWidth: 'desc' } },
      take: 10,
    });

    const browserLanguages = await prisma.analyticsEvent.groupBy({
      by: ['browserLang'],
      where: {
        browserLang: { not: null },
        createdAt: { gte: last7Days },
      },
      _count: true,
      orderBy: { _count: { browserLang: 'desc' } },
      take: 10,
    });

    return {
      deviceBreakdown,
      screenResolutions,
      browserLanguages,
    };
  } catch (error) {
    console.error('Failed to fetch device analytics:', error);
    return null;
  }
}

// Security Analytics
export async function getSecurityMetrics() {
  try {
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const securityEvents = await prisma.securityEvent.groupBy({
      by: ['eventType'],
      where: { createdAt: { gte: last7Days } },
      _count: true,
    });

    const recentFailedLogins = await prisma.securityEvent.findMany({
      where: {
        eventType: 'failed_login',
        createdAt: { gte: last7Days },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const suspiciousIPs = await prisma.securityEvent.groupBy({
      by: ['ip'],
      where: {
        eventType: { in: ['failed_login', 'suspicious_activity'] },
        createdAt: { gte: last7Days },
      },
      _count: true,
      having: { ip: { _count: { gt: 3 } } },
      orderBy: { _count: { ip: 'desc' } },
    });

    return {
      eventBreakdown: securityEvents,
      recentFailedLogins,
      suspiciousIPs,
    };
  } catch (error) {
    console.error('Failed to fetch security metrics:', error);
    return null;
  }
}

// Marketing Attribution
export async function getMarketingAttribution() {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const utmSources = await prisma.analyticsEvent.groupBy({
      by: ['utmSource'],
      where: {
        utmSource: { not: null },
        createdAt: { gte: last30Days },
      },
      _count: true,
      orderBy: { _count: { utmSource: 'desc' } },
    });

    const utmCampaigns = await prisma.analyticsEvent.groupBy({
      by: ['utmCampaign', 'utmMedium', 'utmSource'],
      where: {
        utmCampaign: { not: null },
        createdAt: { gte: last30Days },
      },
      _count: true,
      orderBy: { _count: { utmCampaign: 'desc' } },
      take: 20,
    });

    const referrers = await prisma.analyticsEvent.groupBy({
      by: ['referrer'],
      where: {
        referrer: { not: null },
        NOT: { referrer: '' },
        createdAt: { gte: last30Days },
      },
      _count: true,
      orderBy: { _count: { referrer: 'desc' } },
      take: 20,
    });

    return {
      utmSources,
      utmCampaigns,
      topReferrers: referrers,
    };
  } catch (error) {
    console.error('Failed to fetch marketing attribution:', error);
    return null;
  }
}
