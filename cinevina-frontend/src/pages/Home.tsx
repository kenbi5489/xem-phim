import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { Carousel } from '../components/ui/Carousel';
import { MovieCard } from '../components/ui/MovieCard';
import { Button } from '../components/ui/Button';
import { useMovies, useCinemaMovies } from '../hooks/useMovies';
import type { MovieInfo } from '../services/api';

const HeroBanner: React.FC<{ movie: MovieInfo; isActive: boolean }> = ({ movie, isActive }) => {
  const bgImage = movie.thumbUrl || movie.posterUrl || "/fallback-poster.svg";

  return (
    <div 
      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
      }`}
    >
      {/* Background Media */}
      <div className={`absolute inset-0 overflow-hidden transition-transform duration-[8000ms] ease-out ${isActive ? 'scale-105' : 'scale-100'}`}>
        <img 
          src={bgImage} 
          alt={movie.name}
          className="w-full h-full object-cover object-center"
          loading={isActive ? "eager" : "lazy"}
          decoding="async"
        />
        {/* Layered Cinematic Vignette & Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-app)] via-[var(--color-bg-app)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-app)] via-[var(--color-bg-app)]/75 to-transparent w-full md:w-[75%]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0)_0%,rgba(7,10,18,0.7)_100%)]" />
      </div>
      
      {/* Banner Content Container */}
      <div className="absolute inset-0 flex items-end pb-12 sm:pb-16 md:pb-20">
        <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className={`flex flex-col items-start max-w-[620px] gap-3 transition-all duration-500 delay-150 ${
            isActive ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}>
            
            {/* Badges / Meta */}
            <div className="flex flex-wrap items-center gap-2">
              {movie.quality && movie.quality !== 'UNKNOWN' && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--color-primary)] text-white tracking-wide uppercase">
                  {movie.quality}
                </span>
              )}
              {movie.year && (
                <span className="text-[12px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-white/90 backdrop-blur-md">
                  {movie.year}
                </span>
              )}
              {movie.totalEpisodes && (
                <span className="text-[12px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-white/90 backdrop-blur-md">
                  {String(movie.totalEpisodes).includes('/') ? `Tập ${String(movie.totalEpisodes).split('/')[0]}` : movie.totalEpisodes}
                </span>
              )}
              {movie.categories && (
                <span className="hidden sm:inline text-[12px] font-medium text-slate-300">
                  {movie.categories.split(',').slice(0, 2).join(' · ')}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1 w-full">
              <h1 className="font-heading text-[26px] sm:text-[36px] md:text-[46px] lg:text-[52px] leading-[1.1] font-extrabold text-white drop-shadow-lg line-clamp-2">
                {movie.name}
              </h1>
              {movie.originalName && (
                <p className="font-body text-[13px] sm:text-[14px] font-medium text-slate-300 tracking-wide line-clamp-1">
                  {movie.originalName}
                </p>
              )}
            </div>

            {/* Description */}
            {movie.description && (
              <p className="line-clamp-2 text-[13px] sm:text-[14px] text-slate-300/90 leading-relaxed max-w-[95%]">
                {movie.description}
              </p>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              <Link to={`/phim/${movie.slug}`}>
                <Button 
                  variant="primary" 
                  size="md" 
                  className="px-6 sm:px-8 py-2.5 flex items-center gap-2 font-bold text-[13px] sm:text-[14px] shadow-lg shadow-purple-600/25 active:scale-95 transition-transform"
                >
                  <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Xem Phim
                </Button>
              </Link>
              <Link to={`/phim/${movie.slug}`}>
                <Button 
                  variant="secondary" 
                  size="md" 
                  className="px-4 sm:px-6 py-2.5 flex items-center gap-1.5 font-medium text-[13px] sm:text-[14px] bg-white/10 hover:bg-white/20 border-white/15 text-white active:scale-95 transition-transform"
                >
                  <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/80" /> Chi tiết
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const [heroIdx, setHeroIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recentQ = useMovies({ category: 'phim-moi-cap-nhat', page: 1 });
  const cinemaQ = useCinemaMovies(1);
  const seriesQ = useMovies({ category: 'phim-bo', page: 1 });
  const animeQ  = useMovies({ category: 'hoat-hinh', page: 1 });

  const heroMovies = (recentQ.data?.items || []).slice(0, 5);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heroMovies.length > 1) {
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          setHeroIdx(i => (i + 1) % heroMovies.length);
        }
      }, 5500);
    }
  }, [heroMovies.length]);

  useEffect(() => { 
    startInterval(); 
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; 
  }, [startInterval]);

  return (
    <div className="flex flex-col pb-16 w-full overflow-x-hidden">
      
      {/* ── 1. HERO BANNER ── */}
      <section 
        className="relative w-full h-[52vh] sm:h-[60vh] md:h-[72vh] max-h-[680px] bg-[var(--color-bg-app)] overflow-hidden"
        onMouseEnter={() => { if (intervalRef.current) clearInterval(intervalRef.current); }}
        onMouseLeave={startInterval}
      >
        {heroMovies.length === 0 && !recentQ.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
             <p className="text-[var(--color-text-3)] text-sm">Đang tải phim mới...</p>
          </div>
        )}
        {recentQ.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-9 h-9 border-2 border-[var(--color-surface-elevated)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        )}
        {heroMovies.map((m, i) => (
          <HeroBanner key={m.slug || m.id} movie={m} isActive={i === heroIdx} />
        ))}
        
        {/* Dot Indicators */}
        <div className="absolute bottom-5 sm:bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
          {heroMovies.map((_, i) => (
            <button 
              key={i} 
              onClick={() => { setHeroIdx(i); startInterval(); }}
              className={`rounded-full transition-all duration-300 ${
                i === heroIdx 
                  ? 'w-6 h-1.5 bg-[var(--color-primary)] shadow-sm' 
                  : 'w-2 h-1.5 bg-white/30 hover:bg-white/50'
              }`} 
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── MOVIE SECTIONS ── */}
      <div className="flex flex-col gap-9 sm:gap-11 md:gap-14 -mt-6 sm:-mt-8 relative z-20">
        {/* ── 2. MỚI CẬP NHẬT ── */}
        {(recentQ.isLoading || recentQ.error || (recentQ.data?.items && recentQ.data.items.length > 0)) && (
          <Carousel 
            title="Mới Cập Nhật" 
            isLoading={recentQ.isLoading} 
            error={recentQ.error}
            onRetry={recentQ.refetch} 
            viewAllLink="/browse/phim-moi-cap-nhat"
          >
            {recentQ.data?.items?.map(m => (
              <MovieCard key={m.slug} {...m} />
            ))}
          </Carousel>
        )}

        {/* ── 3. PHIM CHIẾU RẠP ── */}
        {(cinemaQ.isLoading || cinemaQ.error || (cinemaQ.data?.items && cinemaQ.data.items.length > 0)) && (
          <Carousel 
            title="Phim Chiếu Rạp Đỉnh Cao" 
            isLoading={cinemaQ.isLoading} 
            error={cinemaQ.error}
            onRetry={cinemaQ.refetch} 
            viewAllLink="/browse/phim-chieu-rap"
          >
            {cinemaQ.data?.items?.map(m => (
              <MovieCard key={m.slug} {...m} />
            ))}
          </Carousel>
        )}

        {/* ── 4. PHIM BỘ MỚI ── */}
        {(seriesQ.isLoading || seriesQ.error || (seriesQ.data?.items && seriesQ.data.items.length > 0)) && (
          <Carousel 
            title="Phim Bộ Thịnh Hành" 
            isLoading={seriesQ.isLoading} 
            error={seriesQ.error}
            onRetry={seriesQ.refetch} 
            viewAllLink="/browse/phim-bo"
          >
            {seriesQ.data?.items?.map(m => (
              <MovieCard key={m.slug} {...m} />
            ))}
          </Carousel>
        )}

        {/* ── 5. HOẠT HÌNH / ANIME ── */}
        {(animeQ.isLoading || animeQ.error || (animeQ.data?.items && animeQ.data.items.length > 0)) && (
          <Carousel 
            title="Hoạt Hình & Anime Đặc Sắc" 
            isLoading={animeQ.isLoading} 
            error={animeQ.error}
            onRetry={animeQ.refetch} 
            viewAllLink="/browse/hoat-hinh"
          >
            {animeQ.data?.items?.map(m => (
              <MovieCard key={m.slug} {...m} />
            ))}
          </Carousel>
        )}
      </div>
    </div>
  );
};
