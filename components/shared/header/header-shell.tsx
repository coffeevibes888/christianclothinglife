'use client';

import { useEffect, useState } from 'react';

const HeaderShell = ({ children }: { children: React.ReactNode }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        scrolled
          ? 'border-b border-sky-200/70 bg-sky-50/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      {children}
    </header>
  );
};

export default HeaderShell;
