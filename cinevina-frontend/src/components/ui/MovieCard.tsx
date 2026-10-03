import React from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, StarIcon } from '@heroicons/react/24/solid';
import { cn } from './Button';

const FALLBACK_IMG = '/fallback-poster.svg';

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
  id?: string;
  name?: string;
  seriesId?: string;
  seasonNumber?: number;
  originalName?: string;
  posterUrl?: string;
  thumbUrl?: string;
  quality?: string;
  lang?: string;
  year?: number;
  rating?: number | string;
  description?: string;
  slug?: string;
  source?: string;
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
    originalName,
    posterUrl,
    thumbUrl,
    quality,
    year,
    lang,
    rating,
    slug,
    source,
    className = '',
    isLoading = false,
    episodeCurrent,
    totalEpisodes,
    isStreamable = true,
  } = props;

  const { src: imgSrc, handleError } = useImgSrc(posterUrl, thumbUrl);

  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-2.5 w-[140px] sm:w-[165px] md:w-[185px] shrink-0", className)}>
        <div className="w-full aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-4/5 mt-1" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-1/2" />
      </div>
    );
  }

  const ratingNum = typeof rating === 'number' ? rating.toFixed(1) : (rating && rating !== 'N/A' ? String(rating) : null);

  const displayEpisode = () => {
    if (!isStreamable) return 'Sắp chiếu';
    const curr = (episodeCurrent || '').trim();
    const tot = String(totalEpisodes || '').trim();
    if (curr.toLowerCase() === 'full' || curr.toLowerCase() === 'hoàn tất') return 'Full';
    if (curr && tot && tot !== '?' && curr !== tot) return `${curr}/${tot}`;
    if (curr) return curr;
    if (tot && tot !== '?' && tot !== '1') return `${tot} Tập`;
    return null;
  };

  const epLabel = displayEpisode();

  return (
    <div
      className={cn(
        "group relative flex flex-col w-[140px] sm:w-[165px] md:w-[185px] shrink-0 transition-transform duration-300 ease-out hover:-translate-y-1.5 active:scale-[0.98]",
        className
      )}
    >
      {/* Poster Media Box */}
      <Link
        to={`/phim/${slug}`}
        aria-label={name}
        className="block relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80 shadow-md group-hover:shadow-xl group-hover:border-indigo-400/50 dark:group-hover:border-indigo-500/50 transition-all duration-300"
      >
        <img
          src={imgSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onError={handleError}
          loading="lazy"
          decoding="async"
        />

        {/* Soft Vignette Overlay for Badges readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

        {/* Play Icon on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-slate-900/30 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <PlayIcon className="w-6 h-6 ml-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {/* Quality Badge */}
          {quality && quality !== 'UNKNOWN' ? (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-indigo-600 text-white shadow-sm tracking-wide">
              {quality}
            </span>
          ) : <span />}

          {/* Source / Subtitle badge */}
          {source === 'nguonc' ? (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500 text-white shadow-sm">
              Nguồn C
            </span>
          ) : epLabel ? (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
              {epLabel}
            </span>
          ) : null}
        </div>

        {/* Bottom Bar inside Poster */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px] pointer-events-none z-10">
          {ratingNum ? (
            <span className="flex items-center gap-1 font-bold text-amber-300 drop-shadow">
              <StarIcon className="w-3.5 h-3.5 fill-current" />
              {ratingNum}
            </span>
          ) : (
            <span />
          )}

          {lang && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-slate-200">
              {lang.includes('Thuyết') ? 'Thuyết Minh' : (lang.includes('Lồng') ? 'Lồng Tiếng' : 'Vietsub')}
            </span>
          )}
        </div>
      </Link>

      {/* Movie Info Below Poster */}
      <div className="flex flex-col gap-0.5 mt-2.5 px-0.5">
        <Link
          to={`/phim/${slug}`}
          className="text-[13px] sm:text-[14px] font-extrabold text-slate-950 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 transition-colors leading-snug"
          title={name}
        >
          {name}
        </Link>
        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
          <span className="truncate max-w-[120px]">{originalName || 'Phim'}</span>
          {year && <span>{year}</span>}
        </div>
      </div>
    </div>
  );
};
