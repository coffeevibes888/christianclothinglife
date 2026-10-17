import Link from 'next/link';
import Image from 'next/image';
import { APP_NAME } from '@/lib/constants';
import { Instagram, Facebook, Mail } from 'lucide-react';

const shopLinks = [
  { href: '/search?category=T-Shirts', label: 'T-Shirts' },
  { href: '/search?category=Hoodies', label: 'Hoodies' },
  { href: '/search?category=Coffee Mugs', label: 'Coffee Mugs' },
  { href: '/search?category=Seasonal', label: 'Seasonal' },
  { href: '/search?category=Christian Humor', label: 'Christian Humor' },
  { href: '/search?category=Positive Vibes', label: 'Positive Vibes' },
  { href: '/search', label: 'All Products' },
];

const companyLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

const supportLinks = [
  { href: '/cart', label: 'Your Cart' },
  { href: '/user/orders', label: 'Order History' },
  { href: '/contact', label: 'Shipping & Returns' },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='mt-20 border-t border-sky-200/70 bg-sky-100/60'>
      <div className='mx-auto max-w-7xl px-6 py-14 md:px-8'>
        <div className='grid gap-10 md:grid-cols-2 lg:grid-cols-5'>
          {/* Brand */}
          <div className='lg:col-span-2'>
            <Link href='/' className='inline-flex items-center'>
              <div className='relative h-16 w-36'>
                <Image
                  src='/images/christianlogo.png'
                  fill
                  className='object-contain object-left'
                  alt={APP_NAME}
                />
              </div>
            </Link>
            <p className='mt-4 max-w-sm text-sm leading-relaxed text-slate-600'>
              Faith-inspired apparel for everyday life. Hoodies, tees, hats, mugs, and more
              designed to help you style your soul and share the message.
            </p>
            <div className='mt-5 flex items-center gap-3'>
              <SocialIcon href='https://instagram.com' label='Instagram'>
                <Instagram size={18} />
              </SocialIcon>
              <SocialIcon href='https://facebook.com' label='Facebook'>
                <Facebook size={18} />
              </SocialIcon>
              <SocialIcon href='/contact' label='Email'>
                <Mail size={18} />
              </SocialIcon>
            </div>
          </div>

          {/* Link columns */}
          <FooterColumn title='Shop' links={shopLinks} />
          <FooterColumn title='Company' links={companyLinks} />
          <FooterColumn title='Support' links={supportLinks} />
        </div>

        <div className='mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row'>
          <p>
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <p className='flex items-center gap-1.5 text-xs'>
            <span className='inline-block h-2 w-2 rounded-full bg-emerald-500' />
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </footer>
  );
};

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) => (
  <div>
    <h3 className='text-sm font-semibold uppercase tracking-wide text-slate-900'>{title}</h3>
    <ul className='mt-4 space-y-2.5'>
      {links.map((link) => (
        <li key={`${title}-${link.label}`}>
          <Link
            href={link.href}
            className='text-sm text-slate-600 transition-colors hover:text-blue-600'
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const SocialIcon = ({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    aria-label={label}
    className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-500 hover:text-blue-600'
  >
    {children}
  </Link>
);

export default Footer;
