"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function EnhancedTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageStartTime = useRef<number>(Date.now());
  const hasTrackedView = useRef(false);
  const scrollTracked = useRef({ 25: false, 50: false, 75: false, 100: false });

  useEffect(() => {
    // Reset on route change
    pageStartTime.current = Date.now();
    hasTrackedView.current = false;
    scrollTracked.current = { 25: false, 50: false, 75: false, 100: false };

    const trackPageView = async () => {
      if (hasTrackedView.current) return;
      hasTrackedView.current = true;

      const sessionCartId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sessionCartId="))
        ?.split("=")[1];

      if (!sessionCartId) return;

      // Extract UTM parameters
      const utmSource = searchParams.get("utm_source");
      const utmMedium = searchParams.get("utm_medium");
      const utmCampaign = searchParams.get("utm_campaign");
      const utmContent = searchParams.get("utm_content");
      const utmTerm = searchParams.get("utm_term");

      // Device detection
      const getDeviceType = () => {
        const width = window.innerWidth;
        if (width < 768) return "mobile";
        if (width < 1024) return "tablet";
        return "desktop";
      };

      const trackingData = {
        sessionCartId,
        path: pathname,
        referrer: document.referrer || null,
        eventType: "pageview",
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        deviceType: getDeviceType(),
        browserLang: navigator.language,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
      };

      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(trackingData),
        });
      } catch (error) {
        console.error("Analytics tracking error:", error);
      }
    };

    trackPageView();

    // Track scroll depth
    const handleScroll = () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      // Track at 25%, 50%, 75%, 100% milestones
      const milestones = [25, 50, 75, 100] as const;
      milestones.forEach((milestone) => {
        if (scrollPercentage >= milestone && !scrollTracked.current[milestone]) {
          scrollTracked.current[milestone] = true;
          trackScrollEvent(milestone);
        }
      });
    };

    const trackScrollEvent = async (depth: number) => {
      const sessionCartId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sessionCartId="))
        ?.split("=")[1];

      if (!sessionCartId) return;

      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionCartId,
            path: pathname,
            eventType: "scroll",
            scrollDepth: depth,
          }),
        });
      } catch (error) {
        console.error("Scroll tracking error:", error);
      }
    };

    // Track time on page when user leaves
    const trackTimeOnPage = async () => {
      const timeSpent = Math.round((Date.now() - pageStartTime.current) / 1000);
      const sessionCartId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sessionCartId="))
        ?.split("=")[1];

      if (!sessionCartId || timeSpent < 1) return;

      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionCartId,
            path: pathname,
            eventType: "exit",
            timeOnPage: timeSpent,
          }),
        });
      } catch (error) {
        console.error("Exit tracking error:", error);
      }
    };

    // Track clicks (what + where) for the super-admin click map / heatmap
    const describeElement = (el: HTMLElement) => {
      const parts: string[] = [el.tagName.toLowerCase()];
      if (el.id) parts.push(`#${el.id}`);
      if (typeof el.className === "string" && el.className.trim()) {
        parts.push(`.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`);
      }
      return parts.join("");
    };

    const trackClick = (event: MouseEvent) => {
      const sessionCartId = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sessionCartId="))
        ?.split("=")[1];

      if (!sessionCartId) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const doc = document.documentElement;
      const anchor = target.closest("a");

      const payload = {
        sessionCartId,
        path: pathname,
        eventType: "click",
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        eventData: {
          x: Math.round(event.pageX),
          y: Math.round(event.pageY),
          vw: window.innerWidth,
          vh: window.innerHeight,
          dw: doc.scrollWidth,
          dh: doc.scrollHeight,
          el: describeElement(target),
          text: (target.innerText || "").trim().slice(0, 60) || null,
          href: anchor?.getAttribute("href") || null,
        },
      };

      try {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // ignore
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", trackTimeOnPage);
    window.addEventListener("click", trackClick, { passive: true, capture: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", trackTimeOnPage);
      window.removeEventListener("click", trackClick, { capture: true });
    };
  }, [pathname, searchParams]);

  return null;
}
