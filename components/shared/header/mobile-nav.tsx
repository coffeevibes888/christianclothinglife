'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu as MenuIcon, X, SearchIcon } from 'lucide-react';

type CategoryNode = {
  category: string;
  count: number;
  subCategories: string[];
};

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const MobileNav = ({
  categories,
  isSuperAdmin,
}: {
  categories: CategoryNode[];
  isSuperAdmin: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label='Open menu'
        className='inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50'
      >
        <MenuIcon size={20} />
      </button>

      {/* Overlay */}
      <div
        onClick={close}
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className='flex items-center justify-between border-b border-slate-100 px-5 py-4'>
          <span className='text-sm font-semibold uppercase tracking-[0.2em] text-slate-500'>
            Menu
          </span>
          <button
            type='button'
            onClick={close}
            aria-label='Close menu'
            className='inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100'
          >
            <X size={20} />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto px-5 py-5'>
          {/* Search */}
          <form action='/search' method='GET' className='mb-6'>
            <div className='flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20'>
              <SearchIcon size={16} className='text-slate-400' />
              <input
                name='q'
                type='text'
                placeholder='Search products...'
                className='w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400'
              />
            </div>
          </form>

          {/* Primary links */}
          <nav className='flex flex-col'>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className='rounded-lg px-2 py-2.5 text-base font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900'
              >
                {link.label}
              </Link>
            ))}
            {isSuperAdmin && (
              <Link
                href='/super-admin'
                onClick={close}
                className='rounded-lg px-2 py-2.5 text-base font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900'
              >
                Monitoring
              </Link>
            )}
          </nav>

          {/* Shop categories */}
          {categories.length > 0 && (
            <div className='mt-6 border-t border-slate-100 pt-5'>
              <p className='mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>
                Shop
              </p>
              <div className='flex flex-col'>
                {categories.map((cat) => (
                  <Link
                    key={cat.category}
                    href={`/search?category=${encodeURIComponent(cat.category)}`}
                    onClick={close}
                    className='flex items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900'
                  >
                    <span>{cat.category}</span>
                    <span className='text-xs text-slate-400'>({cat.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default MobileNav;
