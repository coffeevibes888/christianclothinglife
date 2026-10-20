/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import {
  Menu as MenuIcon,
  X,
  LayoutDashboard,
  Globe2,
  Activity,
  Users,
  MousePointerClick,
  ShoppingBag,
  ShoppingCart,
  Search as SearchIcon,
  MonitorSmartphone,
  ShieldAlert,
  Megaphone,
  Target,
  type LucideIcon,
} from "lucide-react";

const views = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "traffic", label: "Traffic", icon: Globe2 },
  { id: "engagement", label: "Engagement", icon: Activity },
  { id: "users", label: "Users & Sessions", icon: Users },
  { id: "behavior", label: "User Behavior", icon: MousePointerClick },
  { id: "clicks", label: "Clicks & Heatmap", icon: Target },
  { id: "products", label: "Product Analytics", icon: ShoppingBag },
  { id: "cart", label: "Cart & Checkout", icon: ShoppingCart },
  { id: "search", label: "Search Analytics", icon: SearchIcon },
  { id: "device", label: "Device & Technical", icon: MonitorSmartphone },
  { id: "security", label: "Security & Fraud", icon: ShieldAlert },
  { id: "marketing", label: "Marketing Attribution", icon: Megaphone },
] as const satisfies ReadonlyArray<{ id: string; label: string; icon: LucideIcon }>;

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
  clickAnalytics?: any;
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

