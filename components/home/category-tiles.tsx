import Link from 'next/link';
import { Shirt, Layers, Coffee, Gift, Smile, ArrowRight } from 'lucide-react';
import SectionHeading from './section-heading';

const collections = [
  {
    label: 'T-Shirts',
    description: 'Faith-forward tees for every day',
    href: '/search?category=T-Shirts',
    icon: Shirt,
    gradient: 'from-blue-600 via-blue-500 to-indigo-600',
  },
  {
    label: 'Hoodies',
    description: 'Cozy, bold, and full of purpose',
    href: '/search?category=Hoodies',
    icon: Layers,
    gradient: 'from-indigo-600 via-violet-500 to-violet-600',
  },
  {
    label: 'Coffee Mugs',
    description: 'Start the morning with the Word',
    href: '/search?category=Coffee Mugs',
    icon: Coffee,
    gradient: 'from-sky-600 via-blue-500 to-blue-700',
  },
  {
    label: 'Seasonal',
    description: 'Holiday & limited-time pieces',
    href: '/search?category=Seasonal',
    icon: Gift,
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-600',
  },
  {
    label: 'Christian Humor',
    description: 'Faith with a sense of humor',
    href: '/search?category=Christian Humor',
    icon: Smile,
    gradient: 'from-violet-600 via-fuchsia-500 to-fuchsia-600',
  },
];

const CategoryTiles = () => {
  return (
    <section className='relative py-16'>
      {/* Ambient background glow */}
      <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute left-1/4 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-400/20 blur-3xl' />
        <div className='absolute right-1/4 top-20 h-72 w-72 translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl' />
      </div>

      <SectionHeading
        eyebrow='Shop by Collection'
        title='Find your vibe'
        subtitle='Faith-inspired apparel sorted by the message that speaks to you.'
      />

      <div className='mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        {collections.map(({ label, description, href, icon: Icon, gradient }, i) => (
          <Link
            key={label}
            href={href}
            className={`group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 shadow-xl shadow-slate-900/10 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-slate-900/20 ${
              i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''
            }`}
          >
            {/* Glass highlight */}
            <div className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl transition-opacity duration-300 group-hover:opacity-80' />

            <div className='relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm'>
              <Icon size={24} />
            </div>

            <div className='relative'>
              <h3 className='text-xl font-bold text-white drop-shadow-sm'>{label}</h3>
              <p className='mt-1 text-sm text-white/80'>{description}</p>
              <span className='mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white'>
                Shop now
                <ArrowRight
                  size={16}
                  className='transition-transform duration-300 group-hover:translate-x-1'
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryTiles;
