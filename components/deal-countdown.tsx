'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';


// Rolling target: end of the current month (23:59:59 on the last day).
// Keeps the "Deal Of The Month" countdown live and prevents a stale
// "Deal Has Ended" state from ever showing on the storefront.
const getTargetDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
};

// Function to calculate the time remaining
const calculateTimeRemaining = (targetDate: Date) => {
  const currentTime = new Date();
  const timeDifference = Math.max(Number(targetDate) - Number(currentTime), 0);
  return {
    days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
    hours: Math.floor(
      (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    ),
    minutes: Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((timeDifference % (1000 * 60)) / 1000),
  };
};

const DealCountdown = () => {
  const [time, setTime] = useState<ReturnType<typeof calculateTimeRemaining>>();

  const photos = [
    { id: 1, label: 'Deal Spotlight', src: '/images/walk3.png' },
    { id: 2, label: 'Christian Clothing Life', src: '/images/walk1.png' },
    { id: 3, label: 'New This Month', src: '/images/walk2.png' },
  ];

  useEffect(() => {
    // Calculate initial time on client
    setTime(calculateTimeRemaining(getTargetDate()));

    const timerInterval = setInterval(() => {
      const newTime = calculateTimeRemaining(getTargetDate());
      setTime(newTime);

      if (
        newTime.days === 0 &&
        newTime.hours === 0 &&
        newTime.minutes === 0 &&
        newTime.seconds === 0
      ) {
        clearInterval(timerInterval);
      }

      return () => clearInterval(timerInterval);
    }, 1000);
  }, []);

  if (!time) {
    return (
      <section className='grid grid-cols-1 md:grid-cols-2 my-20'>
        <div className='flex flex-col gap-2 justify-center'>
          <h3 className='text-3xl font-bold'>Loading Countdown...</h3>
        </div>
      </section>
    );
  }

  if (
    time.days === 0 &&
    time.hours === 0 &&
    time.minutes === 0 &&
    time.seconds === 0
  ) {
    return (
      <section className='grid grid-cols-1 md:grid-cols-2 my-20'>
        <div className='flex flex-col gap-2 justify-center'>
          <h3 className='text-3xl font-bold'>Deal Has Ended</h3>
          <p>
            This deal is no longer available. Check out our latest promotions!
          </p>

          <div className='text-center'>
            <Button asChild>
              <Link href='/search'>View Products</Link>
            </Button>
          </div>
        </div>
        {/* <div className='flex justify-center'>
          <Image
            src='/images/light1.png'
            alt='promotion'
            width={300}
            height={200}
          />
        </div> */}
      </section>
    );
  }

  return (
    <section className='grid grid-cols-1 md:grid-cols-2 my-20 gap-10 items-start'>
      <div className='flex flex-col gap-4 justify-center'>
        <h3 className='text-3xl md:text-4xl font-bold text-slate-900'>Deal Of The Month</h3>
        <p className='text-sm md:text-base text-slate-600'>
          Get ready for a shopping experience like never before with our Deals of the Month! Every purchase comes with
          exclusive perks and offers, making this month a celebration of savvy choices and amazing deals. Don&apos;t miss
          out! 🎁🛒
        </p>
        <p className='text-base md:text-lg font-semibold text-amber-600'>
          Deal of the Month: <span className='line-through text-slate-400'>$24.99</span>{' '}
          <span className='text-emerald-600 font-bold'>Now Only $19.99</span>
        </p>
        <ul className='grid grid-cols-4 divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 overflow-hidden'>
          <StatBox label='Days' value={time.days} />
          <StatBox label='Hours' value={time.hours} />
          <StatBox label='Minutes' value={time.minutes} />
          <StatBox label='Seconds' value={time.seconds} />
        </ul>
        <div className='text-center'>
          <Button asChild>
            <Link href='/product/keep-walking-towards-god'>Buy Now</Link>
          </Button>
        </div>
      </div>

      {/* Deal images */}
      <div className='relative mt-4 md:mt-8'>
        <div className='pointer-events-none absolute inset-0 -z-10 flex items-center justify-center'>
          <div className='h-64 w-64 rounded-full bg-violet-300/40 blur-3xl' />
        </div>

        <div className='mx-auto grid max-w-md grid-cols-2 gap-4'>
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 transition duration-300 hover:-translate-y-1 ${
                index === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-square'
              }`}
            >
              <Image
                src={photo.src}
                alt={photo.label}
                fill
                sizes='(min-width: 768px) 448px, 100vw'
                className='object-cover transition duration-500 group-hover:scale-105'
              />
              <div className='absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 pb-2 pt-6 text-[11px] text-white'>
                <span className='font-medium uppercase tracking-[0.15em]'>{photo.label}</span>
                <span className='text-[10px] text-violet-200'>Limited Time</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <li className='w-full p-4 text-center'>
    <p className='bg-gradient-to-br from-blue-600 to-violet-600 bg-clip-text text-3xl font-bold tabular-nums text-transparent'>
      {String(value).padStart(2, '0')}
    </p>
    <p className='mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500'>
      {label}
    </p>
  </li>
);

export default DealCountdown;
