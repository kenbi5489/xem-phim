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
      const scrollAmount = window.innerWidth > 768 ? 600 : 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 md:px-8 group/header">
        <div className="flex items-center gap-3">
          {emoji && <span className="text-2xl drop-shadow-lg">{emoji}</span>}
          <h2 className="font-display text-xl md:text-2xl font-black text-white tracking-tight">{title}</h2>
          {badge && (
            <span className="hidden sm:inline-block bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
              {badge}
            </span>
          )}
        </div>
        
        {viewAllLink && (
          <Link to={viewAllLink} className="text-xs font-bold text-purple-400 hover:text-white transition-all uppercase tracking-widest flex items-center gap-1 group">
            Xem tất cả 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        )}
      </div>

      {/* ── Scroll Area ── */}
      <div className="relative px-4 md:px-8 group/carousel">
        {/* Navigation Arrows */}
        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-10 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/60 border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-purple-600 hover:scale-110 shadow-[0_0_20px_rgba(0,0,0,0.5)] hidden md:flex"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-10 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/60 border border-white/10 text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-purple-600 hover:scale-110 shadow-[0_0_20px_rgba(0,0,0,0.5)] hidden md:flex"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x pb-6 touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {error ? (
            <div className="w-full flex flex-col items-center justify-center p-12 bg-[#11131a] rounded-2xl border border-white/5 text-white/40 gap-4">
              <p className="font-medium">Không thể tải nội dung.</p>
              {onRetry && (
                <button onClick={onRetry} className="px-6 py-2 rounded-full bg-purple-600/20 text-purple-400 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all border border-purple-600/30">
                  THỬ LẠI
                </button>
              )}
            </div>
          ) : isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="snap-start flex flex-col gap-3 w-[150px] md:w-[185px] shrink-0">
                <div className="w-full aspect-[2/3] bg-[#1d1f27] animate-pulse rounded-xl" />
                <div className="h-4 bg-[#1d1f27] animate-pulse rounded-md w-3/4" />
                <div className="h-3 bg-[#1d1f27] animate-pulse rounded-md w-1/2" />
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
