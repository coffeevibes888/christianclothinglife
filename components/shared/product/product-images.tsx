'use client';
import { useState, useEffect, type MouseEvent } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const ProductImages = ({ 
  images, 
  activeImage, 
  onImageClick,
  colorName,
  productName,
}: { 
  images: string[]; 
  activeImage?: string;
  onImageClick?: (image: string) => void;
  colorName?: string;
  productName?: string;
}) => {
  const [current, setCurrent] = useState(0);

  const baseAlt = productName || 'Product';
  const mainAlt = colorName ? `${baseAlt} — ${colorName}` : baseAlt;

  // Hover-to-zoom: magnify the main image toward the cursor so shoppers can
  // inspect the design detail. Pointer-only (ignored on touch devices).
  const [isZoomed, setIsZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  const handleZoomMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  useEffect(() => {
    const activeIndex = images.findIndex(img => img === activeImage);
    if (activeIndex !== -1) {
      setCurrent(activeIndex);
    }
  }, [activeImage, images]);

  const handleThumbnailChange = (image: string, index: number) => {
    setCurrent(index);
    if (onImageClick) {
      onImageClick(image);
    }
  };

  if (!images.length) return null;

  return (
    <div className='space-y-4'>
      <div
        className='group relative cursor-zoom-in overflow-hidden bg-transparent'
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleZoomMove}
      >
        <Image
          src={activeImage || images[current]}
          alt={mainAlt}
          width={1000}
          height={1000}
          className='h-auto max-h-[520px] w-full bg-transparent object-contain object-center transition-transform duration-200 ease-out'
          style={{
            transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
            transformOrigin: origin,
          }}
        />
        {colorName && (
          <div className='pointer-events-none absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-md backdrop-blur-sm'>
            <span className='text-sm font-medium'>{colorName}</span>
          </div>
        )}
      </div>

      {/* Larger thumbnails that change the main image on hover, with a
          horizontally scrollable strip when there are many. */}
      <div className='flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]'>
        {images.map((image, index) => (
          <button
            type='button'
            key={image}
            onMouseEnter={() => handleThumbnailChange(image, index)}
            onFocus={() => handleThumbnailChange(image, index)}
            onClick={() => handleThumbnailChange(image, index)}
            aria-label={`View image ${index + 1}`}
            className={cn(
              'flex-shrink-0 overflow-hidden rounded-md border bg-transparent transition-colors',
              current === index
                ? 'border-slate-900 ring-1 ring-slate-900'
                : 'border-slate-200 hover:border-slate-500'
            )}
          >
            <Image
              src={image}
              alt={`${baseAlt} thumbnail ${index + 1}`}
              width={80}
              height={80}
              className='h-20 w-20 bg-transparent object-contain'
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;