// Stat card component — matches the Property Flow HQ super-admin design.
function StatCard({
  label,
  value,
  subtext,
  variant = "default",
  onClick,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "default" | "gradient" | "success" | "warning" | "danger";
  onClick?: () => void;
}) {
  const baseClasses = "rounded-xl border p-4";
  const variantClasses = {
    default: "bg-slate-900/60 border-white/10",
    gradient: "bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 border-transparent",
    success: "bg-emerald-950/50 border-emerald-800/50",
    warning: "bg-amber-950/50 border-amber-800/50",
    danger: "bg-red-950/50 border-red-800/50",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${onClick ? "cursor-pointer transition-colors hover:border-white/30" : ""}`}
      onClick={onClick}
    >
      <p className={`text-xs mb-1 ${variant === "gradient" ? "text-white/80" : "text-slate-400"}`}>{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtext && <p className={`text-xs mt-1 ${variant === "gradient" ? "text-white/70" : "text-slate-500"}`}>{subtext}</p>}
    </div>
  );
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
  clickAnalytics,
}: SuperAdminDashboardProps) => {
  const [activeView, setActiveView] = useState<(typeof views)[number]["id"]>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heatmapPath, setHeatmapPath] = useState<string | null>(null);
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

  const handleBlockIp = (ip: string, reason: string) => {
    startBlockingIp(async () => {
      try {
        const res = await fetch("/api/super-admin/block-ip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ip, reason }),
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

  const tableWrap = "rounded-xl bg-slate-900/60 border border-white/10 overflow-hidden";
  const tableWrapScroll = "rounded-xl bg-slate-900/60 border border-white/10 overflow-x-auto";

  // Overview Content
  const overviewContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Super Admin Dashboard</h1>
        <p className="text-sm text-slate-400">Platform overview for {userEmail}</p>
      </div>

      {currentUser && (
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-600 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Current Session</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-xs text-white/70">Name</p>
              <p className="font-medium text-white">{currentUser.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Email</p>
              <p className="font-medium text-white truncate">{currentUser.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Role</p>
              <p className="font-medium text-white">{currentUser.role || "user"}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Phone</p>
              <p className="font-medium text-white">{currentUser.phoneNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Verified</p>
              <p className="font-medium text-white">{currentUser.phoneVerified ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">User ID</p>
              <p className="font-mono text-xs text-white truncate">{currentUser.id}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Store Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(summary.totalSales._sum.totalPrice?.toString() || 0)}
            variant="gradient"
          />
          <StatCard label="Total Sales" value={formatNumber(summary.ordersCount)} subtext="Orders" />
          <StatCard label="Total Customers" value={formatNumber(summary.usersCount)} subtext="Active users" />
          <StatCard label="Total Products" value={formatNumber(summary.productsCount)} subtext="SKUs" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Traffic Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Page Views" value={formatNumber(totalEvents)} variant="gradient" />
          <StatCard label="Unique Visitors" value={formatNumber(visitorsCount)} />
          <StatCard
            label="Avg Views / Visitor"
            value={visitorsCount > 0 ? (totalEvents / visitorsCount).toFixed(2) : "0.00"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Top Pages</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Page</TableHead>
                  <TableHead className="text-right text-slate-400">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-slate-500">No traffic data yet.</TableCell></TableRow>
                ) : topPages.map((p: TopPage) => (
                  <TableRow key={p.path} className="border-white/5">
                    <TableCell className="text-white">{p.path}</TableCell>
                    <TableCell className="text-right text-slate-300">{p._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Top Countries</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Country</TableHead>
                  <TableHead className="text-right text-slate-400">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-slate-500">No geo data yet.</TableCell></TableRow>
                ) : countries.map((c: CountryStat, idx: number) => (
                  <TableRow key={`${c.country ?? "Unknown"}-${idx}`} className="border-white/5">
                    <TableCell className="text-white">{c.country ?? "Unknown"}</TableCell>
                    <TableCell className="text-right text-slate-300">{c._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">Recent Paid Orders</h2>
          <Link href="/admin/orders" className="text-xs text-cyan-300 underline-offset-4 hover:underline">
            View all orders
          </Link>
        </div>
        <div className={tableWrapScroll}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">Buyer</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Total</TableHead>
                <TableHead className="text-right text-slate-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.latestSales.slice(0, 8).map((order: LatestSale) => (
                <TableRow key={order.id} className="border-white/5">
                  <TableCell className="text-white">{order?.user?.name || "Deleted User"}</TableCell>
                  <TableCell className="text-slate-300">{formatDateTime(new Date(order.createdAt)).dateOnly}</TableCell>
                  <TableCell className="text-slate-300">{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/order/${order.id}`} className="text-xs font-medium text-cyan-300 hover:underline">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  // Traffic Content
  const trafficContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Traffic Analytics</h1>
        <p className="text-sm text-slate-400">Monitor visitor activity and page views</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Online Now" value={formatNumber(currentOnlineVisitors)} variant="gradient" />
        <StatCard
          label="Views Today"
          value={formatNumber(eventsToday)}
          onClick={() => setActiveTrafficDetail((prev) => (prev === "today" ? null : "today"))}
        />
        <StatCard
          label="Views Yesterday"
          value={formatNumber(eventsYesterday)}
          onClick={() => setActiveTrafficDetail((prev) => (prev === "yesterday" ? null : "yesterday"))}
        />
        <StatCard
          label="Last 7 Days"
          value={formatNumber(eventsLast7Days)}
          onClick={() => setActiveTrafficDetail((prev) => (prev === "last7" ? null : "last7"))}
        />
      </div>

      {activeTrafficDetail && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">
            {activeTrafficDetail === "today" && "Today's Page Views"}
            {activeTrafficDetail === "yesterday" && "Yesterday's Page Views"}
            {activeTrafficDetail === "last7" && "Last 7 Days Page Views"}
          </h2>
          <div className={tableWrapScroll}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">When</TableHead>
                  <TableHead className="text-slate-400">Session</TableHead>
                  <TableHead className="text-slate-400">Path</TableHead>
                  <TableHead className="text-slate-400">Location</TableHead>
                  <TableHead className="text-slate-400">OS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trafficDetailEvents.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-slate-500">No events found.</TableCell></TableRow>
                ) : trafficDetailEvents.map((ev) => (
                  <TableRow key={ev.id} className="border-white/5">
                    <TableCell className="text-slate-300 text-sm">{formatDateTime(new Date(ev.createdAt)).dateTime}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-400 truncate max-w-[120px]">{ev.sessionCartId}</TableCell>
                    <TableCell className="text-white">{ev.path}</TableCell>
                    <TableCell className="text-slate-300">{[ev.city, ev.region, ev.country].filter(Boolean).join(", ") || "Unknown"}</TableCell>
                    <TableCell className="text-slate-300">{parseOS(ev.userAgent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Top Pages</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Page</TableHead>
                  <TableHead className="text-right text-slate-400">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-slate-500">No data.</TableCell></TableRow>
                ) : topPages.map((p: TopPage) => (
                  <TableRow key={p.path} className="border-white/5">
                    <TableCell className="text-white">{p.path}</TableCell>
                    <TableCell className="text-right text-slate-300">{p._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Top Countries</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Country</TableHead>
                  <TableHead className="text-right text-slate-400">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-slate-500">No data.</TableCell></TableRow>
                ) : countries.map((c: CountryStat, idx: number) => (
                  <TableRow key={`${c.country ?? "Unknown"}-${idx}`} className="border-white/5">
                    <TableCell className="text-white">{c.country ?? "Unknown"}</TableCell>
                    <TableCell className="text-right text-slate-300">{c._count._all}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );

  // Engagement Content
  const engagementContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Engagement</h1>
        <p className="text-sm text-slate-400">User engagement and session metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Average Session Length" value={formatDuration(averageSessionDurationMs)} variant="gradient" />
        <StatCard
          label="Avg Views / Visitor"
          value={visitorsCount > 0 ? (totalEvents / visitorsCount).toFixed(2) : "0.00"}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        <div className={`${tableWrapScroll} max-h-[32rem] overflow-y-auto`}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">When</TableHead>
                <TableHead className="text-slate-400">Session</TableHead>
                <TableHead className="text-slate-400">Path</TableHead>
                <TableHead className="text-slate-400">Location</TableHead>
                <TableHead className="text-slate-400">OS</TableHead>
                <TableHead className="text-slate-400">IP</TableHead>
                <TableHead className="text-right text-slate-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-slate-500">No recent activity yet.</TableCell></TableRow>
              ) : recentEvents.map((ev: AnalyticsEvent) => (
                <TableRow key={ev.id} className="border-white/5">
                  <TableCell className="text-slate-300 text-sm whitespace-nowrap">{formatDateTime(new Date(ev.createdAt)).dateTime}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-400 truncate max-w-[120px]">{ev.sessionCartId}</TableCell>
                  <TableCell className="text-white">{ev.path}</TableCell>
                  <TableCell className="text-slate-300">{[ev.city, ev.region, ev.country].filter(Boolean).join(", ") || "Unknown"}</TableCell>
                  <TableCell className="text-slate-300">{parseOS(ev.userAgent)}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-400 truncate max-w-[120px]">{ev.ip || "Unknown"}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      disabled={!ev.ip || isBlockingIp}
                      onClick={() => {
                        if (!ev.ip) return;
                        handleBlockIp(ev.ip, `Blocked from Recent Activity for ${ev.path}`);
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
      </div>
    </div>
  );

  // Users Content
  const usersContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Users &amp; Sessions</h1>
        <p className="text-sm text-slate-400">User statistics and device breakdown</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Online Now" value={formatNumber(currentOnlineVisitors)} variant="gradient" />
        <StatCard label="Unique Visitors" value={formatNumber(visitorsCount)} />
        <StatCard label="Avg Session" value={formatDuration(averageSessionDurationMs)} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Devices</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Desktop" value={formatNumber(devices?.desktop ?? 0)} />
          <StatCard label="Mobile" value={formatNumber(devices?.mobile ?? 0)} />
          <StatCard label="Tablet" value={formatNumber(devices?.tablet ?? 0)} />
          <StatCard label="Other" value={formatNumber(devices?.other ?? 0)} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Operating Systems (Recent)</h2>
        <div className={`${tableWrap} max-w-md`}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">OS</TableHead>
                <TableHead className="text-right text-slate-400">Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {osBreakdown.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-slate-500">No data.</TableCell></TableRow>
              ) : osBreakdown.map(([os, count]) => (
                <TableRow key={os} className="border-white/5">
                  <TableCell className="text-white">{os}</TableCell>
                  <TableCell className="text-right text-slate-300">{formatNumber(count)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  // User Behavior Content
  const behaviorContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">User Behavior Analytics</h1>
        <p className="text-sm text-slate-400">How visitors move through the store</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Avg Time on Page" value={`${(behaviorMetrics?.avgTimeOnPage as number) || 0}s`} variant="gradient" />
        <StatCard
          label="Avg Pages / Session"
          value={((behaviorMetrics?.avgPagesPerSession as number) || 0).toFixed?.(1) || 0}
        />
        <StatCard label="Scroll Engagement" value="—" subtext="Users scrolling to various depths" />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Top Exit Pages</h2>
        <div className={tableWrap}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">Page</TableHead>
                <TableHead className="text-right text-slate-400">Exits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(behaviorMetrics?.topExitPages as any[])?.length ? (
                (behaviorMetrics?.topExitPages as any[]).map((page: any, i: number) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell className="font-mono text-xs text-white">{page.path}</TableCell>
                    <TableCell className="text-right text-slate-300">{page._count}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={2} className="text-slate-500">No data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  // Product Analytics Content
  const productsContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Product Analytics</h1>
        <p className="text-sm text-slate-400">Most popular products and engagement</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Top Viewed Products (Last 7 Days)</h2>
        <div className={tableWrapScroll}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">Product</TableHead>
                <TableHead className="text-right text-slate-400">Views</TableHead>
                <TableHead className="text-right text-slate-400">Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productAnalytics && productAnalytics.length > 0 ? (
                productAnalytics.map((product: any) => (
                  <TableRow key={product.productId} className="border-white/5">
                    <TableCell className="text-white">
                      <Link href={`/product/${product.slug}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-slate-300">{product.views}</TableCell>
                    <TableCell className="text-right text-slate-300">{product.avgDuration}s</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-slate-500">No product data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  // Cart Analytics Content
  const cartContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Cart &amp; Checkout Analytics</h1>
        <p className="text-sm text-slate-400">Conversion and cart activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Checkouts Started" value={formatNumber((cartAnalytics?.checkoutStarted as number) || 0)} variant="gradient" />
        <div className="rounded-xl bg-slate-900/60 border border-white/10 p-4">
          <p className="text-xs text-slate-400 mb-3">Cart Events</p>
          <div className="space-y-2 text-sm">
            {(cartAnalytics?.eventBreakdown as any[])?.length ? (
              (cartAnalytics?.eventBreakdown as any[]).map((event: any) => (
                <div key={event.eventType} className="flex justify-between">
                  <span className="capitalize text-slate-300">{event.eventType}</span>
                  <span className="font-bold text-white">{event._count}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No cart events yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Search Analytics Content
  const searchContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Search Analytics</h1>
        <p className="text-sm text-slate-400">What visitors are looking for</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Top Searches</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Query</TableHead>
                  <TableHead className="text-right text-slate-400">Count</TableHead>
                  <TableHead className="text-right text-slate-400">Avg Results</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(searchAnalytics?.topSearches as any[])?.length ? (
                  (searchAnalytics?.topSearches as any[]).slice(0, 10).map((search: any, i: number) => (
                    <TableRow key={i} className="border-white/5">
                      <TableCell className="font-mono text-xs text-white">{search.query}</TableCell>
                      <TableCell className="text-right text-slate-300">{search._count}</TableCell>
                      <TableCell className="text-right text-slate-300">{Math.round(search._avg.resultsCount || 0)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="text-slate-500">No search data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Zero Result Searches</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Query</TableHead>
                  <TableHead className="text-right text-slate-400">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(searchAnalytics?.zeroResultSearches as any[])?.length ? (
                  (searchAnalytics?.zeroResultSearches as any[]).map((search: any, i: number) => (
                    <TableRow key={i} className="border-white/5">
                      <TableCell className="font-mono text-xs text-white">{search.query}</TableCell>
                      <TableCell className="text-right text-slate-300">{search._count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={2} className="text-slate-500">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );

  // Device Analytics Content
  const deviceContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Device &amp; Technical Analytics</h1>
        <p className="text-sm text-slate-400">Hardware, resolution, and language breakdown</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-900/60 border border-white/10 p-4">
          <p className="text-xs text-slate-400 mb-3">Device Breakdown</p>
          <div className="space-y-2 text-sm">
            {(deviceAnalytics?.deviceBreakdown as any[])?.length ? (
              (deviceAnalytics?.deviceBreakdown as any[]).map((device: any) => (
                <div key={device.deviceType} className="flex justify-between">
                  <span className="capitalize text-slate-300">{device.deviceType || "Unknown"}</span>
                  <span className="font-bold text-white">{device._count}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No data.</p>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-slate-900/60 border border-white/10 p-4">
          <p className="text-xs text-slate-400 mb-3">Top Screen Resolutions</p>
          <div className="space-y-2 text-sm">
            {(deviceAnalytics?.screenResolutions as any[])?.length ? (
              (deviceAnalytics?.screenResolutions as any[]).slice(0, 5).map((res: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="font-mono text-xs text-slate-300">{res.screenWidth} x {res.screenHeight}</span>
                  <span className="font-bold text-white">{res._count}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No data.</p>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-slate-900/60 border border-white/10 p-4">
          <p className="text-xs text-slate-400 mb-3">Browser Languages</p>
          <div className="space-y-2 text-sm">
            {(deviceAnalytics?.browserLanguages as any[])?.length ? (
              (deviceAnalytics?.browserLanguages as any[]).slice(0, 5).map((lang: any) => (
                <div key={lang.browserLang} className="flex justify-between">
                  <span className="text-slate-300">{lang.browserLang}</span>
                  <span className="font-bold text-white">{lang._count}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">No data.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Security Content
  const securityContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Security &amp; Fraud Detection</h1>
        <p className="text-sm text-slate-400">Monitor threats, suspicious IPs, and failed logins</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Security Events (Last 7 Days)</h2>
          <div className="rounded-xl bg-slate-900/60 border border-white/10 p-4 space-y-2">
            {(securityMetrics?.eventBreakdown as any[])?.length ? (
              (securityMetrics?.eventBreakdown as any[]).map((event: any) => (
                <div key={event.eventType} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/40 px-3 py-2">
                  <span className="font-medium capitalize text-slate-300">{event.eventType.replace(/_/g, " ")}</span>
                  <span className="text-xl font-bold text-white">{event._count}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No security events recorded.</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Suspicious IPs</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">IP Address</TableHead>
                  <TableHead className="text-right text-slate-400">Events</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(securityMetrics?.suspiciousIPs as any[])?.length ? (
                  (securityMetrics?.suspiciousIPs as any[]).map((ip: any) => (
                    <TableRow key={ip.ip} className="border-white/5">
                      <TableCell className="font-mono text-xs text-white">{ip.ip}</TableCell>
                      <TableCell className="text-right text-slate-300">{ip._count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={2} className="text-slate-500">No suspicious IPs</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Recent Failed Logins</h2>
        <div className={tableWrapScroll}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">When</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">IP</TableHead>
                <TableHead className="text-slate-400">Location</TableHead>
                <TableHead className="text-right text-slate-400">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(securityMetrics?.recentFailedLogins as any[])?.length ? (
                (securityMetrics?.recentFailedLogins as any[]).map((ev: any) => (
                  <TableRow key={ev.id} className="border-white/5">
                    <TableCell className="whitespace-nowrap text-slate-300 text-sm">{formatDateTime(new Date(ev.createdAt)).dateTime}</TableCell>
                    <TableCell className="text-xs text-white">{ev.email || "Unknown"}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">{ev.ip}</TableCell>
                    <TableCell className="text-xs text-slate-300">{ev.country || "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        disabled={!ev.ip || ev.ip === "unknown" || isBlockingIp}
                        onClick={() => {
                          if (!ev.ip || ev.ip === "unknown") return;
                          handleBlockIp(ev.ip, `Blocked from failed login (${ev.email || "unknown"})`);
                        }}
                        className="inline-flex items-center rounded-md bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Block IP
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-slate-500">No failed logins recorded.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  // Marketing Attribution Content
  const marketingContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Marketing Attribution</h1>
        <p className="text-sm text-slate-400">Where your traffic and campaigns come from</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">UTM Sources (Last 30 Days)</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Source</TableHead>
                  <TableHead className="text-right text-slate-400">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(marketingAttribution?.utmSources as any[])?.length ? (
                  (marketingAttribution?.utmSources as any[]).map((source: any) => (
                    <TableRow key={source.utmSource} className="border-white/5">
                      <TableCell className="font-medium text-white">{source.utmSource}</TableCell>
                      <TableCell className="text-right text-slate-300">{source._count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={2} className="text-slate-500">No UTM data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Top Campaigns</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Campaign</TableHead>
                  <TableHead className="text-slate-400">Medium</TableHead>
                  <TableHead className="text-right text-slate-400">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(marketingAttribution?.utmCampaigns as any[])?.length ? (
                  (marketingAttribution?.utmCampaigns as any[]).slice(0, 10).map((campaign: any, i: number) => (
                    <TableRow key={i} className="border-white/5">
                      <TableCell className="text-xs text-white">{campaign.utmCampaign}</TableCell>
                      <TableCell className="text-xs text-slate-300">{campaign.utmMedium}</TableCell>
                      <TableCell className="text-right text-slate-300">{campaign._count}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={3} className="text-slate-500">No campaign data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Top Referrers</h2>
        <div className={tableWrapScroll}>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-slate-400">Referrer</TableHead>
                <TableHead className="text-right text-slate-400">Visits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(marketingAttribution?.topReferrers as any[])?.length ? (
                (marketingAttribution?.topReferrers as any[]).slice(0, 15).map((ref: any, i: number) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell className="font-mono text-xs text-white truncate max-w-md">{ref.referrer}</TableCell>
                    <TableCell className="text-right text-slate-300">{ref._count}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={2} className="text-slate-500">No referrer data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  // Clicks & Heatmap Content
  const clickTopPages: { path: string; count: number }[] = clickAnalytics?.topPages ?? [];
  const clickTopElements: { el: string; count: number }[] = clickAnalytics?.topElements ?? [];
  const allClicks: Array<{
    path: string;
    x: number;
    y: number;
    dw: number;
    dh: number;
    el: string | null;
    text: string | null;
    href: string | null;
    createdAt: string | Date;
  }> = clickAnalytics?.clicks ?? [];

  const selectedClickPath = heatmapPath ?? clickTopPages[0]?.path ?? null;
  const heatmapPoints = allClicks.filter((c) => c.path === selectedClickPath);
  const repDw = heatmapPoints.reduce((m, c) => Math.max(m, c.dw || 0), 0) || 1440;
  const repDh = heatmapPoints.reduce((m, c) => Math.max(m, c.dh || 0), 0) || 2400;

  const clicksContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Clicks &amp; Heatmap</h1>
        <p className="text-sm text-slate-400">Where visitors are clicking across the store (last 7 days)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Clicks" value={formatNumber(clickAnalytics?.totalClicks ?? 0)} variant="gradient" />
        <StatCard label="Pages With Clicks" value={formatNumber(clickTopPages.length)} />
        <StatCard label="Tracked Click Points" value={formatNumber(allClicks.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Most Clicked Pages</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Page</TableHead>
                  <TableHead className="text-right text-slate-400">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clickTopPages.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-slate-500">No click data yet.</TableCell></TableRow>
                ) : clickTopPages.map((p) => (
                  <TableRow
                    key={p.path}
                    className={`border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedClickPath === p.path ? "bg-white/10" : ""}`}
                    onClick={() => setHeatmapPath(p.path)}
                  >
                    <TableCell className="font-mono text-xs text-white">{p.path}</TableCell>
                    <TableCell className="text-right text-slate-300">{formatNumber(p.count)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Most Clicked Elements</h2>
          <div className={tableWrap}>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-slate-400">Element</TableHead>
                  <TableHead className="text-right text-slate-400">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clickTopElements.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-slate-500">No element data yet.</TableCell></TableRow>
                ) : clickTopElements.map((e) => (
                  <TableRow key={e.el} className="border-white/5">
                    <TableCell className="font-mono text-xs text-white truncate max-w-[220px]">{e.el}</TableCell>
                    <TableCell className="text-right text-slate-300">{formatNumber(e.count)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">
            Click Map{selectedClickPath ? `: ${selectedClickPath}` : ""}
          </h2>
          <p className="text-xs text-slate-400">{heatmapPoints.length} clicks on this page</p>
        </div>
        {selectedClickPath ? (
          <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
            <div
              className="relative mx-auto w-full max-w-md overflow-hidden rounded-md bg-slate-950/80 ring-1 ring-white/10"
              style={{ aspectRatio: `${repDw} / ${repDh}` }}
            >
              {heatmapPoints.map((c, i) => {
                const left = c.dw ? (c.x / c.dw) * 100 : 50;
                const top = c.dh ? (c.y / c.dh) * 100 : 50;
                return (
                  <span
                    key={i}
                    title={c.el || c.text || "click"}
                    className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/50 ring-1 ring-red-400/70"
                    style={{ left: `${left}%`, top: `${top}%` }}
                  />
                );
              })}
              {heatmapPoints.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                  No clicks recorded for this page yet.
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Dots are placed by click position relative to the full page. Select a page on the left to switch maps.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No clicks recorded yet.</p>
        )}
      </div>
    </div>
  );

  let content = overviewContent;
  if (activeView === "traffic") content = trafficContent;
  else if (activeView === "engagement") content = engagementContent;
  else if (activeView === "users") content = usersContent;
  else if (activeView === "behavior") content = behaviorContent;
  else if (activeView === "clicks") content = clicksContent;
  else if (activeView === "products") content = productsContent;
  else if (activeView === "cart") content = cartContent;
  else if (activeView === "search") content = searchContent;
  else if (activeView === "device") content = deviceContent;
  else if (activeView === "security") content = securityContent;
  else if (activeView === "marketing") content = marketingContent;

  const renderNav = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1 overflow-y-auto">
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => {
              setActiveView(view.id);
              onNavigate?.();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              isActive
                ? "bg-white/20 text-white font-medium"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{view.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const utilityPanel = (
    <div className="pt-4 border-t border-white/10 space-y-4">
      <button
        type="button"
        onClick={handleClearStatistics}
        disabled={isClearingStats}
        className="w-full px-3 py-2.5 rounded-lg bg-red-500/80 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50 transition"
      >
        {isClearingStats ? "Clearing..." : "Clear All Statistics"}
      </button>

      <div className="rounded-xl bg-blue-800/40 border border-white/10 p-3 space-y-3 text-xs">
        <div>
          <p className="text-white font-semibold mb-1">Security &amp; Monitoring</p>
          <p className="text-white/50 text-[11px]">Watch for scraping, bots, and blocked IPs.</p>
        </div>
        <div>
          <p className="mb-1 font-medium text-white/80">Suspicious Sessions</p>
          {suspiciousSessions.length === 0 ? (
            <p className="text-white/50">No obvious suspicious sessions.</p>
          ) : (
            <ul className="space-y-1">
              {suspiciousSessions.slice(0, 5).map(([sessionId, count]) => (
                <li key={sessionId} className="flex flex-col">
                  <span className="font-mono text-[10px] truncate text-white/80">{sessionId}</span>
                  <span className="text-[10px] text-white/50">{count} page views in recent window</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-1 font-medium text-white/80">Blocked IPs</p>
          {activeBlockedIps.length === 0 ? (
            <p className="text-white/50">No active blocked IPs.</p>
          ) : (
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {activeBlockedIps.slice(0, 8).map((ip) => (
                <li key={ip.id} className="flex flex-col">
                  <span className="font-mono text-[10px] truncate text-white/80">{ip.ip}</span>
                  {ip.reason && <span className="text-[10px] text-white/50 truncate">{ip.reason}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  const activeLabel = views.find((v) => v.id === activeView)?.label ?? "Overview";

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-blue-700 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Viewing</p>
            <p className="truncate text-sm font-semibold text-white">{activeLabel}</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/10 text-white"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute top-0 left-0 right-0 bg-blue-700 border-b border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h1 className="text-lg font-semibold text-white">Super Admin</h1>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-white/10 text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-1">
              {renderNav(() => setMobileMenuOpen(false))}
              {utilityPanel}
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-blue-700 border-r border-white/10 p-4 sticky top-0">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Super Admin</h1>
            <p className="text-xs text-white/60 mt-1">Store Monitoring</p>
          </div>
          {renderNav()}
          {utilityPanel}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-blue-700 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{content}</div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
