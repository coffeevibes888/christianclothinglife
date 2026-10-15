import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, ChevronDown } from 'lucide-react';
import { getCategoryTree } from '@/lib/actions/product.actions';
import { getMyCart } from '@/lib/actions/cart.actions';
import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import UserButton from './user-button';
import NotificationBell from './notification-bell';
import MobileNav from './mobile-nav';
import HeaderShell from './header-shell';

const Header = async () => {
  const [categories, cart, session] = await Promise.all([
    getCategoryTree().catch(() => []),
    getMyCart().catch(() => null),
    auth().catch(() => null),
  ]);

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.qty, 0) || 0;
  const isAdmin = session?.user?.role === 'admin';
  const isSuperAdmin = session?.user?.role === 'superAdmin';

  return (
    <HeaderShell>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:h-20 md:px-8'>
        {/* Logo */}
        <Link href='/' className='flex shrink-0 items-center'>
          <div className='relative h-12 w-28 md:h-16 md:w-40'>
            <Image
              src='/images/christianlogo.png'
              fill
              className='object-contain'
              alt='Christian Clothing Life'
              priority
            />
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className='hidden items-center gap-1 md:flex'>
          <NavLink href='/'>Home</NavLink>

          {/* Shop mega menu */}
          <div className='group relative'>
            <button className='flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900'>
              Shop
              <ChevronDown size={15} className='transition-transform group-hover:rotate-180' />
            </button>
            {categories.length > 0 && (
              <div className='invisible absolute left-0 top-full z-50 min-w-[240px] pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100'>
                <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/5'>
                  {categories.map((cat) => (
                    <Link
                      key={cat.category}
                      href={`/search?category=${encodeURIComponent(cat.category)}`}
                      className='flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-600'
                    >
                      <span>{cat.category}</span>
                      <span className='text-xs text-slate-400'>{cat.count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <NavLink href='/about'>About</NavLink>
          <NavLink href='/contact'>Contact</NavLink>
          {isSuperAdmin && <NavLink href='/super-admin'>Monitoring</NavLink>}
        </nav>

        {/* Desktop actions */}
        <div className='hidden items-center gap-2 md:flex'>
          <NotificationBell isAdmin={isAdmin} />
          <CartButton count={cartItemCount} />
          <UserButton />
        </div>

        {/* Mobile actions */}
        <div className='flex items-center gap-1.5 md:hidden'>
          <CartButton count={cartItemCount} compact />
          <UserButton />
          <MobileNav categories={categories} isSuperAdmin={isSuperAdmin} />
        </div>
      </div>
    </HeaderShell>
  );
};

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className='rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900'
  >
    {children}
  </Link>
);

const CartButton = ({ count, compact }: { count: number; compact?: boolean }) => (
  <Link
    href='/cart'
    aria-label='Cart'
    className={`relative inline-flex items-center gap-1.5 rounded-lg font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${
      compact ? 'h-10 w-10 justify-center' : 'px-3 py-2 text-sm'
    }`}
  >
    <span className='relative'>
      <ShoppingCart size={20} />
      {count > 0 && (
        <Badge
          variant='destructive'
          className='absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]'
        >
          {count}
        </Badge>
      )}
    </span>
    {!compact && <span>Cart</span>}
  </Link>
);

export default Header;
