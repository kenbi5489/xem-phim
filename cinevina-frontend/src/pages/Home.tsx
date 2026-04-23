import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayIcon, InformationCircleIcon, StarIcon } from '@heroicons/react/24/solid';
import { Carousel } from '../components/ui/Carousel';
import { MovieCard } from '../components/ui/MovieCard';
import { useMovies, useCinemaMovies, useTrendingMovies, useMovieDetail } from '../hooks/useMovies';
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

const LIVE_CHANNELS = [
  { id: 'vtv1',  name: 'VTV1',  program: 'Thời sự 19h',              emoji: '📺', color: '#1d4ed8' },
  { id: 'vtv3',  name: 'VTV3',  program: 'Bóng đá trực tiếp',         emoji: '⚽', color: '#16a34a' },
  { id: 'vtv6',  name: 'VTV6',  program: 'Phim chiếu rạp',            emoji: '🎬', color: '#7c3aed' },
  { id: 'kplus', name: 'K+',    program: 'Champions League',          emoji: '🏆', color: '#0891b2' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

const HeroBanner: React.FC<{ movie: MovieInfo; isActive: boolean }> = ({ movie, isActive }) => {
  // Fetch details to get full description if missing from listing
  const { data: detail } = useMovieDetail(movie.slug);
  const displayMovie = detail || movie;

  return (
    <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'}`}>
      <div className="absolute inset-0">
        <img 
          src={displayMovie.posterUrl || displayMovie.thumbUrl || "/fallback-poster.svg"} 
          alt={displayMovie.name}
          className="w-full h-full object-cover object-top"
          loading="eager"
        />
        {/* Premium Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
      </div>
      
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 w-full flex flex-col gap-4 mt-10">
          {/* Content with slide-up transition */}
          <div className={`flex flex-col gap-4 transition-all duration-700 delay-300 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex flex-wrap gap-2">
              {displayMovie.isCinema && (
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                  ĐANG CHIẾU
                </span>
              )}
              {displayMovie.quality && <span className="bg-purple-600 text-white text-xs font-black px-2 py-0.5 rounded uppercase shadow-lg shadow-purple-600/30">{displayMovie.quality}</span>}
              <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded border border-yellow-500/30">
                <StarIcon className="w-3.5 h-3.5" /> {displayMovie.rating || '8.5'}
              </span>
            </div>
            
            <h1 className="font-display font-black text-4xl md:text-7xl text-white leading-none drop-shadow-2xl max-w-3xl uppercase tracking-tighter">
              {displayMovie.name}
            </h1>
            
            <p className="text-white/70 text-sm md:text-base leading-relaxed line-clamp-3 max-w-xl font-medium">
              {displayMovie.description 
                ? displayMovie.description.replace(/<[^>]*>/g, '').slice(0, 250) + (displayMovie.description.length > 250 ? '...' : '')
                : 'Trải nghiệm điện ảnh đỉnh cao cùng CINEVINA.'}
            </p>
            
            <div className="flex items-center gap-4 mt-4">
              <Link to={`/phim/${displayMovie.slug}`}>
                <button className="flex items-center gap-2 px-8 py-3.5 rounded-full font-black text-white text-sm transition-all hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(175,37,254,0.4)] focus:outline-none focus-visible:ring-4 focus-visible:ring-white"
                  style={{ background: 'linear-gradient(135deg,#af25fe,#7c3aed)' }}>
                  <PlayIcon className="w-5 h-5" /> XEM NGAY
                </button>
              </Link>
              <Link to={`/phim/${displayMovie.slug}`}>
                <button className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-white text-sm border border-white/20 hover:bg-white/10 transition-all backdrop-blur-md focus:outline-none focus-visible:ring-4 focus-visible:ring-white">
                  <InformationCircleIcon className="w-5 h-5" /> CHI TIẾT
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
    <Link to={`/phim/${movie.slug}`} className="relative flex items-end shrink-0 group cursor-pointer pl-6 md:pl-10">
      <span className="absolute left-0 bottom-4 z-10 select-none font-display font-black leading-none italic pointer-events-none transition-transform group-hover:scale-110 group-hover:-rotate-6 duration-500"
        style={{ fontSize: '8rem', WebkitTextStroke: '2px rgba(255,255,255,0.2)', color: 'transparent' }}>
        {rank}
      </span>
      <div className="relative w-[130px] md:w-[160px] aspect-[2/3] rounded-xl overflow-hidden shrink-0 shadow-2xl border border-white/10 group-hover:shadow-[0_0_30px_rgba(175,37,254,0.4)] transition-all duration-300">
        <img
          src={imgSrc}
          alt={movie.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          onError={() => {
            if (imgSrc !== movie.thumbUrl && movie.thumbUrl) {
              setImgSrc(movie.thumbUrl);
            } else {
              setImgSrc('/fallback-poster.svg');
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
        
        {/* Badge chất lượng */}
        {movie.quality && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold bg-purple-600 text-white rounded shadow-lg">
            {movie.quality}
          </span>
        )}
      </div>
    </Link>
  );
};

const LiveCard: React.FC<{ ch: typeof LIVE_CHANNELS[0] }> = ({ ch }) => (
  <Link to="/live" className="shrink-0 w-[200px] md:w-[240px] group snap-start">
    <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 group-hover:border-red-500/40 transition-all duration-300 shadow-lg"
      style={{ background: `linear-gradient(135deg, ${ch.color}20, ${ch.color}05)` }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="text-4xl group-hover:scale-125 transition-transform duration-500">{ch.emoji}</span>
        <span className="font-display font-black text-xl text-white tracking-widest">{ch.name}</span>
      </div>
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
      </div>
    </div>
    <div className="mt-3">
      <p className="text-sm font-bold text-white group-hover:text-red-500 transition-colors truncate uppercase tracking-tight">{ch.name}</p>
      <p className="text-xs text-white/40 truncate italic">{ch.program}</p>
    </div>
  </Link>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Queries
  const recentQ  = useMovies({ category: 'phim-moi-cap-nhat', page: 1 });
  const trendingQ = useTrendingMovies(10);
  const cinemaQ  = useCinemaMovies(1);
  const seriesQ  = useMovies({ category: 'phim-bo', page: 1 });
  const animeQ   = useMovies({ category: 'hoat-hinh', page: 1 });
  const comedyQ  = useMovies({ genre: 'hai-huoc', page: 1 });
  const horrorQ  = useMovies({ genre: 'kinh-di', page: 1 });
  
  // Specific Countries
  const vnQ      = useMovies({ country: 'viet-nam', page: 1 });
  const krQ      = useMovies({ country: 'han-quoc', page: 1 });
  const cnQ      = useMovies({ country: 'trung-quoc', page: 1 });
  const usQ      = useMovies({ country: 'au-my', page: 1 });

  const heroMovies = (recentQ.data || []).slice(0, 6);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heroMovies.length > 1) {
      intervalRef.current = setInterval(() => setHeroIdx(i => (i + 1) % heroMovies.length), 6000);
    }
  }, [heroMovies.length]);

  useEffect(() => { 
    startInterval(); 
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; 
  }, [startInterval]);

  return (
    <div className="flex flex-col pb-24 md:pb-12 bg-[#0F1117] min-h-screen">
      
      {/* ── 1. HERO SLIDER ─────────────────────────────────────────────── */}
      <section className="relative w-full h-[56vh] sm:h-[62vh] lg:h-[68vh] max-h-[700px] min-h-[400px] overflow-hidden bg-black">
        {heroMovies.length === 0 && !recentQ.isLoading && (
          <div className="absolute inset-0 bg-[#11131a] flex items-center justify-center">
             <p className="text-white/20 italic uppercase tracking-widest font-black">Chưa có dữ liệu banner</p>
          </div>
        )}
        {recentQ.isLoading && (
          <div className="absolute inset-0 bg-[#11131a] animate-pulse flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {heroMovies.map((m, i) => <HeroBanner key={m.id} movie={m} isActive={i === heroIdx} />)}
        
        {/* Dot Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {heroMovies.map((_, i) => (
            <button key={i} onClick={() => { setHeroIdx(i); startInterval(); }}
              className={`h-1.5 transition-all duration-500 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${i === heroIdx ? 'w-10 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]' : 'w-3 bg-white/30 hover:bg-white/50'}`} />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-10 md:gap-14 mt-8 md:mt-12 max-w-[1440px] mx-auto w-full">
        
        {/* ── 2. TOP 10 HÔM NAY ────────────────────────────────────────── */}
        <section className="px-4 md:px-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🏆</span>
            <h2 className="font-display text-2xl font-black text-white tracking-tight uppercase italic">Top 10 Hôm Nay</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-6 pr-10">
            {(trendingQ.data || []).map((m, i) => (
              <div key={m.id} className="snap-start"><Top10Card movie={m} rank={i + 1} /></div>
            ))}
          </div>
        </section>

        {/* ── 3. MỚI CẬP NHẬT ─────────────────────────────────────────── */}
        <Carousel title="Mới Cập Nhật" emoji="⚡" isLoading={recentQ.isLoading} error={recentQ.error}
          onRetry={recentQ.refetch} viewAllLink="/browse/phim-moi-cap-nhat">
          {recentQ.data?.map(m => (
            <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />
          ))}
        </Carousel>

        {/* ── 4. PHIM CHIẾU RẠP ────────────────────────────────────────── */}
        <Carousel title="Phim Chiếu Rạp" emoji="🎬" badge="ĐANG CHIẾU" isLoading={cinemaQ.isLoading} error={cinemaQ.error}
          onRetry={cinemaQ.refetch} viewAllLink="/browse/phim-chieu-rap">
          {cinemaQ.data?.map(m => (
            <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />
          ))}
        </Carousel>

        {/* ── 5. PHIM BỘ ĐANG HOT ─────────────────────────────────────── */}
        <Carousel title="Phim Bộ Đang Hot" emoji="📺" isLoading={seriesQ.isLoading} error={seriesQ.error}
          onRetry={seriesQ.refetch} viewAllLink="/browse/phim-bo">
          {seriesQ.data?.map(m => (
            <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />
          ))}
        </Carousel>

        {/* ── 6. THEO QUỐC GIA ────────────────────────────────────────── */}
        <section className="px-4 md:px-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🌍</span>
            <h2 className="font-display text-xl md:text-2xl font-black text-white tracking-tight uppercase italic">Theo Quốc Gia</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {COUNTRIES.map(c => (
              <button key={c.slug} onClick={() => navigate(`/browse/${c.slug}`)}
                className={`flex items-center gap-3 px-6 py-3.5 rounded-full bg-gradient-to-br ${c.color} border border-white/5 hover:border-white/20 transition-all hover:scale-105 group`}>
                <span className="text-xl group-hover:scale-125 transition-transform">{c.emoji}</span>
                <span className="font-bold text-white/90 group-hover:text-white uppercase tracking-widest text-[11px]">{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 7. CÁC ROW QUỐC GIA ── */}
        <Carousel title="Phim Việt Nam" emoji="🇻🇳" isLoading={vnQ.isLoading} error={vnQ.error}
          onRetry={vnQ.refetch} viewAllLink="/browse/viet-nam">
          {vnQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />)}
        </Carousel>

        <Carousel title="Phim Hàn Quốc" emoji="🇰🇷" isLoading={krQ.isLoading} error={krQ.error}
          onRetry={krQ.refetch} viewAllLink="/browse/han-quoc">
          {krQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />)}
        </Carousel>

        <Carousel title="Phim Trung Quốc" emoji="🇨🇳" isLoading={cnQ.isLoading} error={cnQ.error}
          onRetry={cnQ.refetch} viewAllLink="/browse/trung-quoc">
          {cnQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />)}
        </Carousel>

        <Carousel title="Phim Âu Mỹ" emoji="🇺🇸" isLoading={usQ.isLoading} error={usQ.error}
          onRetry={usQ.refetch} viewAllLink="/browse/au-my">
          {usQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />)}
        </Carousel>

        {/* ── 8. ANIME & THỂ LOẠI ── */}
        <Carousel title="Anime Mới Nhất" emoji="🎌" isLoading={animeQ.isLoading} error={animeQ.error}
          onRetry={animeQ.refetch} viewAllLink="/browse/hoat-hinh">
          {animeQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />)}
        </Carousel>

        <Carousel title="Phim Hài - Giải Trí" emoji="😂" isLoading={comedyQ.isLoading} error={comedyQ.error}
          onRetry={comedyQ.refetch} viewAllLink="/browse/hai-huoc">
          {comedyQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />)}
        </Carousel>

        <Carousel title="Phim Kinh Dị" emoji="👻" isLoading={horrorQ.isLoading} error={horrorQ.error}
          onRetry={horrorQ.refetch} viewAllLink="/browse/kinh-di">
          {horrorQ.data?.map(m => <MovieCard key={m.slug} {...m} className="w-[140px] md:w-[180px] lg:w-[200px] shrink-0 snap-start" />)}
        </Carousel>

        {/* ── 9. KHÁM PHÁ THEO THỂ LOẠI ── */}
        <section className="px-4 md:px-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🎭</span>
            <h2 className="font-display text-xl md:text-2xl font-black text-white tracking-tight uppercase">Khám Phá Theo Thể Loại</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {GENRES.map(g => (
              <button key={g.slug} onClick={() => navigate(`/browse/${g.slug}`)}
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-br ${g.color} opacity-90 hover:opacity-100 transition-all hover:scale-[1.03] hover:shadow-2xl group shadow-lg`}>
                <span className="text-4xl group-hover:scale-125 transition-transform duration-500 drop-shadow-md">{g.emoji}</span>
                <span className="font-display font-black text-white text-sm tracking-widest uppercase">{g.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── 10. LIVE TV ─────────────────────────────────────────────── */}
        <section className="px-4 md:px-8 pb-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
              <h2 className="font-display text-2xl font-black text-white tracking-tight uppercase">Live TV</h2>
            </div>
            <Link to="/live" className="text-xs font-bold text-purple-400 hover:text-white transition-all uppercase tracking-widest">Xem tất cả →</Link>
          </div>
          <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x pr-10">
            {LIVE_CHANNELS.map(ch => <LiveCard key={ch.id} ch={ch} />)}
          </div>
        </section>

      </div>
    </div>
  );
};
