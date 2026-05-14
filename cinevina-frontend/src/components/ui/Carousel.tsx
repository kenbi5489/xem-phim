import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CarouselProps {
  title: string;
  emoji?: string;
  children?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  viewAllLink?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  title, emoji, children, className, isLoading, error, onRetry, viewAllLink
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [children, isLoading]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth > 1024 ? 800 : window.innerWidth > 768 ? 600 : 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={cn('flex flex-col gap-6 w-full max-w-full overflow-hidden', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-0 md:px-0 group/header">
        <div className="flex items-center gap-3 relative">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {emoji && <span className="text-xl drop-shadow-sm">{emoji}</span>}
              <h2 className="font-display text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h2>
            </div>
            <div className="h-0.5 w-10 bg-primary rounded-full mt-1.5 opacity-80" />
          </div>
        </div>
        
        {viewAllLink && (
          <Link to={viewAllLink} className="text-white/60 hover:text-white text-[12px] font-semibold uppercase tracking-widest flex items-center gap-1 transition-colors group">
            Tất cả 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        )}
      </div>

      {/* ── Scroll Area ── */}
      <div className="relative group/carousel px-0 md:-mx-8 md:px-8">
        {/* Navigation Arrows */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-primary hover:scale-110 shadow-xl flex items-center justify-center"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        )}
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-primary hover:scale-110 shadow-xl flex items-center justify-center"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        )}

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x pb-6 w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {error ? (
            <div className="w-full flex flex-col items-center justify-center p-12 bg-surface-container rounded-2xl border border-white/5 text-white/40 gap-4">
              <span className="text-3xl">⚠️</span>
              <p className="font-medium text-sm">Không thể tải nội dung.</p>
              {onRetry && (
                <button onClick={onRetry} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                  THỬ LẠI
                </button>
              )}
            </div>
          ) : isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="snap-start flex flex-col gap-3 w-[150px] md:w-[200px] shrink-0">
                <div className="w-full aspect-[2/3] bg-surface-container-highest animate-pulse rounded-2xl" />
                <div className="flex flex-col gap-2">
                  <div className="h-3.5 bg-surface-container-highest animate-pulse rounded-full w-3/4" />
                  <div className="h-2.5 bg-surface-container-highest animate-pulse rounded-full w-1/2" />
                </div>
              </div>
            ))
          ) : (
            React.Children.map(children, child => (
              <div className="snap-start shrink-0">{child}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
