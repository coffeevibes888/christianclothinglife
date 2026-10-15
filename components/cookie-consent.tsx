"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Cookie, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
};

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always true
  analytics: false,
  advertising: false,
  functional: false,
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show banner after 1 second for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        setPreferences(JSON.parse(consent));
      } catch {
        // Invalid consent data, show banner
        setShowBanner(true);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);

    // Trigger analytics if consent given
    if (prefs.analytics) {
      window.dispatchEvent(new Event("cookie-consent-granted"));
    }
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      advertising: true,
      functional: true,
    });
  };

  const rejectAll = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      advertising: false,
      functional: false,
    });
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-5 duration-500">
        <Card className="max-w-4xl mx-auto border-2 shadow-2xl">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-4">
              <Cookie className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">We Value Your Privacy</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We use cookies and similar technologies to enhance your browsing
                      experience, analyze site traffic, personalize content and ads, and
                      prevent fraud and malicious activity. This includes capturing your IP
                      address, geolocation data (country, region, city), device information,
                      and browsing behavior.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={rejectAll}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={acceptAll} size="sm" className="gap-2">
                    Accept All
                  </Button>
                  <Button
                    onClick={rejectAll}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    Reject All
                  </Button>
                  <Button
                    onClick={() => setShowSettings(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Customize
                  </Button>
                  <a
                    href="/privacy"
                    className="text-xs text-muted-foreground underline self-center ml-2"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Manage your cookie and data collection preferences. You can change these
              settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Label className="font-semibold">Necessary Cookies</Label>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Required
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Essential cookies required for the website to function properly. These
                  include session management, security, and basic site functionality.
                  Cannot be disabled.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="font-semibold mb-2 block">Analytics Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how visitors interact with our website by collecting
                  and reporting information anonymously. Includes IP address, geolocation
                  (country, region, city), device type, browser, pages viewed, and time
                  spent on site.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked: boolean) =>
                  setPreferences((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="font-semibold mb-2 block">Advertising Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Used to deliver relevant advertisements and track ad campaign
                  performance. May share data with third-party advertising partners to
                  show you personalized content across different websites.
                </p>
              </div>
              <Switch
                checked={preferences.advertising}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, advertising: checked }))
                }
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="font-semibold mb-2 block">Functional Cookies</Label>
                <p className="text-sm text-muted-foreground">
                  Enable enhanced functionality and personalization, such as remembering
                  your preferences, login state, and customized settings. May include
                  third-party services like chat widgets and video players.
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked: boolean) =>
                  setPreferences((prev) => ({ ...prev, functional: checked }))
                }
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Complete Data Collection List:</h4>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="font-medium text-xs mb-1">Location & Identity</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• IP Address</li>
                    <li>• Geolocation (Country, Region, City)</li>
                    <li>• Session & User IDs</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-xs mb-1">Device & Technical</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Device Type (Mobile/Desktop/Tablet)</li>
                    <li>• Screen Resolution</li>
                    <li>• Browser & Operating System</li>
                    <li>• Browser Language</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-xs mb-1">Behavior Tracking</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Pages Viewed & Time on Page</li>
                    <li>• Scroll Depth (25%, 50%, 75%, 100%)</li>
                    <li>• Click Events & Buttons</li>
                    <li>• Exit Pages</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-xs mb-1">E-commerce Activity</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Product Views & Duration</li>
                    <li>• Cart Actions (Add, Remove, Abandon)</li>
                    <li>• Search Queries</li>
                    <li>• Checkout Events</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-xs mb-1">Marketing Attribution</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• UTM Parameters (Source, Medium, Campaign)</li>
                    <li>• Referral URLs</li>
                    <li>• Affiliate & Discount Codes</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-xs mb-1">Security & Fraud</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Failed Login Attempts</li>
                    <li>• Suspicious Activity Patterns</li>
                    <li>• Bot Detection Signals</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={saveCustom} className="flex-1">
              Save Preferences
            </Button>
            <Button onClick={acceptAll} variant="outline" className="flex-1">
              Accept All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
