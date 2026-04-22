import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayIcon, InformationCircleIcon, ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid';
import { Carousel } from '../components/ui/Carousel';
import { MovieCard } from '../components/ui/MovieCard';
import { useMovies, useCinemaMovies } from '../hooks/useMovies';
import type { MovieInfo } from '../services/api';

// ─── Constants ─────────────────────────────────────────────────────────────
const GENRES = [
  { name: 'Hành động', slug: 'hanh-dong', emoji: '⚔️', from: '#fe7e4f', to: '#ef4444' },
  { name: 'Tình cảm',  slug: 'tinh-cam',  emoji: '💕', from: '#d692ff', to: '#af25fe' },
  { name: 'Kinh dị',   slug: 'kinh-di',   emoji: '👻', from: '#7c3aed', to: '#1e1b4b' },
  { name: 'Hài hước',  slug: 'hai-huoc',  emoji: '😂', from: '#facc15', to: '#f97316' },
  { name: 'Tâm lý',    slug: 'tam-ly',    emoji: '🧠', from: '#60a5fa', to: '#3b82f6' },
  { name: 'Hoạt hình', slug: 'hoat-hinh', emoji: '🎨', from: '#34d399', to: '#059669' },
  { name: 'Anime',     slug: 'hoat-hinh', emoji: '🎌', from: '#f43f5e', to: '#e11d48' },
  { name: 'Lịch sử',  slug: 'lich-su',   emoji: '🏛️', from: '#d97706', to: '#92400e' },
  { name: 'Cổ trang',  slug: 'co-trang',  emoji: '👘', from: '#ec4899', to: '#9d174d' },
  { name: 'Viễn tưởng',slug: 'vien-tuong',emoji: '🚀', from: '#06b6d4', to: '#0e7490' },
  { name: 'TV Show',   slug: 'tv-shows',  emoji: '📺', from: '#8b5cf6', to: '#6d28d9' },
  { name: 'Chiếu Rạp', slug: 'phim-chieu-rap', emoji: '🎬', from: '#f59e0b', to: '#d97706' },
];

