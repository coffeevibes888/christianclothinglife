/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import DashboardOverview from "../admin/overview/dashboard-overview";

const views = [
  { id: "overview", label: "Overview" },
  { id: "traffic", label: "Traffic" },
  { id: "engagement", label: "Engagement" },
  { id: "users", label: "Users & Sessions" },
  { id: "behavior", label: "User Behavior" },
  { id: "products", label: "Product Analytics" },
  { id: "cart", label: "Cart & Checkout" },
  { id: "search", label: "Search Analytics" },
  { id: "device", label: "Device & Technical" },
  { id: "security", label: "Security & Fraud" },
  { id: "marketing", label: "Marketing Attribution" },
] as const;

type TopPage = {
  path: string;
  _count: {
    _all: number;
  };
};

type CountryStat = {
  country: string | null;
  _count: {
    _all: number;
  };
};

type AnalyticsEvent = {
  id: string;
  createdAt: Date | string;
  sessionCartId?: string | null;
  path: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  ip?: string | null;
};

type DevicesBreakdown = {
  desktop?: number;
  mobile?: number;
  tablet?: number;
  other?: number;
};

type AnalyticsSummary = {
  totalEvents: number;
  visitorsCount: number;
  topPages: TopPage[];
  countries: CountryStat[];
  recentEvents: AnalyticsEvent[];
  eventsToday: number;
  eventsYesterday: number;
  eventsLast7Days: number;
  currentOnlineVisitors: number;
  devices?: DevicesBreakdown | null;
  averageSessionDurationMs: number;
} & Record<string, unknown>;

type LatestSale = {
  id: string;
  user: {
    name?: string | null;
  } | null;
  createdAt: Date | string;
  totalPrice: number | string;
};

type OverviewSummary = {
  totalSales: { _sum: { totalPrice?: string | number | null } };
  ordersCount: number;
  usersCount: number;
  productsCount: number;
  salesData: { month: string; totalSales: number }[];
};

type StoreSummary = OverviewSummary & {
  latestSales: LatestSale[];
};

type BlockedIpSummary = {
  id: string;
  ip: string;
  reason?: string | null;
  active: boolean;
  createdAt: Date | string;
};

interface SuperAdminDashboardProps {
  userEmail: string;
  summary: StoreSummary;
  analytics: AnalyticsSummary;
  currentUser?: Session["user"];
  blockedIps?: BlockedIpSummary[];
  behaviorMetrics?: any;
  productAnalytics?: any[];
  cartAnalytics?: any;
  searchAnalytics?: any;
  deviceAnalytics?: any;
  securityMetrics?: any;
  marketingAttribution?: any;
}

function formatDuration(ms: number) {
  if (!ms || ms <= 0) return "0m";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}
function parseOS(userAgent?: string | null): string {
  if (!userAgent) return "Unknown";
  const ua = userAgent.toLowerCase();

  if (ua.includes("windows nt")) return "Windows";
  if (ua.includes("mac os x") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("linux")) return "Linux";

  return "Other";
}

