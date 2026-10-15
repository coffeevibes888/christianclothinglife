import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getOrderSummary } from '@/lib/actions/order-actions';
import { getAnalyticsOverview } from '@/lib/actions/analytics.actions';
import { listBlockedIps } from '@/lib/actions/blocked-ip.actions';
import {
  getBehaviorMetrics,
  getProductAnalytics,
  getCartAnalytics,
  getSearchAnalytics,
  getDeviceAnalytics,
  getSecurityMetrics,
  getMarketingAttribution,
} from '@/lib/actions/advanced-analytics.actions';
import { convertToPlainObject } from '@/lib/utils';
import SuperAdminDashboard from './super-admin-dashboard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Super Admin',
};

export default async function SuperAdminPage() {
  const session = await auth();

  if (!session) {
    return redirect('/sign-in');
  }

  const [
    summary,
    analytics,
    blockedIps,
    behaviorMetrics,
    productAnalytics,
    cartAnalytics,
    searchAnalytics,
    deviceAnalytics,
    securityMetrics,
    marketingAttribution,
  ] = await Promise.all([
    getOrderSummary(),
    getAnalyticsOverview(),
    listBlockedIps(),
    getBehaviorMetrics(),
    getProductAnalytics(),
    getCartAnalytics(),
    getSearchAnalytics(),
    getDeviceAnalytics(),
    getSecurityMetrics(),
    getMarketingAttribution(),
  ]);

  const serializedSummary = convertToPlainObject(summary);
  const serializedAnalytics = convertToPlainObject(analytics);
  const serializedBehavior = convertToPlainObject(behaviorMetrics);
  const serializedProducts = convertToPlainObject(productAnalytics);
  const serializedCart = convertToPlainObject(cartAnalytics);
  const serializedSearch = convertToPlainObject(searchAnalytics);
  const serializedDevice = convertToPlainObject(deviceAnalytics);
  const serializedSecurity = convertToPlainObject(securityMetrics);
  const serializedMarketing = convertToPlainObject(marketingAttribution);

  return (
    <SuperAdminDashboard
      userEmail={session.user.email || ''}
      summary={serializedSummary}
      analytics={serializedAnalytics}
      currentUser={session.user}
      blockedIps={blockedIps}
      behaviorMetrics={serializedBehavior}
      productAnalytics={serializedProducts}
      cartAnalytics={serializedCart}
      searchAnalytics={serializedSearch}
      deviceAnalytics={serializedDevice}
      securityMetrics={serializedSecurity}
      marketingAttribution={serializedMarketing}
    />
  );
}
