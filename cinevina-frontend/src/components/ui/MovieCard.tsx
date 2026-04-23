import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, StarIcon } from '@heroicons/react/24/solid';
import { cn } from './Button';

const FALLBACK_IMG = '/fallback-poster.svg';

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
    lang,
    year,
    rating,
    slug,
    className,
    isLoading = false,
    isCinema = false,
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
        'group relative flex flex-col gap-2 w-full cursor-pointer transition-all duration-300',
        className
      )}
    >
      <Link to={`/phim/${slug}`} className="block relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]">
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={handleError}
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isCinema && (
            <span className="bg-red-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xl animate-pulse">
              HOT
            </span>
          )}
          {quality && (
            <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded border border-white/10 uppercase shadow-lg">
              {quality}
            </span>
          )}
        </div>

        {/* Lang Badge - Top Right */}
        {lang && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-lg">
              {lang.includes('Thuyết minh') ? 'T.MINH' : 'VIETSUB'}
            </span>
          </div>
        )}

        {/* Bottom Episode Badge */}
        {totalEpisodes && (
          <div className="absolute bottom-2 right-2 z-10">
            <div className="bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded shadow-xl border border-white/10">
              {String(totalEpisodes).includes('/') ? `Tập ${String(totalEpisodes).split('/')[0]}` : totalEpisodes}
            </div>
          </div>
        )}

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(168,85,247,0.6)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <PlayIcon className="w-6 h-6 ml-0.5" />
          </div>
        </div>
      </Link>

      <Link to={`/phim/${slug}`} className="px-0.5">
        <h3 className="font-display text-[13px] md:text-[14px] font-bold text-white/90 line-clamp-1 group-hover:text-purple-400 transition-colors duration-300">
          {name}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-white/40 font-medium">{year}</span>
          {rating && (
            <span className="flex items-center gap-1 text-[11px] text-yellow-500 font-bold">
              <StarIcon className="w-2.5 h-2.5" /> {rating}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};
