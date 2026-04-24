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
  badge?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  title, emoji, children, className, isLoading, error, onRetry, viewAllLink, badge
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
    <div className={cn('flex flex-col gap-8', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-0 md:px-0 group/header">
        <div className="flex items-center gap-4 relative">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shadow-lg border border-white/5">
            {emoji ? <span className="text-xl drop-shadow-lg">{emoji}</span> : <span className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic text-gradient-primary">{title}</h2>
              {badge && (
                <span className="hidden sm:inline-block bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(175,37,254,0.4)]">
                  {badge}
                </span>
              )}
            </div>
            <div className="h-1 w-12 bg-gradient-to-r from-primary to-transparent rounded-full mt-1" />
          </div>
        </div>
        
        {viewAllLink && (
          <Link to={viewAllLink} className="btn-vibrant !px-5 !py-2 !text-[10px] !rounded-lg uppercase tracking-widest flex items-center gap-1 group">
            Tất cả 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        )}
      </div>

      {/* ── Scroll Area ── */}
      <div className="relative group/carousel -mx-4 md:-mx-8 px-4 md:px-8">
        {/* Navigation Arrows */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full glass-premium border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-primary hover:scale-110 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full glass-premium border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-primary hover:scale-110 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 md:gap-7 overflow-x-auto scrollbar-hide snap-x pb-8 touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {error ? (
            <div className="w-full flex flex-col items-center justify-center p-16 bg-surface-container rounded-[32px] border border-white/5 text-white/40 gap-5">
              <span className="text-4xl">⚠️</span>
              <p className="font-bold text-lg">Không thể tải nội dung.</p>
              {onRetry && (
                <button onClick={onRetry} className="btn-vibrant !text-xs">
                  THỬ LẠI
                </button>
              )}
            </div>
          ) : isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="snap-start flex flex-col gap-4 w-[160px] md:w-[210px] shrink-0">
                <div className="w-full aspect-[2/3] bg-surface-container-highest animate-pulse rounded-[24px]" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-surface-container-highest animate-pulse rounded-full w-3/4" />
                  <div className="h-3 bg-surface-container-highest animate-pulse rounded-full w-1/2" />
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

