'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Hero() {
  return (
    <section className="relative left-1/2 -mt-5 w-screen -translate-x-1/2 overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Light-blue cloud rising from behind the content */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center">
          <div className="relative h-64 w-[48rem] max-w-[95vw]">
            <div className="absolute bottom-0 left-1/2 h-40 w-[48rem] max-w-[95vw] -translate-x-1/2 rounded-[100%] bg-sky-200/70 blur-[64px]" />
            <div className="absolute bottom-6 left-[16%] h-44 w-72 max-w-[55vw] rounded-full bg-white/90 blur-3xl" />
            <div className="absolute bottom-6 right-[16%] h-44 w-72 max-w-[55vw] rounded-full bg-sky-100 blur-3xl" />
            <div className="absolute bottom-12 left-1/2 h-48 w-80 max-w-[70vw] -translate-x-1/2 rounded-full bg-white blur-3xl" />
          </div>
        </div>

        {/* Animated color accents */}
        <div className="animate-blob absolute left-0 top-6 h-72 w-72 -translate-x-1/4 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="animate-blob absolute right-0 top-16 h-96 w-96 translate-x-1/4 rounded-full bg-fuchsia-400/20 blur-3xl [animation-delay:3s]" />
        <div className="animate-blob absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl [animation-delay:6s]" />
        <div className="animate-blob absolute bottom-8 right-1/4 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl [animation-delay:9s]" />
      </div>

      <div className="relative mx-auto flex min-h-[520px] w-full max-w-7xl flex-col items-center justify-center gap-8 px-6 py-12 md:h-[640px] md:flex-row md:gap-10 md:py-16">
        <div className="flex-1 flex flex-col items-center md:items-start gap-6 justify-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center md:text-left space-y-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 shadow-sm backdrop-blur"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-[11px] text-white">
                &#10013;
              </span>
              <span className="text-xs font-medium tracking-wide text-slate-700">
                Faith-inspired apparel
              </span>
            </motion.div>
            <motion.h1
              className="animate-gradient-x bg-gradient-to-r from-cyan-500 via-violet-500 to-rose-500 bg-clip-text text-5xl font-bold leading-[1.05] tracking-tight text-transparent sm:text-6xl md:text-7xl"
              style={{ fontFamily: 'Helvetica Neue, system-ui' }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: 'easeOut' }}
            >
              Christian
              <br />
              Clothing Life
            </motion.h1>
            <motion.p
              className="text-sm sm:text-lg text-slate-600 max-w-xl mx-auto md:mx-0 font-light"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
            >
              Style your soul and your body will thank you for it.
            </motion.p>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
          >
            <Link href="/search">
              <motion.button
                whileHover={{ scale: 1.05, y: -2, boxShadow: '0 24px 55px rgba(79,70,229,0.45)' }}
                whileTap={{ scale: 0.97, y: 0, boxShadow: '0 14px 30px rgba(79,70,229,0.35)' }}
                className="relative px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 transition-all duration-300 text-sm sm:text-base shadow-[0_16px_40px_rgba(79,70,229,0.4)] overflow-hidden"
              >
                <span className="relative z-10">Shop the Collection</span>
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </Link>
            <Link href="/about">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97, y: 0 }}
                className="px-8 py-3 rounded-full font-semibold text-slate-700 bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:text-slate-900 transition-all duration-300 text-sm sm:text-base"
              >
                Our Story
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            className="flex items-center gap-2 text-sm text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span className="tracking-tight text-amber-400">★★★★★</span>
            <span>Loved by our community of believers</span>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full pt-2">
          <Product3DRotator />
        </div>
      </div>
    </section>
  );
}

function Product3DRotator() {
  const [index, setIndex] = useState(0);

  const products = [
    { src: '/images/christianHero.png', alt: 'Product 1' },
    { src: '/images/christianHero2.png', alt: 'Product 2' },
    { src: '/images/christianHero3.png', alt: 'Product 3' },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % 3);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative w-full max-w-md aspect-square flex items-center justify-center -mt-6 select-none"
      style={{ perspective: '2000px' }}
    >
      {/* Colorful halo behind the product */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[78%] w-[78%] rounded-full bg-gradient-to-br from-cyan-300/50 via-violet-300/40 to-fuchsia-300/50 blur-3xl" />
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <div className="h-[88%] w-[88%] rounded-full border border-dashed border-violet-300/40" />
      </motion.div>
      {products.map((product, i) => {
        const isActive = index === i;

        return (
          <motion.div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85, rotateY: -65 }}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 0.6,
              rotateY: isActive ? 0 : -65,
              zIndex: isActive ? 10 : 0,
            }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
          >
            <motion.div
              className="relative w-full h-full"
              animate={{ rotateY: isActive ? [0, 8, -8, 0] : 0 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
            >
              <Image
                src={product.src}
                alt={product.alt}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 480px, (min-width: 768px) 400px, 80vw"
                className="object-contain drop-shadow-xl select-none"
              />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Apple-style dots */}
      <div className="absolute bottom-3 flex gap-3 z-20">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            type="button"
            aria-label={`Show product ${i + 1}`}
            className={`min-h-[28px] min-w-[28px] rounded-full border border-black/20 flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/90 focus-visible:ring-offset-slate-900 ${
              index === i ? 'bg-black' : 'bg-gray-300/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}