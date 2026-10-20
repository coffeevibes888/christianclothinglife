'use client';

import { useState, useTransition } from 'react';
import { updateFulfillmentSettings } from '@/lib/actions/settings.actions';
import { syncProductsFromPrintful } from '@/lib/actions/product.actions';
import { useToast } from '@/hooks/use-toast';

type Diagnostics = {
  configuredStoreId: string | null;
  stores: { id: number; name: string; type?: string }[] | { error?: string };
  productsReturnedByToken:
    | { id: number; name: string; variants: number }[]
    | { error?: string };
};

export default function PrintfulSettingsCard({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isSaving, startSaving] = useTransition();
  const [isSyncing, startSyncing] = useTransition();
  const [isChecking, startChecking] = useTransition();
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
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

  const handleCheck = () => {
    startChecking(async () => {
      try {
        const res = await fetch('/api/printful/diagnostics', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.success) {
          toast({
            variant: 'destructive',
            description: data.message || 'Could not reach Printful.',
          });
          setDiagnostics(null);
          return;
        }
        setDiagnostics({
          configuredStoreId: data.configuredStoreId,
          stores: data.stores,
          productsReturnedByToken: data.productsReturnedByToken,
        });
      } catch {
        toast({ variant: 'destructive', description: 'Could not reach Printful.' });
        setDiagnostics(null);
      }
    });
  };

  const storesArray = Array.isArray(diagnostics?.stores) ? diagnostics?.stores : null;
  const productsArray = Array.isArray(diagnostics?.productsReturnedByToken)
    ? diagnostics?.productsReturnedByToken
    : null;

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
        <button
          type="button"
          onClick={handleCheck}
          disabled={isChecking}
          className="rounded-lg border border-white/20 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {isChecking ? 'Checking…' : 'Check connection'}
        </button>
        <span className="text-xs text-slate-400">
          Check which Printful store this site is connected to before syncing.
        </span>
      </div>

      {diagnostics && (
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Configured store id (PRINTFUL_STORE_ID)
            </p>
            <p className="font-mono text-white">
              {diagnostics.configuredStoreId || 'not set'}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Stores this token can access
            </p>
            {storesArray ? (
              storesArray.length ? (
                <ul className="mt-1 space-y-1">
                  {storesArray.map((s) => (
                    <li key={s.id} className="text-white">
                      <span className="font-mono text-cyan-300">{s.id}</span> — {s.name}
                      {s.type ? (
                        <span className="text-slate-500"> ({s.type})</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">No stores returned.</p>
              )
            ) : (
              <p className="text-amber-300">
                {(diagnostics.stores as { error?: string }).error ||
                  'Could not list stores (token may be store-level).'}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Products this token currently returns
            </p>
            {productsArray ? (
              productsArray.length ? (
                <ul className="mt-1 space-y-1">
                  {productsArray.map((p) => (
                    <li key={p.id} className="text-white">
                      {p.name}{' '}
                      <span className="text-slate-500">({p.variants} variants)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">No products in this store.</p>
              )
            ) : (
              <p className="text-amber-300">
                {(diagnostics.productsReturnedByToken as { error?: string }).error ||
                  'Could not list products.'}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500">
            If the products above aren&apos;t from the store you expect, set
            PRINTFUL_STORE_ID to the correct store id (or use a token created
            inside that store), then redeploy and sync again.
          </p>
        </div>
      )}
    </div>
  );
}
