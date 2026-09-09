import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from './Button';

interface CarouselProps {
  title: string;
  emoji?: string; // Kept for API compatibility but won't render
  children?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  viewAllLink?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  title, children, className, isLoading, error, onRetry, viewAllLink
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const childrenCount = React.Children.count(children);
  if (!isLoading && !error && childrenCount === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const amount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - amount : scrollLeft + amount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={cn('flex flex-col gap-3 w-full max-w-[1440px] mx-auto group/carousel', className)}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-[var(--color-primary)] rounded-full" />
          <h2 className="font-heading text-[17px] sm:text-[19px] font-bold text-[var(--color-text-primary)] tracking-wide">{title}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link to={viewAllLink} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-[13px] font-medium transition-colors mr-2">
              Xem tất cả &rarr;
            </Link>
          )}

          {/* Desktop Arrow Controls */}
          <div className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => scroll('left')}
              className="p-1.5 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white transition-all active:scale-90"
              aria-label="Cuộn sang trái"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-1.5 rounded-full bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white transition-all active:scale-90"
              aria-label="Cuộn sang phải"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Scroll Area ── */}
      <div className="relative w-full">
        <div 
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 lg:px-8 pb-3"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {error ? (
            <div className="w-full flex flex-col items-center justify-center p-8 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] gap-3">
              <p className="text-[14px]">Không thể tải nội dung.</p>
              {onRetry && (
                <button onClick={onRetry} className="text-[var(--color-primary)] text-[13px] font-medium hover:underline">
                  Thử lại
                </button>
              )}
            </div>
          ) : isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="snap-start flex flex-col gap-2 w-[135px] sm:w-[155px] md:w-[170px] shrink-0">
                <div className="w-full aspect-[2/3] bg-[var(--color-surface)] animate-skeleton rounded-[var(--radius-card)]" />
                <div className="h-3.5 bg-[var(--color-surface)] animate-skeleton rounded w-3/4 mt-1" />
                <div className="h-3 bg-[var(--color-surface)] animate-skeleton rounded w-1/2" />
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
