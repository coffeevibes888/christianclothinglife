'use client';

import { useState, useTransition } from 'react';
import { updateFulfillmentSettings } from '@/lib/actions/settings.actions';
import { syncProductsFromPrintful } from '@/lib/actions/product.actions';
import { useToast } from '@/hooks/use-toast';

export default function PrintfulSettingsCard({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isSaving, startSaving] = useTransition();
  const [isSyncing, startSyncing] = useTransition();
  const { toast } = useToast();

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next); // optimistic
    startSaving(async () => {
      const res = await updateFulfillmentSettings(next);
      toast({
        variant: res.success ? 'default' : 'destructive',
        description: res.message,
      });
      if (!res.success) setEnabled(!next); // revert on failure
    });
  };

  const handleSync = () => {
    startSyncing(async () => {
      const res = await syncProductsFromPrintful();
      toast({
        variant: res.success ? 'default' : 'destructive',
        description: res.message,
      });
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Fulfillment</h2>
        <p className="text-sm text-slate-400">
          Control how paid orders are fulfilled.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 p-4">
        <div className="min-w-0">
          <p className="font-medium text-white">Printful print-on-demand</p>
          <p className="text-sm text-slate-400">
            {enabled
              ? 'ON — paid orders are sent to Printful automatically for printing and shipping.'
              : 'OFF — you fulfill and ship every order yourself.'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={isSaving}
          onClick={handleToggle}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            enabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {isSyncing ? 'Syncing…' : 'Sync products from Printful'}
        </button>
        <span className="text-xs text-slate-400">
          Pulls your Printful products, variants, colors, and sizes into the store.
        </span>
      </div>
    </div>
  );
}