const LIVE_CHANNELS = [
  { id: 'vtv1',  name: 'VTV1',  program: 'Thời sự 19h',              emoji: '📺', color: '#1d4ed8' },
  { id: 'vtv3',  name: 'VTV3',  program: 'Bóng đá trực tiếp',         emoji: '⚽', color: '#16a34a' },
  { id: 'vtv6',  name: 'VTV6',  program: 'Phim chiếu rạp',            emoji: '🎬', color: '#7c3aed' },
  { id: 'htv7',  name: 'HTV7',  program: 'Running Man VN',             emoji: '🏃', color: '#dc2626' },
  { id: 'htv9',  name: 'HTV9',  program: 'Phim Việt giờ vàng',        emoji: '🇻🇳', color: '#ea580c' },
  { id: 'kplus', name: 'K+',    program: 'Champions League',          emoji: '🏆', color: '#0891b2' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

const HeroSlide: React.FC<{ movie: MovieInfo; isActive: boolean }> = ({ movie, isActive }) => (
  <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
    <div className="absolute inset-0">
      <div 
        className="w-full h-full bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: `url("${movie.poster_url || movie.thumb_url || ""}")`,
          backgroundColor: '#0F1117'
        }}
      />
      {/* Gradient overlays exactly as spec */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #0F1117 35%, transparent 70%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0F1117 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,17,23,0.4) 0%, transparent 20%)' }} />
    </div>
    <div className="absolute bottom-0 left-0 w-full">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pb-24 md:pb-14 flex items-end gap-8">
        <div className="flex-1 max-w-xl flex flex-col gap-3">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {movie.is_cinema && (
              <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> ĐANG CHIẾU
              </span>
            )}
            {movie.quality && <span className="bg-[#d692ff] text-[#3a005a] text-xs font-black px-2 py-0.5 rounded-sm uppercase">{movie.quality}</span>}
            {movie.lang && <span className="bg-white/15 text-white text-xs font-semibold px-2 py-0.5 rounded-sm backdrop-blur-sm">{movie.lang}</span>}
            {movie.year && <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded-sm">{movie.year}</span>}
            <span className="flex items-center gap-0.5 bg-yellow-500/15 text-yellow-400 text-xs font-semibold px-2 py-0.5 rounded-sm">
              <StarIcon className="w-3 h-3" /> 8.5
            </span>
          </div>
          {/* Title */}
          <h1 className="font-display font-black text-4xl md:text-6xl text-white leading-tight drop-shadow-2xl">{movie.title}</h1>
          {movie.original_title && <p className="text-white/50 text-sm -mt-1 italic">{movie.original_title}</p>}
          {/* Description */}
          <p className="text-white/65 text-sm md:text-base leading-relaxed line-clamp-2 max-w-lg">
            {movie.description
              ? movie.description.replace(/<[^>]*>/g, '').substring(0, 160) + '…'
              : 'Khám phá câu chuyện hấp dẫn này trên CINEVINA.'}
          </p>
          {/* CTAs */}
          <div className="flex items-center gap-3 mt-1">
            <Link to={`/phim/${movie.slug}`}>
              <button className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#d692ff,#af25fe)', boxShadow: '0 0 28px rgba(214,146,255,0.5)' }}>
                <PlayIcon className="w-5 h-5" /> Xem ngay
              </button>
            </Link>
            <Link to={`/phim/${movie.slug}`}>
              <button className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white text-sm border border-white/30 hover:bg-white/10 transition-all backdrop-blur-sm">
                <InformationCircleIcon className="w-5 h-5" /> Chi tiết
              </button>
            </Link>
          </div>
        </div>
        {/* Sidebar poster (md+) */}
        <div className="hidden md:block shrink-0 w-32 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          <img
            src={movie.thumb_url || movie.poster_url || ""}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallbackApplied === "true") return;
              if (movie.poster_url && img.src !== movie.poster_url) {
                img.dataset.fallbackApplied = "true";
                img.src = movie.poster_url;
                return;
              }
              img.dataset.fallbackApplied = "true";
              img.src = "/fallback-poster.svg";
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

const Top10Card: React.FC<{ movie: MovieInfo; rank: number }> = ({ movie, rank }) => (
  <Link to={`/phim/${movie.slug}`} className="relative flex items-end shrink-0 group cursor-pointer">
    <span className="absolute left-0 bottom-8 z-10 select-none font-display font-black leading-none"
      style={{ fontSize: '5.5rem', WebkitTextStroke: '2px rgba(255,255,255,0.12)', color: 'transparent' }}>
      {rank}
    </span>
    <div className="ml-10 w-[130px] md:w-[148px] aspect-[2/3] rounded-xl overflow-hidden shrink-0 shadow-xl border border-white/10 group-hover:shadow-[0_0_25px_rgba(214,146,255,0.3)] transition-all duration-300">
      <img
        src={movie.poster_url || movie.thumb_url || ""}
        alt={movie.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.fallbackApplied === "true") return;
          if (movie.thumb_url && img.src !== movie.thumb_url) {
            img.dataset.fallbackApplied = "true";
            img.src = movie.thumb_url;
            return;
          }
          img.dataset.fallbackApplied = "true";
          img.src = "/fallback-poster.svg";
        }}
      />
    </div>
  </Link>
);

const CinemaCard: React.FC<{ movie: MovieInfo }> = ({ movie }) => (
  <Link to={`/phim/${movie.slug}`} className="shrink-0 w-[150px] md:w-[180px] group">
    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-yellow-500/30 group-hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all duration-300"
      style={{ boxShadow: '0 0 0 1px rgba(234,179,8,0.15)' }}>
      <img
        src={movie.poster_url || movie.thumb_url || ""}
        alt={movie.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.fallbackApplied === "true") return;
          if (movie.thumb_url && img.src !== movie.thumb_url) {
            img.dataset.fallbackApplied = "true";
            img.src = movie.thumb_url;
            return;
          }
          img.dataset.fallbackApplied = "true";
          img.src = "/fallback-poster.svg";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute top-2 left-2">
        <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> ĐANG CHIẾU
        </span>
      </div>
    </div>
    <p className="mt-2 text-sm font-semibold text-white/90 line-clamp-2 leading-tight">{movie.title}</p>
    {movie.year && <p className="text-xs text-yellow-500/70 mt-0.5">{movie.year}</p>}
  </Link>
);

