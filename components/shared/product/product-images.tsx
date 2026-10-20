'use client';
import { useState, useEffect } from 'react';
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
      <div className='relative'>
        <Image
          src={activeImage || images[current]}
          alt={mainAlt}
          width={1000}
          height={1000}
          className='min-h-[300px] object-cover object-center'
        />
        {colorName && (
          <div className='absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-md backdrop-blur-sm'>
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
              'flex-shrink-0 overflow-hidden rounded-md border transition-colors',
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
              className='h-20 w-20 object-cover'
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;
