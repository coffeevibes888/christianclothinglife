import type { Metadata } from 'next';
import { getAllColors } from '@/lib/actions/product.actions';
import { colorNameToHex } from '@/lib/color-map';

export const metadata: Metadata = {
  title: 'Colors',
};

const AdminColorsPage = async () => {
  const colors = await getAllColors();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Colors</h1>
        <p className="text-sm text-muted-foreground">
          Every color stored from Printful syncs (and manual products). The swatch
          uses Printful&apos;s real hex when available. Product pages only show the
          colors each product actually has.
        </p>
      </div>

      {colors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No colors yet. Connect Printful and run a sync to import them.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{colors.length} colors</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {colors.map((c) => {
              const swatch = c.hex || colorNameToHex(c.name);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span
                    className="h-8 w-8 flex-shrink-0 rounded-full border border-slate-300"
                    style={{ backgroundColor: swatch }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {c.hex || 'no hex'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminColorsPage;
