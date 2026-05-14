import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { Carousel } from '../components/ui/Carousel';
import { MovieCard } from '../components/ui/MovieCard';
import { useMovies, useCinemaMovies, useLiveChannels } from '../hooks/useMovies';
import type { MovieInfo } from '../services/api';
import { movieApi } from '../services/api';

// Live channels are fetched from API — fallback list for SSR/loading
const LIVE_CHANNELS_FALLBACK = [
  { id: 'vtv1',      name: 'VTV1',   program: 'Thời sự 19h',        emoji: '📺', color: '#1d4ed8', logo_url: '' },
  { id: 'vtv3',      name: 'VTV3',   program: 'Bóng đá trực tiếp',  emoji: '⚽', color: '#16a34a', logo_url: '' },
  { id: 'kplus',     name: 'K+',     program: 'Champions League',   emoji: '🏆', color: '#0891b2', logo_url: '' },
  { id: 'al-jazeera',name: 'Al Jazeera', program: 'World News',   emoji: '🌍', color: '#475569', logo_url: '' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

// ─── HeroBanner ─────────────────────────────────────────────────────────────
const HeroBanner: React.FC<{ movie: MovieInfo; isActive: boolean }> = ({ movie, isActive }) => {
  const [desc, setDesc] = useState<string>('');

  useEffect(() => {
    if (isActive && !desc && movie.slug) {
      movieApi.getMovieDetail(movie.slug)
        .then(res => {
          if (res && res.description) {
            setDesc(res.description);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isActive, movie.slug]);

  const displayDesc = desc || movie.description;

  return (
    <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
      <div className={`absolute inset-0 transition-transform duration-[10000ms] ease-out ${isActive ? 'scale-105' : 'scale-100'}`}>
        <img 
          src={movie.posterUrl || movie.thumbUrl || "/fallback-poster.svg"} 
          alt={movie.name}
          className="w-full h-full object-cover object-top"
          loading="eager"
        />
        {/* Dark overlays to make text pop on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/80 to-transparent w-[90%] md:w-[70%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/40 to-transparent" />
      </div>
      
      <div className="absolute inset-0 flex items-center justify-start pb-12 md:pb-0">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full">
          {/* Content Box - Left Aligned */}
          <div className={`flex flex-col items-start gap-4 transition-all duration-700 delay-300 w-full max-w-2xl ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
            
            {/* Title Block */}
            <div className="flex flex-col select-none max-w-full gap-1.5">
              <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white leading-tight tracking-tight drop-shadow-lg line-clamp-2">
                {movie.name}
              </h1>
              {movie.originalName && (
                <h3 className="font-body font-bold text-base md:text-lg text-white/70 tracking-wide drop-shadow-md line-clamp-1">
                  {movie.originalName}
                </h3>
              )}
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2.5 mt-2">
              {movie.rating && movie.rating !== '0' && movie.rating !== 0 && (
                <span className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
                  ★ {movie.rating}
                </span>
              )}
              {movie.year && (
                <span className="text-white/80 text-[13px] font-semibold">
                  {movie.year}
                </span>
              )}
              {movie.quality && movie.quality !== 'UNKNOWN' && (
                <span className="bg-white/10 text-white/90 text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
                  {movie.quality}
                </span>
              )}
              {movie.totalEpisodes && (
                <span className="text-white/60 text-[13px] font-medium">
                  {String(movie.totalEpisodes).includes('/') ? `Tập ${String(movie.totalEpisodes).split('/')[0]}` : movie.totalEpisodes}
                </span>
              )}
            </div>
            
            {/* Description */}
            {displayDesc && (
              <p className="text-white/70 text-[14px] md:text-[15px] leading-relaxed line-clamp-2 font-medium max-w-xl mt-3 drop-shadow-md" dangerouslySetInnerHTML={{ __html: displayDesc }} />
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-6">
              <Link to={`/phim/${movie.slug}`}>
                <button className="px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-full flex items-center justify-center font-bold text-sm transition-all hover:scale-105 group">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  XEM NGAY
                </button>
              </Link>
              <Link to={`/phim/${movie.slug}`}>
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full flex items-center justify-center font-bold text-sm transition-all hover:scale-105">
                  <InformationCircleIcon className="w-5 h-5 mr-2 text-white/70" />
                  CHI TIẾT
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


interface LiveChannelData { id: string; name: string; emoji: string; color: string; logo_url?: string; program_now?: string; program?: string; }

const LiveCard: React.FC<{ ch: LiveChannelData }> = ({ ch }) => (
  <Link to="/live" className="shrink-0 w-[200px] md:w-[260px] group snap-start">
    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 group-hover:border-red-500/60 transition-all duration-500 shadow-xl group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]"
      style={{ background: `linear-gradient(135deg, ${ch.color}30, ${ch.color}10)` }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {ch.logo_url ? (
          <img src={ch.logo_url} alt={ch.name} className="w-14 h-14 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
        ) : (
          <span className="text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">{ch.emoji}</span>
        )}
      </div>
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase shadow-lg tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <div className="mt-3 px-1">
      <p className="text-[14px] font-bold text-white/90 group-hover:text-white transition-colors truncate">{ch.name}</p>
      <p className="text-[12px] text-white/50 truncate font-medium mt-0.5">{ch.program_now || ch.program}</p>
    </div>
  </Link>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const Home: React.FC = () => {
  const [heroIdx, setHeroIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Queries — heavily reduced
  const recentQ   = useMovies({ category: 'phim-moi-cap-nhat', page: 1 });
  const cinemaQ   = useCinemaMovies(1);
  const seriesQ   = useMovies({ category: 'phim-bo', page: 1 });
  const liveQ     = useLiveChannels('live');
  const sportsQ   = useLiveChannels('sport');

  const heroMovies = (recentQ.data?.items || []).slice(0, 5);
  const livePreview = (liveQ.data || []).slice(0, 4).length > 0
    ? (liveQ.data || []).slice(0, 4)
    : LIVE_CHANNELS_FALLBACK;
    
  const sportsPreview = (sportsQ.data || []).slice(0, 4);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heroMovies.length > 1) {
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          setHeroIdx(i => (i + 1) % heroMovies.length);
        }
      }, 6000);
    }
  }, [heroMovies.length]);

  useEffect(() => { 
    startInterval(); 
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; 
  }, [startInterval]);

  return (
    <div className="flex flex-col pb-24 md:pb-16 bg-background min-h-screen">
      
      {/* ── 1. HERO SLIDER ─────────────────────────────────────────────── */}
      <section className="relative w-full h-[55vh] md:h-[70vh] max-h-[700px] min-h-[450px] overflow-hidden bg-black shadow-2xl">
        {heroMovies.length === 0 && !recentQ.isLoading && (
          <div className="absolute inset-0 bg-surface flex items-center justify-center">
             <p className="text-white/20 italic uppercase tracking-[0.2em] font-bold text-lg">ĐANG TẢI DỮ LIỆU...</p>
          </div>
        )}
        {recentQ.isLoading && (
          <div className="absolute inset-0 bg-surface flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {heroMovies.map((m, i) => <HeroBanner key={m.id} movie={m} isActive={i === heroIdx} />)}
        
        {/* Mobile Dot Indicators */}
        <div className="absolute bottom-6 left-6 md:left-12 z-30 flex items-center gap-2">
          {heroMovies.map((_, i) => (
            <button key={i} onClick={() => { setHeroIdx(i); startInterval(); }}
              className={`h-1.5 transition-all duration-300 rounded-full focus:outline-none ${i === heroIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`} />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-12 md:gap-16 mt-8 md:mt-12 max-w-[1440px] mx-auto w-full px-4 md:px-8">
        
        {/* ── 2. MỚI CẬP NHẬT ─────────────────────────────────────────── */}
        <Carousel title="Mới Cập Nhật" emoji="⚡" isLoading={recentQ.isLoading} error={recentQ.error}
          onRetry={recentQ.refetch} viewAllLink="/browse/phim-moi-cap-nhat">
          {recentQ.data?.items?.map(m => (
            <MovieCard key={m.slug} {...m} className="w-[150px] md:w-[200px] shrink-0 snap-start" />
          ))}
        </Carousel>

        {/* ── 3. PHIM CHIẾU RẠP ────────────────────────────────────────── */}
        <Carousel title="Phim Chiếu Rạp" emoji="🎬" isLoading={cinemaQ.isLoading} error={cinemaQ.error}
          onRetry={cinemaQ.refetch} viewAllLink="/browse/phim-chieu-rap">
          {cinemaQ.data?.items?.map(m => (
            <MovieCard key={m.slug} {...m} className="w-[150px] md:w-[200px] shrink-0 snap-start" />
          ))}
        </Carousel>

        {/* ── 4. PHIM BỘ MỚI (Đổi từ Đang Hot) ────────────────────────── */}
        <Carousel title="Phim Bộ Mới" emoji="📺" isLoading={seriesQ.isLoading} error={seriesQ.error}
          onRetry={seriesQ.refetch} viewAllLink="/browse/phim-bo">
          {seriesQ.data?.items?.map(m => (
            <MovieCard key={m.slug} {...m} className="w-[150px] md:w-[200px] shrink-0 snap-start" />
          ))}
        </Carousel>

        {/* ── 5. THỂ THAO TRỰC TIẾP ──────────────────────────────────────── */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-[#ff922b] animate-ping absolute inset-0 opacity-75" />
                <div className="w-3 h-3 rounded-full bg-[#ff922b] relative z-10" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-white tracking-tight">Thể Thao</h2>
            </div>
            <Link to="/sports" className="text-white/60 hover:text-white text-[12px] font-semibold uppercase tracking-widest flex items-center gap-1 transition-colors group">
              Xem tất cả 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x pr-8 w-full">
            {sportsPreview.map(ch => <LiveCard key={ch.id} ch={ch} />)}
            {sportsPreview.length === 0 && !sportsQ.isLoading && (
              <div className="w-full flex items-center justify-center p-8 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-white/40 text-sm">Hiện không có sự kiện thể thao nào diễn ra.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── 6. LIVE TV PREVIEW ──────────────────────────────────────── */}
        <section className="pb-12 md:pb-20">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-red-600 animate-ping absolute inset-0 opacity-75" />
                <div className="w-3 h-3 rounded-full bg-red-600 relative z-10" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-white tracking-tight">Live TV</h2>
            </div>
            <Link to="/live" className="text-white/60 hover:text-white text-[12px] font-semibold uppercase tracking-widest flex items-center gap-1 transition-colors group">
              Xem tất cả 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x pr-8 w-full">
            {livePreview.map(ch => <LiveCard key={ch.id} ch={ch} />)}
          </div>
        </section>

      </div>
    </div>
  );
};