const LiveCard: React.FC<{ ch: typeof LIVE_CHANNELS[0] }> = ({ ch }) => (
  <Link to="/live" className="shrink-0 w-[180px] md:w-[200px] group">
    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/8 group-hover:border-red-500/40 transition-all duration-300"
      style={{ background: `linear-gradient(135deg, ${ch.color}30, ${ch.color}08)` }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="text-4xl">{ch.emoji}</span>
        <span className="font-display font-black text-xl text-white">{ch.name}</span>
      </div>
      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
      </div>
    </div>
    <p className="mt-2 text-sm font-bold text-white/90 truncate">{ch.name}</p>
    <p className="text-xs text-white/50 truncate">{ch.program}</p>
  </Link>
);

// ─── Section Rail helper ─────────────────────────────────────────────────────
interface RailProps {
  title: string;
  icon?: string;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  items?: MovieInfo[];
  viewAllLink?: string;
}
const Rail: React.FC<RailProps> = ({ title, icon, isLoading, error, refetch, items, viewAllLink }) => {
  // Hide section only when done loading AND has zero items (no error)
  if (!isLoading && !error && (!items || items.length === 0)) return null;
  return (
    <Carousel
      title={icon ? `${icon} ${title}` : title}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      viewAllLink={viewAllLink}
    >
      {items?.map(m => (
        <MovieCard
          key={m.id || m.slug}
          slug={m.slug}
          title={m.title}
          poster_url={m.poster_url}
          thumb_url={m.thumb_url}
          quality={m.quality}
          lang={m.lang}
          year={m.year}
          description={m.description}
          isCinema={m.is_cinema}
          isStreamable={m.is_streamable}
          trailerUrl={m.trailer_url}
        />
      ))}
    </Carousel>
  );
};

// ─── Main ────────────────────────────────────────────────────────────────────
export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recentQ  = useMovies({ category: 'phim-le', page: 1 });
  const seriesQ  = useMovies({ category: 'phim-bo', page: 1 });
  const animeQ   = useMovies({ category: 'hoat-hinh', page: 1 });
  const singleQ  = useMovies({ category: 'phim-le', page: 2 });
  const vietQ    = useMovies({ category: 'phim-bo', country: 'viet-nam', page: 1 });
  const koreanQ  = useMovies({ category: 'phim-bo', country: 'han-quoc', page: 1 });
  const hamQ     = useMovies({ genre: 'hai-huoc', page: 1 });
  const cinemaQ  = useCinemaMovies(1);

  const heroMovies = [...(seriesQ.data || []), ...(singleQ.data || [])].slice(0, 5);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heroMovies.length > 1) {
      intervalRef.current = setInterval(() => setHeroIdx(i => (i + 1) % heroMovies.length), 8000);
    }
  }, [heroMovies.length]);

  useEffect(() => { startInterval(); return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, [startInterval]);

  const goHero = (idx: number) => { setHeroIdx(idx); startInterval(); };

  return (
    <div className="flex flex-col pb-24 md:pb-12">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative w-full h-[75vh] md:h-[88vh] overflow-hidden" style={{ background: '#0F1117' }}>
        {heroMovies.length === 0 && (
          <div className="absolute inset-0 animate-pulse" style={{ background: 'linear-gradient(135deg,#11131a,#0c0e14)' }} />
        )}
        {heroMovies.map((m, i) => <HeroSlide key={m.id} movie={m} isActive={i === heroIdx} />)}

        {heroMovies.length > 1 && <>
          <button onClick={() => goHero((heroIdx - 1 + heroMovies.length) % heroMovies.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 border border-white/10 text-white/60 hover:text-white hover:bg-black/60 transition-all hidden md:flex">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button onClick={() => goHero((heroIdx + 1) % heroMovies.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 border border-white/10 text-white/60 hover:text-white hover:bg-black/60 transition-all hidden md:flex">
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>}

        {heroMovies.length > 1 && (
          <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2">
            {heroMovies.map((_, i) => (
              <button key={i} onClick={() => goHero(i)}
                className={`rounded-full transition-all duration-300 ${i === heroIdx ? 'w-6 h-2 bg-[#d692ff]' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* ── RAILS ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-10 mt-10">

        {/* 1 — Phim Chiếu Rạp */}
        {!cinemaQ.isLoading && cinemaQ.data && cinemaQ.data.length > 0 && (
          <section>
            <div className="px-4 md:px-8 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎬</span>
                <h2 className="font-display text-xl font-bold text-white">Phim Chiếu Rạp</h2>
                <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> ĐANG CHIẾU
                </span>
              </div>
              <Link to="/browse/phim-chieu-rap" className="text-sm text-[#d692ff] hover:text-[#af25fe] transition-colors">Xem tất cả →</Link>
            </div>
            <div className="px-4 md:px-8 flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-2">
              {cinemaQ.data.map(m => <div key={m.id} className="snap-start"><CinemaCard movie={m} /></div>)}
            </div>
          </section>
        )}

        {/* 2 — Top 10 */}
        <section>
          <div className="px-4 md:px-8 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <h2 className="font-display text-xl font-bold text-white">Top 10 Hôm Nay</h2>
            </div>
            <Link to="/browse/phim-le" className="text-sm text-[#d692ff] hover:text-[#af25fe] transition-colors">Xem tất cả →</Link>
          </div>
          <div className="px-4 md:px-8 flex gap-3 overflow-x-auto scrollbar-hide snap-x pb-4">
            {singleQ.isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-end gap-1 shrink-0">
                    <div className="w-14 h-20 animate-pulse rounded bg-[#1d1f27]" />
                    <div className="w-[130px] aspect-[2/3] animate-pulse rounded-xl bg-[#1d1f27]" />
                  </div>
                ))
              : (singleQ.data || []).slice(0, 10).map((m, i) => (
                  <div key={m.id} className="snap-start"><Top10Card movie={m} rank={i + 1} /></div>
                ))
            }
          </div>
        </section>

        {/* 3 — Genre Explorer (Nhóm 9) */}
        <section>
          <div className="px-4 md:px-8 mb-5">
            <h2 className="font-display text-xl font-bold text-white">Khám Phá Theo Thể Loại</h2>
          </div>
          <div className="px-4 md:px-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {GENRES.map(g => (
              <button key={g.slug + g.name} onClick={() => navigate(`/browse/${g.slug}`)}
                className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 group"
                style={{ background: `linear-gradient(135deg,${g.from}20,${g.to}08)`, border: `1px solid ${g.from}20` }}>
                <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">{g.emoji}</span>
                <span className="text-xs font-semibold text-white/70 text-center leading-tight group-hover:text-white transition-colors">{g.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 4 — Mới Cập Nhật */}
        <Rail title="Mới Cập Nhật" icon="⚡" isLoading={recentQ.isLoading} error={recentQ.error}
          refetch={recentQ.refetch} items={recentQ.data} viewAllLink="/browse/phim-le" />

        {/* 5 — Phim Bộ Đang Hot */}
        <Rail title="Phim Bộ Đang Hot" icon="📺" isLoading={seriesQ.isLoading} error={seriesQ.error}
          refetch={seriesQ.refetch} items={seriesQ.data} viewAllLink="/browse/phim-bo" />

        {/* 6 — Phim Lẻ Nổi Bật */}
        <Rail title="Phim Lẻ Nổi Bật" icon="🎬" isLoading={singleQ.isLoading} error={singleQ.error}
          refetch={singleQ.refetch} items={singleQ.data} viewAllLink="/browse/phim-le" />

        {/* 7 — Phim Việt Nam */}
        <Rail title="Phim Việt Nam" icon="🇻🇳" isLoading={vietQ.isLoading} error={vietQ.error}
          refetch={vietQ.refetch} items={vietQ.data} viewAllLink="/browse/phim-viet" />

        {/* 8 — Phim Hàn Quốc */}
        <Rail title="Phim Hàn Quốc Hot" icon="🇰🇷" isLoading={koreanQ.isLoading} error={koreanQ.error}
          refetch={koreanQ.refetch} items={koreanQ.data} viewAllLink="/browse/phim-bo?country=han-quoc" />

        {/* 9 — Phim Hài */}
        <Rail title="Phim Hài - Giải Trí" icon="😂" isLoading={hamQ.isLoading} error={hamQ.error}
          refetch={hamQ.refetch} items={hamQ.data} viewAllLink="/browse/hai-huoc" />

        {/* 10 — Anime */}
        <Rail title="Anime Đang Chiếu" icon="🌙" isLoading={animeQ.isLoading} error={animeQ.error}
          refetch={animeQ.refetch} items={animeQ.data} viewAllLink="/browse/hoat-hinh" />

        {/* 11 — Live TV */}
        <section>
          <div className="px-4 md:px-8 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
              <h2 className="font-display text-xl font-bold text-white">Live TV & Thể Thao</h2>
            </div>
            <Link to="/live" className="text-sm text-[#d692ff] hover:text-[#af25fe] transition-colors">Xem tất cả →</Link>
          </div>
          <div className="px-4 md:px-8 flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-4">
            {LIVE_CHANNELS.map(ch => <div key={ch.id} className="snap-start"><LiveCard ch={ch} /></div>)}
          </div>
        </section>

      </div>
    </div>
  );
};
