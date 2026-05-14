import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, StarIcon } from '@heroicons/react/24/solid';
import { cn } from './Button';

const FALLBACK_IMG = '/fallback-poster.svg';

/** Returns Tailwind class string for quality badge by level */
function getQualityBadgeClass(quality?: string): string {
  const q = (quality || '').toUpperCase();
  if (q === '4K' || q === 'UHD') {
    return 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black border-0 shadow-[0_0_8px_rgba(234,179,8,0.6)]';
  }
  if (q === 'FHD' || q === '1080P') {
    return 'bg-gradient-to-r from-blue-500 to-blue-400 text-white border-0';
  }
  if (q === 'CAM' || q === 'TS') {
    return 'bg-red-600/80 text-white border-0';
  }
  // Default HD, SD
  return 'bg-black/60 backdrop-blur-md text-white border border-white/10';
}

function useImgSrc(posterUrl?: string, thumbUrl?: string) {
  const [src, setSrc] = React.useState(posterUrl || thumbUrl || FALLBACK_IMG);
  const [failedOnce, setFailedOnce] = React.useState(false);

  // Reset when props change
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
    totalEpisodes,
  } = props;

  const { src: imgSrc, handleError } = useImgSrc(posterUrl, thumbUrl);

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-2 w-full', className)}>
        <div className="w-full aspect-[2/3] bg-white/5 animate-pulse rounded-lg" />
        <div className="h-4 bg-white/5 animate-pulse rounded w-3/4" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 w-full cursor-pointer transition-all duration-300 movie-card-glow',
        className
      )}
    >
      <Link to={`/phim/${slug}`} className="block relative aspect-[2/3] rounded-2xl overflow-hidden bg-surface-container shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background border border-white/5 group-hover:border-primary/30 transition-colors">
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={handleError}
          loading="lazy"
        />

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 animate-shimmer" />
        </div>

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {quality && quality !== 'UNKNOWN' && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow-lg backdrop-blur-md ${getQualityBadgeClass(quality)}`}>
              {quality}
            </span>
          )}
        </div>

        {/* Bottom Episode Badge */}
        {totalEpisodes && (
          <div className="absolute bottom-3 right-3 z-10">
            <div className="bg-primary/90 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-xl border border-white/10">
              {String(totalEpisodes).includes('/') ? `Tập ${String(totalEpisodes).split('/')[0]}` : totalEpisodes}
            </div>
          </div>
        )}

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-[0_0_30px_rgba(175,37,254,0.6)] transform scale-50 group-hover:scale-100 transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)">
            <PlayIcon className="w-8 h-8 ml-1" />
          </div>
        </div>
      </Link>

      <Link to={`/phim/${slug}`} className="px-1 py-1">
        <h3 className="font-display text-[14px] md:text-[15px] font-bold text-white/90 line-clamp-1 group-hover:text-primary transition-colors duration-200 leading-tight">
          {name}
        </h3>
        <div className="flex items-center gap-3 mt-1.5">
          {year ? <span className="text-[12px] text-white/40 font-medium tracking-tight">{year}</span> : null}
          {rating && rating !== '0' && rating !== 0 && (
            <span className="flex items-center gap-1 text-[12px] text-yellow-400 font-bold">
              <StarIcon className="w-3.5 h-3.5" /> {rating}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};
