import type { Metadata } from 'next';
import { buildMetadata, breadcrumbSchema, faqSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/json-ld';
import { FAQS, groupFaqsByCategory } from '@/lib/faq';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = buildMetadata({
  title: 'FAQ',
  description:
    'Answers to common questions about orders, shipping, returns, sizing, payments, and your account.',
  path: '/faq',
  keywords: [
    'FAQ',
    'frequently asked questions',
    'shipping times',
    'return policy',
    'sizing guide',
    'order tracking',
    APP_NAME,
  ],
});

const FaqPage = () => {
  const groups = groupFaqsByCategory();

  return (
    <main className="w-full min-h-screen py-10">
      <JsonLd
        data={[
          faqSchema(FAQS.map((f) => ({ question: f.question, answer: f.answer }))),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
        ]}
      />

      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        <header className="space-y-2 mb-10 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-blue-600">Help Center</p>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-600">
            Quick answers about orders, shipping, returns, sizing, and more. Still need a hand? Chat with
            Grace using the button in the corner, or reach us on the{' '}
            <a href="/contact" className="text-blue-600 underline underline-offset-2">
              Contact page
            </a>
            .
          </p>
        </header>

        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.category}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="h-5 w-1.5 rounded-full bg-gradient-to-b from-blue-600 to-violet-600" />
                {group.category}
              </h2>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <details
                    key={item.id}
                    className="group rounded-2xl border border-slate-200 bg-white/70 p-4 md:p-5 shadow-sm transition-colors open:border-blue-200 open:bg-blue-50/40"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm md:text-base font-medium text-slate-800">
                      {item.question}
                      <span className="shrink-0 text-blue-600 transition-transform group-open:rotate-45 text-xl leading-none">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
};

export default FaqPage;
