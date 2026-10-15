import type { Metadata } from 'next';
import '@/assets/styles/globals.css';
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from '@/lib/constants';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { ChatWidget } from '@/components/shared/chat-widget';
import { EnhancedTracker } from '@/components/analytics/enhanced-tracker';
import { CookieConsent } from '@/components/cookie-consent';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: {
    template: `%s | Rocken My Vibe`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='bg-white text-slate-900 flex flex-col min-h-screen overflow-x-hidden antialiased'>
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem={false}
          forcedTheme='light'
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <EnhancedTracker />
          </Suspense>
          <div
            className='w-full text-[11px] md:text-xs font-medium tracking-tight flex items-center overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-sm'
            style={{ height: '28px' }}
          >
            <div className='banner-marquee flex items-center gap-6 px-4 text-white whitespace-nowrap'>
              <span>Free shipping over $75 within the US.</span>
              <span className='text-white/70'>|</span>
              <span>Easy 30-day returns on unworn items.</span>
              <span className='text-white/70'>|</span>
              <span>Secure checkout powered by Stripe.</span>
              <span className='text-white/70'>|</span>
              <span>Need help deciding? Chat with us.</span>

              <span className='ml-10'>Free shipping over $75 within the US.</span>
              <span className='text-white/70'>|</span>
              <span>Easy 30-day returns on unworn items.</span>
              <span className='text-white/70'>|</span>
              <span>Secure checkout powered by Stripe.</span>
              <span className='text-white/70'>|</span>
              <span>Need help deciding? Chat with us.</span>
            </div>
          </div>
          {children}
          <Toaster />
          <ChatWidget />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}

