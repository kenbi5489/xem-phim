import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { cn } from './Button';

interface CarouselProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  viewAllLink?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  title,
  subtitle,
  badge,
  children,
  className,
  isLoading,
  error,
  onRetry,
  viewAllLink,
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
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className={cn('flex flex-col gap-3.5 w-full max-w-[1440px] mx-auto overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-4">
        {/* Left: Indicator + Titles */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-1 sm:w-1.5 h-5 sm:h-6 bg-indigo-600 rounded-full shrink-0" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-heading text-[15px] sm:text-[19px] font-black text-slate-900 dark:text-white tracking-tight truncate">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-[13px] text-slate-600 dark:text-slate-400 font-medium truncate sm:whitespace-normal">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: View All & Arrow controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="inline-flex items-center gap-1 text-[12px] sm:text-[13px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors whitespace-nowrap py-1 shrink-0"
            >
              <span>Xem tất cả</span>
              <ArrowRightIcon className="w-3.5 h-3.5 shrink-0" />
            </Link>
          )}

          {/* Desktop Arrow Controls */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95"
              aria-label="Cuộn sang trái"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95"
              aria-label="Cuộn sang phải"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Area */}
      <div className="relative w-full">
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x px-3 sm:px-6 lg:px-8 pb-3 pt-1"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {error ? (
            <div className="w-full flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 gap-3">
              <p className="text-[14px]">Không thể tải nội dung.</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Thử lại
                </button>
              )}
            </div>
          ) : isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="snap-start flex flex-col gap-2 w-[140px] sm:w-[165px] md:w-[185px] shrink-0">
                <div className="w-full aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-3/4 mt-1" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-1/2" />
              </div>
            ))
          ) : (
            children
          )}
        </div>
      </div>
    </section>
  );
};
