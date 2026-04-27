import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { Carousel } from '../components/ui/Carousel';
import { MovieCard } from '../components/ui/MovieCard';
import { useMovies, useCinemaMovies, useTrendingMovies, useLiveChannels } from '../hooks/useMovies';
import type { MovieInfo } from '../services/api';

// ─── Constants ─────────────────────────────────────────────────────────────
const GENRES = [
  { name: 'Hành động', slug: 'hanh-dong', emoji: '⚔️', color: 'from-orange-500 to-red-600' },
  { name: 'Tình cảm',  slug: 'tinh-cam',  emoji: '💕', color: 'from-pink-400 to-purple-600' },
  { name: 'Kinh dị',   slug: 'kinh-di',   emoji: '👻', color: 'from-purple-800 to-indigo-950' },
  { name: 'Hài hước',  slug: 'hai-huoc',  emoji: '😂', color: 'from-yellow-400 to-orange-500' },
  { name: 'Tâm lý',    slug: 'tam-ly',    emoji: '🧠', color: 'from-blue-400 to-blue-700' },
  { name: 'Viễn tưởng',slug: 'vien-tuong',emoji: '🚀', color: 'from-cyan-400 to-blue-600' },
  { name: 'Cổ trang',  slug: 'co-trang',  emoji: '👘', color: 'from-rose-400 to-pink-700' },
  { name: 'Lịch sử',   slug: 'lich-su',   emoji: '🏛️', color: 'from-amber-600 to-orange-900' },
  { name: 'Tài liệu',  slug: 'tai-lieu',  emoji: '📄', color: 'from-slate-400 to-slate-700' },
  { name: 'Chiến tranh',slug: 'chien-tranh',emoji: '🎖️', color: 'from-green-700 to-emerald-950' },
  { name: 'Thể thao',  slug: 'the-thao',  emoji: '⚽', color: 'from-emerald-400 to-green-700' },
  { name: 'Âm nhạc',   slug: 'am-nhac',   emoji: '🎵', color: 'from-indigo-400 to-purple-800' },
  { name: 'Bí ẩn',     slug: 'bi-an',     emoji: '🔍', color: 'from-gray-700 to-black' },
  { name: 'Gia đình',  slug: 'gia-dinh',  emoji: '👨‍👩‍👧‍👦', color: 'from-teal-400 to-emerald-600' },
  { name: 'Võ thuật',  slug: 'vo-thuat',  emoji: '🥋', color: 'from-red-700 to-red-950' },
];

const COUNTRIES = [
  { name: 'Hàn Quốc', slug: 'han-quoc', emoji: '🇰🇷', color: 'from-blue-500/20 to-blue-600/10' },
  { name: 'Trung Quốc', slug: 'trung-quoc', emoji: '🇨🇳', color: 'from-red-500/20 to-red-600/10' },
  { name: 'Âu Mỹ', slug: 'au-my', emoji: '🇺🇸', color: 'from-indigo-500/20 to-indigo-600/10' },
  { name: 'Nhật Bản', slug: 'nhat-ban', emoji: '🇯🇵', color: 'from-rose-500/20 to-rose-600/10' },
  { name: 'Thái Lan', slug: 'thai-lan', emoji: '🇹🇭', color: 'from-cyan-500/20 to-cyan-600/10' },
  { name: 'Việt Nam', slug: 'viet-nam', emoji: '🇻🇳', color: 'from-emerald-500/20 to-emerald-600/10' },
  { name: 'Ấn Độ', slug: 'an-do', emoji: '🇮🇳', color: 'from-orange-500/20 to-orange-600/10' },
];

// Live channels are fetched from API — fallback list for SSR/loading
const LIVE_CHANNELS_FALLBACK = [
  { id: 'vtv1',      name: 'VTV1',   program: 'Thời sự 19h',        emoji: '📺', color: '#1d4ed8', logo_url: '' },
  { id: 'vtv3',      name: 'VTV3',   program: 'Bóng đá trực tiếp',  emoji: '⚽', color: '#16a34a', logo_url: '' },
  { id: 'kplus',     name: 'K+',     program: 'Champions League',   emoji: '🏆', color: '#0891b2', logo_url: '' },
  { id: 'al-jazeera',name: 'Al Jazeera', program: 'World News',   emoji: '🌍', color: '#475569', logo_url: '' },
];

