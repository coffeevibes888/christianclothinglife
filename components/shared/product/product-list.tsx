"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "./product-card";
import { Product } from "@/types";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const ProductList = ({
  data,
  title,
  limit,
  viewAllHref,
}: {
  data: Product[];
  title?: string;
  limit?: number;
  viewAllHref?: string;
}) => {
  const shownData = typeof limit === "number" ? data.slice(0, limit) : data;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const cardWidth = 250; // Width of each card
  const gap = 24; // Gap between cards
  const scrollAmount = cardWidth + gap;

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', checkScrollPosition);
      // Initial check after a small delay to ensure DOM is fully rendered
      const timer = setTimeout(checkScrollPosition, 100);
      return () => {
        currentRef.removeEventListener('scroll', checkScrollPosition);
        clearTimeout(timer);
      };
    }
  }, [data]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const isScrollable = shownData.length > 4;

  return (
    <div className="relative w-full py-8">
      <div className="relative mx-auto max-w-7xl px-4">
        {/* Section header */}
        {title && (
          <div className="mb-6 flex items-end justify-between gap-4 px-1">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                {title}
              </h2>
              <div className="h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-violet-600" />
            </div>
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                View all
                <ArrowRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            )}
          </div>
        )}

        {isScrollable ? (
          <div className="relative">
            {/* LEFT ARROW */}
            <button
              onClick={scrollLeft}
              className={`absolute left-1 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition-all duration-200 hover:bg-white hover:text-indigo-600 md:flex ${
                !showLeftArrow ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Edge fades */}
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-sky-50 to-transparent transition-opacity duration-200 ${
                showLeftArrow ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-sky-50 to-transparent transition-opacity duration-200 ${
                showRightArrow ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* SCROLL ROW */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto scroll-smooth px-2 py-4 no-scrollbar sm:gap-6"
              style={{
                scrollBehavior: 'smooth',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {shownData.map((product) => (
                <div
                  key={product.slug}
                  className="w-[160px] flex-shrink-0 sm:w-[190px] md:w-[250px]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* RIGHT ARROW */}
            <button
              onClick={scrollRight}
              className={`absolute right-1 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-lg backdrop-blur transition-all duration-200 hover:bg-white hover:text-indigo-600 md:flex ${
                !showRightArrow ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto px-2 py-4 no-scrollbar sm:gap-6 md:flex-wrap md:overflow-visible">
            {shownData.map((product) => (
              <div
                key={product.slug}
                className="w-[160px] flex-shrink-0 sm:w-[190px] md:w-[250px]"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
