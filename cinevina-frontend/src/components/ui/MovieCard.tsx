import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, StarIcon } from '@heroicons/react/24/solid';
import { cn } from './Button';

const FALLBACK_IMG = '/fallback-poster.svg';

function getQualityBadgeClass(quality?: string): string {
  const q = (quality || '').toUpperCase();
  if (q === '4K' || q === 'UHD' || q === 'FHD' || q === '1080P' || q === 'HD') {
    return 'bg-[var(--color-secondary)]/20 backdrop-blur-md text-[var(--color-secondary)] border border-[var(--color-secondary)]/30';
  }
  return 'bg-[var(--color-surface-elevated)]/90 backdrop-blur-md text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]';
}

function useImgSrc(posterUrl?: string, thumbUrl?: string) {
  const [src, setSrc] = React.useState(posterUrl || thumbUrl || FALLBACK_IMG);
  const [failedOnce, setFailedOnce] = React.useState(false);

  React.useEffect(() => {
    setSrc(posterUrl || thumbUrl || FALLBACK_IMG);
    setFailedOnce(false);
  }, [posterUrl, thumbUrl]);

  const handleError = () => {
    if (!failedOnce && thumbUrl && src !== thumbUrl) {
      setFailedOnce(true);
      setSrc(thumbUrl);
    } else {
      setSrc(FALLBACK_IMG);
    }
  };

  return { src, handleError };
}

export interface MovieCardProps {
  name?: string;
  seriesId?: string;
  seasonNumber?: number;
  posterUrl?: string;
  thumbUrl?: string;
  quality?: string;
  lang?: string;
  year?: number;
  rating?: number | string;
  description?: string;
  slug?: string;
  className?: string;
  isLoading?: boolean;
  isCinema?: boolean;
  isStreamable?: boolean;
  trailerUrl?: string;
  episodeCurrent?: string;
  totalEpisodes?: string | number;
}

export const MovieCard: React.FC<MovieCardProps> = (props) => {
  const {
    name,

    posterUrl,
    thumbUrl,
    quality,
    year,
    rating,
    slug,
    className,
    isLoading = false,
    episodeCurrent,
    totalEpisodes,
    isStreamable = true,
  } = props;

  const { src: imgSrc, handleError } = useImgSrc(posterUrl, thumbUrl);

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-2 w-[160px] shrink-0', className)}>
        <div className="w-full aspect-[2/3] bg-[var(--color-surface)] animate-skeleton rounded-[var(--radius-card)]" />
        <div className="h-3.5 bg-[var(--color-surface)] animate-skeleton rounded w-3/4 mt-1" />
        <div className="h-3 bg-[var(--color-surface)] animate-skeleton rounded w-1/2" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 w-[135px] sm:w-[155px] md:w-[170px] shrink-0 cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-1 active:scale-[0.98]',
        className
      )}
    >
      <Link 
        aria-label={name} 
        to={`/phim/${slug}`} 
        tabIndex={0} 
        className="block relative aspect-[2/3] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface)] shadow-md group-hover:shadow-[var(--shadow-card)] transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={handleError}
          loading="lazy"
          decoding="async"
        />

        {/* Bottom Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070A12]/90 via-[#070A12]/20 to-transparent pointer-events-none" />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        
        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-[42px] h-[42px] rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <PlayIcon className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>

        {/* Top Right Series Badge */}
        {(episodeCurrent || totalEpisodes) && (
          <div className="absolute top-2 right-2 z-10 pointer-events-none">
            <span className="bg-[var(--color-surface-elevated)]/90 backdrop-blur-md text-[var(--color-text-muted)] text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] border border-[var(--color-border-subtle)] uppercase">
              BỘ
            </span>
          </div>
        )}

        {/* Top Left Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
          {quality && quality !== 'UNKNOWN' && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[6px] shadow-sm ${getQualityBadgeClass(quality)}`}>
              {quality}
            </span>
          )}
        </div>

        {/* Bottom Right Episode */}
        <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
          {!isStreamable ? (
            <div className="bg-[var(--color-surface)]/90 backdrop-blur-md text-[var(--color-text-primary)] text-[10px] font-bold px-1.5 py-0.5 rounded-[6px] border border-[var(--color-border-subtle)]">
              Sắp ra mắt
            </div>
          ) : (episodeCurrent || totalEpisodes) ? (
            <div className="bg-[var(--color-secondary)] text-[#070A12] text-[10px] font-bold px-1.5 py-0.5 rounded-[6px]">
              {episodeCurrent || (String(totalEpisodes).includes('/') ? `Tập ${String(totalEpisodes).split('/')[0]}` : totalEpisodes)}
            </div>
          ) : null}
        </div>

        {/* Bottom Left Rating */}
        {rating && rating !== '' && rating !== '0' && (
          <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
            <div className="flex items-center gap-1 text-[var(--color-rating)] text-[11px] font-bold drop-shadow-md">
              <StarIcon className="w-3.5 h-3.5" />
              <span>{rating === 'N/A' ? '' : rating}</span>
            </div>
          </div>
        )}
      </Link>

      <Link aria-label={name} to={`/phim/${slug}`} className="px-0.5 flex flex-col gap-0.5">
        <h3 className="font-body text-[13px] sm:text-[14px] font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-[1.35] group-hover:text-[var(--color-primary)] transition-colors">
          {name}
        </h3>
        {year && <span className="text-[11px] sm:text-[12px] text-[var(--color-text-muted)]">{year}</span>}
      </Link>
    </div>
  );
};