// ─── Quality badge helper (shared with MovieCard) ──────────────────────────
function getQualityBadgeClass(quality?: string): string {
  const q = (quality || '').toUpperCase();
  if (q === '4K' || q === 'UHD') return 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]';
  if (q === 'FHD' || q === '1080P') return 'bg-gradient-to-r from-blue-500 to-blue-400 text-white';
  if (q === 'CAM' || q === 'TS') return 'bg-red-600/80 text-white';
  return 'bg-purple-600 text-white shadow-lg shadow-purple-600/30';
}

// ─── Sub-components ─────────────────────────────────────────────────────────

// HeroBanner NO LONGER calls useMovieDetail per-slide (was causing 6 extra API
// calls). It uses the listing data directly which already has enough for the banner.
// ─── HeroBanner ─────────────────────────────────────────────────────────────
const HeroBanner: React.FC<{ movie: MovieInfo; isActive: boolean }> = ({ movie, isActive }) => {

  return (
    <div className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
      <div className={`absolute inset-0 transition-transform duration-[8000ms] ease-out ${isActive ? 'scale-105' : 'scale-100'}`}>
        <img 
          src={movie.posterUrl || movie.thumbUrl || "/fallback-poster.svg"} 
          alt={movie.name}
          className="w-full h-full object-cover object-top"
          loading="eager"
        />
        {/* Dark overlays to make text pop on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/60 to-transparent w-[80%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/30 to-transparent" />
      </div>
      
      <div className="absolute inset-0 flex items-center justify-start pb-20 md:pb-0">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full">
          {/* Content Box - Left Aligned */}
          <div className={`flex flex-col items-start gap-4 transition-all duration-[800ms] delay-500 w-full max-w-3xl ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
            
            {/* Title Block */}
            <div className="flex flex-col select-none max-w-[90%] md:max-w-4xl gap-2">
              <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-[4rem] text-white leading-[1.15] tracking-tight drop-shadow-xl line-clamp-3"
                  style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}>
                {movie.name}
              </h1>
              {movie.originalName && (
                <h3 className="font-body font-bold text-lg md:text-xl text-white/90 tracking-wide drop-shadow-md line-clamp-1">
                  {movie.originalName}
                </h3>
              )}
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="flex items-center gap-1 border border-yellow-400 text-yellow-400 text-[12px] font-bold px-2 py-0.5 rounded shadow-sm">
                IMDb {movie.rating || '7.9'}
              </span>
              {movie.year && (
                <span className="border border-white/40 text-white/90 text-[12px] font-medium px-2.5 py-0.5 rounded shadow-sm">
                  {movie.year}
                </span>
              )}
              {movie.quality && (
                <span className="border border-white/40 text-white/90 text-[12px] font-medium px-2.5 py-0.5 rounded shadow-sm">
                  {movie.quality}
                </span>
              )}
              {movie.totalEpisodes && (
                <span className="border border-white/40 text-white/90 text-[12px] font-medium px-2.5 py-0.5 rounded shadow-sm">
                  {movie.totalEpisodes}
                </span>
              )}
            </div>
            
            {/* Genres Row */}
            {movie.categories && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {movie.categories.split(',').slice(0, 3).map((g, idx) => (
                  <span key={idx} className="bg-white/5 border border-white/10 text-white/80 text-[11px] font-medium px-3 py-1 rounded-full whitespace-nowrap">
                    {g.trim()}
                  </span>
                ))}
              </div>
            )}
            
            {/* Description */}
            <p className="text-white/80 text-[14px] md:text-[15px] leading-relaxed line-clamp-3 font-normal max-w-2xl mt-4 drop-shadow-md">
              {movie.description 
                ? movie.description.replace(/<[^>]*>/g, '').slice(0, 250) + (movie.description.length > 250 ? '...' : '')
                : 'Khám phá thế giới điện ảnh đỉnh cao với chất lượng tuyệt mỹ cùng CINEVINA.'}
            </p>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-6">
              <Link to={`/phim/${movie.slug}`}>
                <button className="w-14 h-14 md:w-16 md:h-16 bg-[#f9d854] hover:bg-yellow-400 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform group">
                  <PlayIcon className="w-7 h-7 md:w-8 md:h-8 text-black ml-1 group-hover:scale-110 transition-transform" />
                </button>
              </Link>
              <button className="w-12 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all hover:scale-105">
                <HeartIcon className="w-6 h-6 text-white" />
              </button>
              <Link to={`/phim/${movie.slug}`}>
                <button className="w-12 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all hover:scale-105">
                  <InformationCircleIcon className="w-6 h-6 text-white" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const Top10Card: React.FC<{ movie: MovieInfo; rank: number }> = ({ movie, rank }) => {
  const [imgSrc, setImgSrc] = useState(movie.posterUrl || movie.thumbUrl || '/fallback-poster.svg');

  return (
    <Link to={`/phim/${movie.slug}`} className="relative flex items-end shrink-0 group cursor-pointer pl-8 md:pl-12 py-4">
      <span className="absolute left-0 bottom-4 z-10 select-none font-display font-black leading-none italic pointer-events-none transition-all group-hover:scale-110 group-hover:-rotate-6 duration-700 text-gradient-gold drop-shadow-[0_0_20px_rgba(234,179,8,0.3)] text-[7rem] md:text-[10rem]"
        style={{ WebkitTextStroke: '2px rgba(255,255,255,0.1)' }}>
        {rank}
      </span>
      <div className="relative w-[140px] md:w-[180px] aspect-[2/3] rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/5 group-hover:border-primary/50 group-hover:shadow-[0_0_40px_rgba(175,37,254,0.4)] transition-all duration-500 movie-card-glow">
        <img
          src={imgSrc}
          alt={movie.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          loading="lazy"
          onError={() => {
            if (imgSrc !== movie.thumbUrl && movie.thumbUrl) {
              setImgSrc(movie.thumbUrl);
            } else {
              setImgSrc('/fallback-poster.svg');
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Badge chất lượng */}
        {movie.quality && (
          <span className={`absolute top-3 left-3 px-2 py-0.5 text-[10px] font-black rounded-full shadow-xl backdrop-blur-md ${getQualityBadgeClass(movie.quality)}`}>
            {movie.quality}
          </span>
        )}
      </div>
    </Link>
  );
};

interface LiveChannelData { id: string; name: string; emoji: string; color: string; logo_url?: string; program_now?: string; program?: string; }

const LiveCard: React.FC<{ ch: LiveChannelData }> = ({ ch }) => (
  <Link to="/live" className="shrink-0 w-[220px] md:w-[280px] group snap-start">
    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 group-hover:border-red-500/60 transition-all duration-500 shadow-2xl group-hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]"
      style={{ background: `linear-gradient(135deg, ${ch.color}30, ${ch.color}10)` }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        {ch.logo_url ? (
          <img src={ch.logo_url} alt={ch.name} className="w-16 h-16 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
        ) : (
          <span className="text-5xl group-hover:scale-125 transition-transform duration-700 drop-shadow-xl">{ch.emoji}</span>
        )}
        <span className="font-display font-black text-2xl text-white tracking-[0.2em] uppercase drop-shadow-lg">{ch.name}</span>
      </div>
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-lg">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <div className="mt-4 px-1">
      <p className="text-[15px] font-black text-white group-hover:text-red-500 transition-colors truncate uppercase tracking-tight">{ch.name}</p>
      <p className="text-[13px] text-white/50 truncate italic font-medium mt-0.5">{ch.program_now || ch.program}</p>
    </div>
  </Link>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Queries — heavy sections load deferred
  const recentQ   = useMovies({ category: 'phim-moi-cap-nhat', page: 1 });
  const trendingQ = useTrendingMovies(10);
  const cinemaQ   = useCinemaMovies(1);
  const seriesQ   = useMovies({ category: 'phim-bo', page: 1 });
  const liveQ     = useLiveChannels('live');

  // Country rows
  const vnQ = useMovies({ country: 'viet-nam', page: 1 });
  const krQ = useMovies({ country: 'han-quoc', page: 1 });
  const usQ = useMovies({ country: 'au-my', page: 1 });

  const heroMovies = (recentQ.data || []).slice(0, 6);
  const livePreview = (liveQ.data || []).slice(0, 4).length > 0
    ? (liveQ.data || []).slice(0, 4)
    : LIVE_CHANNELS_FALLBACK;

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heroMovies.length > 1) {
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          setHeroIdx(i => (i + 1) % heroMovies.length);
        }
      }, 7000); // Slightly slower for more "cinematic" feel
    }
  }, [heroMovies.length]);

  useEffect(() => { 
    startInterval(); 
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; 
  }, [startInterval]);

  return (
    <div className="flex flex-col pb-24 md:pb-16 bg-background min-h-screen">
      
      {/* ── 1. HERO SLIDER ─────────────────────────────────────────────── */}
      <section className="relative w-full h-[65vh] sm:h-[75vh] lg:h-[85vh] max-h-[850px] min-h-[500px] overflow-hidden bg-black shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {heroMovies.length === 0 && !recentQ.isLoading && (
          <div className="absolute inset-0 bg-surface flex items-center justify-center">
             <p className="text-white/20 italic uppercase tracking-[0.3em] font-black text-xl">DỮ LIỆU ĐANG TẢI...</p>
          </div>
        )}
        {recentQ.isLoading && (
          <div className="absolute inset-0 bg-surface animate-pulse flex items-center justify-center">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}
        {heroMovies.map((m, i) => <HeroBanner key={m.id} movie={m} isActive={i === heroIdx} />)}
        
        {/* Thumbnails Carousel (Desktop) */}
        <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 z-30 hidden md:flex items-center gap-3">
          {heroMovies.map((m, i) => (
            <button 
              key={i} 
              onClick={() => { setHeroIdx(i); startInterval(); }}
              className={`relative w-[120px] aspect-video rounded-xl overflow-hidden transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                i === heroIdx ? 'border-2 border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10' : 'border border-white/20 opacity-50 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img src={m.thumbUrl || m.posterUrl || "/fallback-poster.svg"} alt={m.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Mobile Dot Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex md:hidden items-center gap-2">
          {heroMovies.map((_, i) => (
            <button key={i} onClick={() => { setHeroIdx(i); startInterval(); }}
              className={`h-1.5 transition-all duration-500 rounded-full focus:outline-none ${i === heroIdx ? 'w-6 bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'w-1.5 bg-white/30'}`} />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-16 md:gap-24 mt-12 md:mt-20 max-w-[1500px] mx-auto w-full px-4 md:px-8">
        
        {/* ── 2. TOP 10 HÔM NAY ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <span className="text-2xl">🏆</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic text-gradient-gold">Top 10 Hôm Nay</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-8 pr-12">
            {(trendingQ.data || []).map((m, i) => (
              <div key={m.id} className="snap-start"><Top10Card movie={m} rank={i + 1} /></div>
            ))}
          </div>
        </section>

        {/* ── 3. MỚI CẬP NHẬT ─────────────────────────────────────────── */}
        <Carousel title="Mới Cập Nhật" emoji="⚡" isLoading={recentQ.isLoading} error={recentQ.error}
          onRetry={recentQ.refetch} viewAllLink="/browse/phim-moi-cap-nhat">
          {recentQ.data?.map(m => (
            <MovieCard key={m.slug} {...m} className="w-[150px] md:w-[200px] lg:w-[230px] shrink-0 snap-start" />
          ))}
        </Carousel>

        {/* ── 4. PHIM CHIẾU RẠP ────────────────────────────────────────── */}
        <Carousel title="Phim Chiếu Rạp" emoji="🎬" badge="VIP" isLoading={cinemaQ.isLoading} error={cinemaQ.error}
          onRetry={cinemaQ.refetch} viewAllLink="/browse/phim-chieu-rap">
          {cinemaQ.data?.map(m => (
            <MovieCard key={m.slug} {...m} className="w-[150px] md:w-[200px] lg:w-[230px] shrink-0 snap-start" />
          ))}
        </Carousel>

        {/* ── 5. PHIM BỘ ĐANG HOT ─────────────────────────────────────── */}
        <Carousel title="Phim Bộ Đang Hot" emoji="📺" isLoading={seriesQ.isLoading} error={seriesQ.error}
          onRetry={seriesQ.refetch} viewAllLink="/browse/phim-bo">
          {seriesQ.data?.map(m => (
            <MovieCard key={m.slug} {...m} className="w-[150px] md:w-[200px] lg:w-[230px] shrink-0 snap-start" />
          ))}
        </Carousel>

        {/* ── 6. THEO QUỐC GIA ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-2xl">🌍</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic text-gradient-primary">Theo Quốc Gia</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {COUNTRIES.map(c => (
              <button key={c.slug} onClick={() => navigate(`/browse/${c.slug}`)}
                className={`flex flex-col items-center gap-3 p-6 rounded-[24px] glass-card hover:border-primary/50 group`}>
                <span className="text-3xl group-hover:scale-125 transition-transform duration-500">{c.emoji}</span>
                <span className="font-extrabold text-white/80 group-hover:text-white uppercase tracking-widest text-[11px]">{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Rows by Country */}
        <Carousel title="Phim Việt Nam" emoji="🇻🇳" isLoading={vnQ.isLoading} onRetry={vnQ.refetch} viewAllLink="/browse/viet-nam">
          {vnQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[150px] md:w-[200px] lg:w-[230px] shrink-0 snap-start" />)}
        </Carousel>

        <Carousel title="Phim Hàn Quốc" emoji="🇰🇷" isLoading={krQ.isLoading} onRetry={krQ.refetch} viewAllLink="/browse/han-quoc">
          {krQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[150px] md:w-[200px] lg:w-[230px] shrink-0 snap-start" />)}
        </Carousel>

        <Carousel title="Phim Âu Mỹ" emoji="🇺🇸" isLoading={usQ.isLoading} onRetry={usQ.refetch} viewAllLink="/browse/au-my">
          {usQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[150px] md:w-[200px] lg:w-[230px] shrink-0 snap-start" />)}
        </Carousel>

        {/* ── 9. KHÁM PHÁ THEO THỂ LOẠI ── */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/20">
              <span className="text-2xl">🎭</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic text-gradient-primary">Khám Phá Thể Loại</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
            {GENRES.map(g => (
              <button key={g.slug} onClick={() => navigate(`/browse/${g.slug}`)}
                className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] bg-gradient-to-br ${g.color} opacity-90 hover:opacity-100 transition-all hover:scale-[1.05] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] group shadow-xl relative overflow-hidden`}>
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer" />
                <span className="text-5xl group-hover:scale-125 transition-transform duration-700 drop-shadow-2xl">{g.emoji}</span>
                <span className="font-display font-black text-white text-[13px] tracking-[0.2em] uppercase text-center">{g.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 10. LIVE TV ─────────────────────────────────────────────── */}
        <section className="pb-20">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-red-600 animate-ping absolute inset-0 opacity-75" />
                <div className="w-4 h-4 rounded-full bg-red-600 relative z-10 shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic text-gradient-primary">Live TV</h2>
            </div>
            <Link to="/live" className="btn-vibrant !px-6 !py-2.5 !text-xs !rounded-xl uppercase tracking-widest">Xem tất cả →</Link>
          </div>
          <div className="flex gap-8 overflow-x-auto scrollbar-hide snap-x pr-12 w-full">
            {livePreview.map(ch => <LiveCard key={ch.id} ch={ch} />)}
          </div>
        </section>

      </div>
    </div>
  );
};

