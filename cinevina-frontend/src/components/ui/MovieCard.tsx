import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, PlusIcon, StarIcon } from '@heroicons/react/24/solid';
import { FilmIcon } from '@heroicons/react/24/outline';
import { cn } from './Button';

// Fallback chain: poster_url → thumb_url → SVG placeholder
const FALLBACK_IMG = '/fallback-poster.svg';

function useImgSrc(posterUrl?: string, thumbUrl?: string) {
  // Try posterUrl first, then thumbUrl, then fallback
  const initial = posterUrl || thumbUrl || FALLBACK_IMG;
  const [src, setSrc] = useState(initial);
  const failedOnce = useRef(false);

  const handleError = () => {
    if (!failedOnce.current && thumbUrl && src !== thumbUrl) {
      failedOnce.current = true;
      setSrc(thumbUrl);
    } else {
      setSrc(FALLBACK_IMG);
    }
  };

  return { src, handleError };
}

export interface MovieCardProps {
  name?: string;
  posterUrl?: string;   // Primary: posterUrl from backend (already proxied)
  thumbUrl?: string;    // Fallback: thumbUrl from backend (already proxied)
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
    description,
    slug,
    className,
    isLoading = false,
    isCinema = false,
    isStreamable = false,
    trailerUrl = '',
  } = props;

  const [hovered, setHovered] = useState(false);
  const { src: imgSrc, handleError } = useImgSrc(posterUrl, thumbUrl);

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-2 shrink-0', className || 'w-[150px] md:w-[180px]')}>
        <div className="w-full aspect-[2/3] bg-[#1d1f27] animate-pulse rounded-2xl" />
        <div className="h-4 bg-[#1d1f27] animate-pulse rounded w-3/4" />
        <div className="h-3 bg-[#1d1f27] animate-pulse rounded w-1/2" />
      </div>
    );
  }

  // ── Button logic: strictly based on props ──
  // isStreamable = has real stream (link_m3u8 or link_embed)
  // trailerUrl   = has YouTube trailer only
  const playLabel    = isStreamable ? 'Xem ngay'    : trailerUrl ? 'Xem Trailer' : 'Chi tiết';
  const playGradient = isStreamable
    ? 'linear-gradient(135deg, #d692ff, #af25fe)'
    : trailerUrl
    ? 'linear-gradient(135deg, #fe7e4f, #ef4444)'
    : 'linear-gradient(135deg, #374151, #1f2937)';

  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 shrink-0 cursor-pointer movie-card',
        'transition-all duration-200',
        hovered ? 'z-30' : 'z-10',
        className || 'w-[150px] md:w-[180px]'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Poster wrapper ── */}
      <div
        className="relative w-full overflow-visible rounded-2xl"
        style={{
          aspectRatio: '2/3',
          transform: hovered ? 'scale(1.12) translateY(-6px)' : 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: hovered ? '0 20px 60px rgba(0,0,0,0.7)' : 'none',
        }}
      >
        {/* Inner clip container keeps overflow hidden */}
        <div
          style={{
            position: 'absolute', inset: 0,
            borderRadius: '1rem',
            overflow: 'hidden',
            background: '#11131a',
          }}
        >
          <img
            src={imgSrc}
            alt={name || 'Movie poster'}
            className="movie-card__image"
            onError={handleError}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>

        {/* Glow border on hover */}
        {hovered && (
          <div
            style={{
              position: 'absolute', inset: 0,
              borderRadius: '1rem',
              pointerEvents: 'none',
              boxShadow: isStreamable
                ? 'inset 0 0 0 2px rgba(214,146,255,0.6), 0 0 30px rgba(214,146,255,0.3)'
                : trailerUrl
                ? 'inset 0 0 0 2px rgba(254,126,79,0.6), 0 0 30px rgba(254,126,79,0.3)'
                : 'inset 0 0 0 2px rgba(255,255,255,0.15)',
            }}
          />
        )}

        {/* Badges — top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isCinema ? (
            <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> ĐANG CHIẾU
            </span>
          ) : quality ? (
            <span className="bg-[#d692ff] text-[#3a005a] text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-lg">
              {quality}
            </span>
          ) : null}
          {lang && (
            <span className="bg-black/60 text-[#fe7e4f] text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase backdrop-blur-sm">
              {lang}
            </span>
          )}
          {!isStreamable && !isCinema && trailerUrl && (
            <span className="bg-orange-500/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase">
              TRAILER
            </span>
          )}
        </div>

        {/* Hover overlay */}
        {hovered && (
          <div
            style={{ position: 'absolute', inset: 0, borderRadius: '1rem', overflow: 'hidden' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Link to={`/phim/${slug}`} className="flex-1" onClick={e => e.stopPropagation()}>
                  <button
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold text-white active:scale-95 transition-transform"
                    style={{ background: playGradient }}
                  >
                    {isStreamable || trailerUrl
                      ? <PlayIcon className="w-3.5 h-3.5" />
                      : <FilmIcon className="w-3.5 h-3.5" />
                    }
                    {playLabel}
                  </button>
                </Link>
                <button
                  className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                  title="Thêm vào danh sách"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-white/60">
                {year && <span>{year}</span>}
                {rating && (
                  <span className="flex items-center gap-0.5 text-yellow-400">
                    <StarIcon className="w-2.5 h-2.5" />{rating}
                  </span>
                )}
              </div>

              {description && (
                <p className="text-[10px] text-white/70 line-clamp-2 leading-relaxed">
                  {description.replace(/<[^>]*>/g, '')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Title below */}
      <Link to={`/phim/${slug}`} className="flex flex-col gap-0.5">
        <h3
          className="font-display text-sm font-semibold line-clamp-2 leading-tight transition-colors"
          style={{ color: hovered ? '#d692ff' : 'var(--color-on-surface)' }}
        >
          {name}
        </h3>
        {year && (
          <p className="text-xs" style={{ color: 'var(--color-on-surface-variant)' }}>{year}</p>
        )}
      </Link>
    </div>
  );
};