const SuperAdminDashboard = ({ 
  userEmail, 
  summary, 
  analytics, 
  currentUser, 
  blockedIps,
  behaviorMetrics,
  productAnalytics,
  cartAnalytics,
  searchAnalytics,
  deviceAnalytics,
  securityMetrics,
  marketingAttribution,
}: SuperAdminDashboardProps) => {
  const [activeView, setActiveView] = useState<(typeof views)[number]["id"]>("overview");
  const [isClearingStats, startClearingStats] = useTransition();
  const [isBlockingIp, startBlockingIp] = useTransition();
  const [activeTrafficDetail, setActiveTrafficDetail] = useState<
    "today" | "yesterday" | "last7" | null
  >(null);

  const {
    totalEvents,
    visitorsCount,
    topPages,
    countries,
    recentEvents,
    eventsToday,
    eventsYesterday,
    eventsLast7Days,
    currentOnlineVisitors,
    devices,
    averageSessionDurationMs,
  } = analytics;

  const osBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of recentEvents as AnalyticsEvent[]) {
      const os = parseOS(ev.userAgent);
      counts[os] = (counts[os] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [recentEvents]);

  const trafficDetailEvents = useMemo(() => {
    if (!activeTrafficDetail) return [] as AnalyticsEvent[];

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOf7DaysAgo = new Date(startOfToday);
    startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7);

    return recentEvents.filter((ev) => {
      const created = new Date(ev.createdAt);

      if (activeTrafficDetail === "today") {
        return created >= startOfToday;
      }

      if (activeTrafficDetail === "yesterday") {
        return created >= startOfYesterday && created < startOfToday;
      }

      if (activeTrafficDetail === "last7") {
        return created >= startOf7DaysAgo;
      }

      return false;
    });
  }, [activeTrafficDetail, recentEvents]);

  const handleClearStatistics = () => {
    if (!window.confirm("This will clear all tracked analytics statistics. Continue?")) return;

    startClearingStats(async () => {
      try {
        const res = await fetch("/api/analytics/reset", { method: "POST" });
        const data = await res.json();
        if (!res.ok || !data.success) {
          console.error("Failed to clear analytics statistics", data?.message);
          return;
        }
        window.location.reload();
      } catch (err) {
        console.error("Error clearing analytics statistics", err);
      }
    });
  };

  const suspiciousSessionsMap = new Map<string, number>();
  for (const ev of recentEvents) {
    if (!ev.sessionCartId) continue;
    const current = suspiciousSessionsMap.get(ev.sessionCartId) || 0;
    suspiciousSessionsMap.set(ev.sessionCartId, current + 1);
  }
  const suspiciousSessions = Array.from(suspiciousSessionsMap.entries())
    .filter(([, count]) => count >= 20)
    .slice(0, 5);

  const activeBlockedIps = (blockedIps || []).filter((ip) => ip.active);

  const overviewContent = (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          High-level overview of store performance, traffic, and activity for {userEmail}.
        </p>
      </section>

      {currentUser && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Current User Details</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Name</p>
                <p className="font-medium">{currentUser.name || "N/A"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{currentUser.email || "N/A"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Role</p>
                <p className="font-medium">{currentUser.role || "user"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Phone</p>
                <p className="font-medium">{currentUser.phoneNumber || "N/A"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Phone Verified</p>
                <p className="font-medium">
                  {currentUser.phoneVerified ? "Yes" : "No"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-1 text-sm">
                <p className="text-xs font-medium text-muted-foreground">User ID</p>
                <p className="font-mono text-xs truncate">{currentUser.id}</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Store Performance</h2>
        <DashboardOverview summary={summary} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Traffic Overview</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Page Views</p>
              <p className="text-2xl font-semibold">{formatNumber(totalEvents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Unique Visitors</p>
              <p className="text-2xl font-semibold">{formatNumber(visitorsCount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Average Views / Visitor</p>
              <p className="text-2xl font-semibold">
                {visitorsCount > 0 ? (totalEvents / visitorsCount).toFixed(2) : "0.00"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Top Pages</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No traffic data yet.
                    </TableCell>
                  </TableRow>
                )}
                {topPages.map((p: TopPage) => (
                  <TableRow key={p.path}>
                    <TableCell>{p.path}</TableCell>
                    <TableCell className="text-right">{p._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Top Countries</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No geo data yet.
                    </TableCell>
                  </TableRow>
                )}
                {countries.map((c: CountryStat, idx: number) => (
                  <TableRow key={`${c.country ?? "Unknown"}-${idx}`}>
                    <TableCell>{c.country ?? "Unknown"}</TableCell>
                    <TableCell className="text-right">{c._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Recent Paid Orders</h2>
          <Link href="/admin/orders" className="text-xs text-primary underline-offset-4 hover:underline">
            View all orders
          </Link>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BUYER</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead>TOTAL</TableHead>
                <TableHead className="text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.latestSales.slice(0, 8).map((order: LatestSale) => (
                <TableRow key={order.id}>
                  <TableCell>{order?.user?.name || "Deleted User"}</TableCell>
                  <TableCell>{formatDateTime(new Date(order.createdAt)).dateOnly}</TableCell>
                  <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/order/${order.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );

  const trafficContent = (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Traffic Summary</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Current Online Visitors</p>
              <p className="text-2xl font-semibold">{formatNumber(currentOnlineVisitors)}</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer"
            onClick={() =>
              setActiveTrafficDetail((prev) => (prev === "today" ? null : "today"))
            }
          >
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Page Views Today</p>
              <p className="text-2xl font-semibold">{formatNumber(eventsToday)}</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer"
            onClick={() =>
              setActiveTrafficDetail((prev) => (prev === "yesterday" ? null : "yesterday"))
            }
          >
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Page Views Yesterday</p>
              <p className="text-2xl font-semibold">{formatNumber(eventsYesterday)}</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer"
            onClick={() =>
              setActiveTrafficDetail((prev) => (prev === "last7" ? null : "last7"))
            }
          >
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Last 7 Days Page Views</p>
              <p className="text-2xl font-semibold">{formatNumber(eventsLast7Days)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {activeTrafficDetail && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {activeTrafficDetail === "today" && "Page Views Today - Detail"}
            {activeTrafficDetail === "yesterday" && "Page Views Yesterday - Detail"}
            {activeTrafficDetail === "last7" && "Last 7 Days Page Views - Detail"}
          </h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>OS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trafficDetailEvents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No matching events found in the recent window.
                    </TableCell>
                  </TableRow>
                )}
                {trafficDetailEvents.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>{formatDateTime(new Date(ev.createdAt)).dateTime}</TableCell>
                    <TableCell className="text-xs font-mono truncate max-w-[140px]">
                      {ev.sessionCartId}
                    </TableCell>
                    <TableCell>{ev.path}</TableCell>
                    <TableCell>
                      {[
                        ev.city || undefined,
                        ev.region || undefined,
                        ev.country || undefined,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Unknown"}
                    </TableCell>
                    <TableCell>{parseOS(ev.userAgent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Top Pages</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No traffic data yet.
                    </TableCell>
                  </TableRow>
                )}
                {topPages.map((p: TopPage) => (
                  <TableRow key={p.path}>
                    <TableCell>{p.path}</TableCell>
                    <TableCell className="text-right">{p._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Top Countries</h2>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm text-muted-foreground">
                      No geo data yet.
                    </TableCell>
                  </TableRow>
                )}
                {countries.map((c: CountryStat, idx: number) => (
                  <TableRow key={`${c.country ?? "Unknown"}-${idx}`}>
                    <TableCell>{c.country ?? "Unknown"}</TableCell>
                    <TableCell className="text-right">{c._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );

  const engagementContent = (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Engagement</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Average Session Length</p>
              <p className="text-2xl font-semibold">{formatDuration(averageSessionDurationMs)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Average Views / Visitor</p>
              <p className="text-2xl font-semibold">
                {visitorsCount > 0 ? (totalEvents / visitorsCount).toFixed(2) : "0.00"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-sm text-muted-foreground">
                    No recent activity yet.
                  </TableCell>
                </TableRow>
              )}
              {recentEvents.map((ev: AnalyticsEvent) => (
                <TableRow key={ev.id}>
                  <TableCell>{formatDateTime(new Date(ev.createdAt)).dateTime}</TableCell>
                  <TableCell className="text-xs font-mono truncate max-w-[140px]">
                    {ev.sessionCartId}
                  </TableCell>
                  <TableCell>{ev.path}</TableCell>
                  <TableCell>
                    {[
                      ev.city || undefined,
                      ev.region || undefined,
                      ev.country || undefined,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Unknown"}
                  </TableCell>
                  <TableCell>{parseOS(ev.userAgent)}</TableCell>
                  <TableCell className="text-xs font-mono truncate max-w-[120px]">
                    {ev.ip || "Unknown"}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      disabled={!ev.ip || isBlockingIp}
                      onClick={() => {
                        if (!ev.ip) return;
                        startBlockingIp(async () => {
                          try {
                            const res = await fetch("/api/super-admin/block-ip", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ip: ev.ip, reason: `Blocked from Recent Activity for ${ev.path}` }),
                            });
                            if (!res.ok) {
                              console.error("Failed to block IP", await res.text());
                            } else {
                              window.location.reload();
                            }
                          } catch (err) {
                            console.error("Error blocking IP from dashboard", err);
                          }
                        });
                      }}
                      className="inline-flex items-center rounded-md bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isBlockingIp ? "Blocking..." : "Block IP"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );

  const usersContent = (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Users & Sessions</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Current Online Users</p>
              <p className="text-2xl font-semibold">{formatNumber(currentOnlineVisitors)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Unique Visitors (All Time)</p>
              <p className="text-2xl font-semibold">{formatNumber(visitorsCount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Average Session Length</p>
              <p className="text-2xl font-semibold">{formatDuration(averageSessionDurationMs)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Devices</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Desktop</p>
              <p className="text-2xl font-semibold">{formatNumber(devices?.desktop ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Mobile</p>
              <p className="text-2xl font-semibold">{formatNumber(devices?.mobile ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Tablet</p>
              <p className="text-2xl font-semibold">{formatNumber(devices?.tablet ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Other</p>
              <p className="text-2xl font-semibold">{formatNumber(devices?.other ?? 0)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Operating Systems (Recent)</h2>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden max-w-xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>OS</TableHead>
                <TableHead className="text-right">Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {osBreakdown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-sm text-muted-foreground">
                    No recent activity to determine OS distribution.
                  </TableCell>
                </TableRow>
              )}
              {osBreakdown.map(([os, count]) => (
                <TableRow key={os}>
                  <TableCell>{os}</TableCell>
                  <TableCell className="text-right">{formatNumber(count)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );

  // User Behavior Content
  const behaviorContent = (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Behavior Analytics</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Avg Time on Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(behaviorMetrics?.avgTimeOnPage as number) || 0}s
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Pages/Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {((behaviorMetrics?.avgPagesPerSession as number) || 0).toFixed?.(1) || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scroll Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Users scrolling to various depths
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Exit Pages</CardTitle>
          <CardDescription>Where users leave your site</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead className="text-right">Exits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(behaviorMetrics?.topExitPages as any[])?.map((page: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{page.path}</TableCell>
                  <TableCell className="text-right">{page._count}</TableCell>
                </TableRow>
              )) || <TableRow><TableCell colSpan={2}>No data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Product Analytics Content
  const productsContent = (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Product Analytics</h2>
      <Card>
        <CardHeader>
          <CardTitle>Top Viewed Products (Last 7 Days)</CardTitle>
          <CardDescription>Most popular products and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productAnalytics && productAnalytics.length > 0 ? (
                productAnalytics.map((product: any) => (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <Link href={`/product/${product.slug}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{product.views}</TableCell>
                    <TableCell className="text-right">{product.avgDuration}s</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3}>No product data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // Cart Analytics Content
  const cartContent = (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cart & Checkout Analytics</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Checkouts Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {(cartAnalytics?.checkoutStarted as number) || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cart Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {(cartAnalytics?.eventBreakdown as any[])?.map((event: any) => (
                <div key={event.eventType} className="flex justify-between">
                  <span className="capitalize">{event.eventType}</span>
                  <span className="font-bold">{event._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Search Analytics Content
  const searchContent = (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Search Analytics</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Searches</CardTitle>
            <CardDescription>What users are looking for</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Avg Results</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(searchAnalytics?.topSearches as any[])?.slice(0, 10).map((search: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{search.query}</TableCell>
                    <TableCell className="text-right">{search._count}</TableCell>
                    <TableCell className="text-right">{Math.round(search._avg.resultsCount || 0)}</TableCell>
                  </TableRow>
                )) || <TableRow><TableCell colSpan={3}>No search data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Zero Result Searches</CardTitle>
            <CardDescription>Queries that found nothing</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(searchAnalytics?.zeroResultSearches as any[])?.map((search: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{search.query}</TableCell>
                    <TableCell className="text-right">{search._count}</TableCell>
                  </TableRow>
                )) || <TableRow><TableCell colSpan={2}>No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Device Analytics Content
  const deviceContent = (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Device & Technical Analytics</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {(deviceAnalytics?.deviceBreakdown as any[])?.map((device: any) => (
                <div key={device.deviceType} className="flex justify-between">
                  <span className="capitalize">{device.deviceType || 'Unknown'}</span>
                  <span className="font-bold">{device._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Screen Resolutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {(deviceAnalytics?.screenResolutions as any[])?.slice(0, 5).map((res: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="font-mono text-xs">{res.screenWidth} x {res.screenHeight}</span>
                  <span className="font-bold">{res._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Browser Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {(deviceAnalytics?.browserLanguages as any[])?.slice(0, 5).map((lang: any) => (
                <div key={lang.browserLang} className="flex justify-between">
                  <span>{lang.browserLang}</span>
                  <span className="font-bold">{lang._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Security Content
  const securityContent = (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Security & Fraud Detection</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Security Events (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(securityMetrics?.eventBreakdown as any[])?.map((event: any) => (
                <div key={event.eventType} className="flex justify-between items-center p-2 border rounded">
                  <span className="font-medium capitalize">{event.eventType.replace(/_/g, ' ')}</span>
                  <span className="text-xl font-bold">{event._count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Suspicious IPs</CardTitle>
            <CardDescription>IPs with multiple security events</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(securityMetrics?.suspiciousIPs as any[])?.map((ip: any) => (
                  <TableRow key={ip.ip}>
                    <TableCell className="font-mono text-xs">{ip.ip}</TableCell>
                    <TableCell className="text-right">{ip._count}</TableCell>
                  </TableRow>
                )) || <TableRow><TableCell colSpan={2}>No suspicious IPs</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Marketing Attribution Content
  const marketingContent = (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Marketing Attribution</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>UTM Sources (Last 30 Days)</CardTitle>
            <CardDescription>Where your traffic comes from</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(marketingAttribution?.utmSources as any[])?.map((source: any) => (
                  <TableRow key={source.utmSource}>
                    <TableCell className="font-medium">{source.utmSource}</TableCell>
                    <TableCell className="text-right">{source._count}</TableCell>
                  </TableRow>
                )) || <TableRow><TableCell colSpan={2}>No UTM data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Campaigns</CardTitle>
            <CardDescription>Best performing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(marketingAttribution?.utmCampaigns as any[])?.slice(0, 10).map((campaign: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{campaign.utmCampaign}</TableCell>
                    <TableCell className="text-xs">{campaign.utmMedium}</TableCell>
                    <TableCell className="text-right">{campaign._count}</TableCell>
                  </TableRow>
                )) || <TableRow><TableCell colSpan={3}>No campaign data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
          <CardDescription>External sites driving traffic</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead className="text-right">Visits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(marketingAttribution?.topReferrers as any[])?.slice(0, 15).map((ref: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs truncate max-w-md">{ref.referrer}</TableCell>
                  <TableCell className="text-right">{ref._count}</TableCell>
                </TableRow>
              )) || <TableRow><TableCell colSpan={2}>No referrer data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  let content = overviewContent;
  if (activeView === "traffic") content = trafficContent;
  else if (activeView === "engagement") content = engagementContent;
  else if (activeView === "users") content = usersContent;
  else if (activeView === "behavior") content = behaviorContent;
  else if (activeView === "products") content = productsContent;
  else if (activeView === "cart") content = cartContent;
  else if (activeView === "search") content = searchContent;
  else if (activeView === "device") content = deviceContent;
  else if (activeView === "security") content = securityContent;
  else if (activeView === "marketing") content = marketingContent;

  return (
    <div className="flex gap-6">
      <aside className="w-52 shrink-0 space-y-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Super Admin</CardTitle>
            <CardDescription className="text-xs">Deep visibility into users and visitors.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <button
              type="button"
              onClick={handleClearStatistics}
              disabled={isClearingStats}
              className="mt-1 w-full rounded-md bg-red-500/90 text-xs font-semibold text-white py-1.5 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isClearingStats ? "Clearing statistics..." : "Clear All Statistics"}
            </button>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Security & Monitoring</CardTitle>
            <CardDescription className="text-xs">
              Watch for scraping, bots, and blocked IPs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-4 space-y-3 text-xs">
            <div>
              <p className="mb-1 font-medium">Suspicious Sessions</p>
              {suspiciousSessions.length === 0 && (
                <p className="text-muted-foreground">No obvious suspicious sessions.</p>
              )}
              {suspiciousSessions.length > 0 && (
                <ul className="space-y-1">
                  {suspiciousSessions.slice(0, 5).map(([sessionId, count]) => (
                    <li key={sessionId} className="flex flex-col">
                      <span className="font-mono text-[10px] truncate">{sessionId}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {count} page views in recent window
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1 font-medium">Blocked IPs</p>
              {activeBlockedIps.length === 0 && (
                <p className="text-muted-foreground">No active blocked IPs.</p>
              )}
              {activeBlockedIps.length > 0 && (
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {activeBlockedIps.slice(0, 8).map((ip) => (
                    <li key={ip.id} className="flex flex-col">
                      <span className="font-mono text-[10px] truncate">{ip.ip}</span>
                      {ip.reason && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {ip.reason}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
        <nav className="flex flex-col gap-1">
          {views.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${{
                true: "bg-slate-800 text-slate-50",
                false: "text-slate-300 hover:bg-slate-800/60 hover:text-slate-50",
              }[String(activeView === view.id) as "true" | "false"]}`}
            >
              <span>{view.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 space-y-6">{content}</main>
    </div>
  );
};

export default SuperAdminDashboard;
