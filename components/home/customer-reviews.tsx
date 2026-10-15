'use server';

import { getLatestProductReviews } from '@/lib/actions/review.actions';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import Rating from '@/components/shared/product/rating';
import SectionHeading from './section-heading';

const CustomerReviews = async () => {
  const reviews = await getLatestProductReviews(3);

  const fallback = !reviews.length
    ? [
        {
          id: 'dummy-1',
          title: 'Rocken my everyday vibe',
          description: 'Super comfy and the design gets compliments everywhere I go.',
          rating: 5,
          createdAt: new Date(),
          user: { name: 'Sample Customer', image: null },
          product: { name: 'Signature Hoodie', slug: '' },
        },
        {
          id: 'dummy-2',
          title: 'Perfect gift',
          description: 'Bought this as a gift and they absolutely loved it.',
          rating: 4,
          createdAt: new Date(),
          user: { name: 'Happy Gifter', image: null },
          product: { name: 'Statement Tee', slug: '' },
        },
        {
          id: 'dummy-3',
          title: 'Great quality & fit',
          description: 'Material feels premium and the fit is just right.',
          rating: 5,
          createdAt: new Date(),
          user: { name: 'First Time Buyer', image: null },
          product: { name: 'Everyday Crewneck', slug: '' },
        },
      ]
    : reviews;

  return (
    <section className="relative my-16 py-6">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-300/15 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-5xl px-4 md:px-6 space-y-8">
        <SectionHeading
          eyebrow="Customer Reviews"
          title="What people are saying"
          subtitle="Real words from people wearing the message every day."
        />

        <div className="grid gap-5 md:grid-cols-3">
          {fallback.map((review) => {
            const created = formatDateTime(review.createdAt);
            const userName = review.user?.name || 'Happy Customer';
            const initials = userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <article
                key={review.id}
                className="relative rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 p-5 flex flex-col gap-3 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs font-semibold text-white">
                    {review.user?.image ? (
                      <Image
                        src={review.user.image}
                        alt={userName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">{userName}</span>
                    <span className="text-[11px] text-slate-400">
                      {created.dateOnly} · {created.timeOnly}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Rating value={review.rating} />
                    <span className="uppercase tracking-[0.18em] text-[10px] text-slate-400">
                      {review.product?.name || 'Product'}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-slate-900 line-clamp-2">{review.title}</p>
                  <p className="text-xs text-slate-600 line-clamp-3">{review.description}</p>
                </div>

                <div className="mt-auto pt-2 text-right">
                  {review.product?.slug && (
                    <Link
                      href={`/product/${review.product.slug}`}
                      className="text-[11px] text-blue-600 hover:text-blue-700 underline"
                    >
                      View product
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;
