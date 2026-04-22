import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { cn } from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CarouselProps {
  title: string;
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -440 : 440, behavior: 'smooth' });
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8">
        <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-3">
          {viewAllLink && (
            <Link to={viewAllLink} className="text-sm text-[#d692ff] hover:text-[#af25fe] transition-colors hidden sm:block">
              Xem tất cả →
            </Link>
          )}
          <div className="hidden md:flex gap-1.5">
            <button onClick={() => scroll('left')}
              className="p-1.5 rounded-full bg-white/8 hover:bg-white/15 transition-colors text-white/60 hover:text-white border border-white/10"
              aria-label="Scroll left">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button onClick={() => scroll('right')}
              className="p-1.5 rounded-full bg-white/8 hover:bg-white/15 transition-colors text-white/60 hover:text-white border border-white/10"
              aria-label="Scroll right">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scroll track */}
      <div ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide snap-x px-4 md:px-8 pb-4 movie-row"
        style={{ scrollbarWidth: 'none' }}>
        {error ? (
          <div className="w-full flex flex-col items-center justify-center p-8 bg-[#11131a] rounded-2xl border border-white/8 text-white/50 gap-4">
            <p>Không thể tải danh sách phim.</p>
            {onRetry && (
              <button onClick={onRetry} className="px-4 py-2 rounded-lg bg-[#d692ff]/15 text-[#d692ff] text-sm font-semibold hover:bg-[#d692ff]/25 transition-colors">
                Thử lại
              </button>
            )}
          </div>
        ) : isLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="snap-start flex flex-col gap-2 w-[150px] md:w-[180px] shrink-0">
              <div className="w-full aspect-[2/3] bg-[#1d1f27] animate-pulse rounded-2xl" />
              <div className="h-4 bg-[#1d1f27] animate-pulse rounded w-3/4" />
              <div className="h-3 bg-[#1d1f27] animate-pulse rounded w-1/2" />
            </div>
          ))
        ) : (
          React.Children.map(children, child => (
            <div className="snap-start">{child}</div>
          ))
        )}
      </div>
    </div>
  );
};
