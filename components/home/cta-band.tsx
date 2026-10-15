import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const CtaBand = () => {
  return (
    <section className='py-16'>
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 px-6 py-14 shadow-2xl shadow-indigo-900/30 md:px-16 md:py-20'>
        {/* Ambient light blobs */}
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-3xl' />
          <div className='absolute bottom-0 right-0 h-72 w-72 translate-x-1/4 translate-y-1/4 rounded-full bg-fuchsia-400/25 blur-3xl' />
          <div className='absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/10 blur-3xl' />
        </div>

        <div className='relative mx-auto max-w-2xl text-center'>
          <p className='text-xs font-semibold uppercase tracking-[0.28em] text-white/70'>
            Style your soul
          </p>
          <h2 className='mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl'>
            Wear your faith. Share the message.
          </h2>
          <p className='mx-auto mt-4 max-w-xl text-sm text-white/80 md:text-base'>
            Hoodies, tees, hats, and mugs designed to spark conversation and carry your
            story everywhere you go.
          </p>

          <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Link
              href='/search'
              className='group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-900/30 transition hover:-translate-y-0.5 hover:shadow-xl'
            >
              Shop the Collection
              <ArrowRight
                size={16}
                className='transition-transform duration-300 group-hover:translate-x-1'
              />
            </Link>
            <Link
              href='/about'
              className='inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20'
            >
              Our Story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaBand;
