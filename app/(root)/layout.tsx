import Header from '@/components/shared/header';
import Footer from '@/components/footer';
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen flex-col bg-gradient-to-br from-cyan-300/50 via-violet-300/40 to-fuchsia-300/50'>
      <Header />
      <main className='flex-1 wrapper'>{children}</main>
      <Footer />
    </div>
  );
}
