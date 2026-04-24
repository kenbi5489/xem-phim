import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { MovieCard } from '../components/ui/MovieCard';
import { useSearchMovies, useDebounce } from '../hooks/useMovies';
import type { MovieInfo } from '../services/api';

// ─── Group config ─────────────────────────────────────────────────────────────
const GROUP_ORDER = ['live', 'series', 'single', 'hoathinh', 'tvshows', 'other'] as const;
const GROUP_LABELS: Record<string, { label: string; emoji: string }> = {
  live:     { label: 'Truyền Hình', emoji: '🔴' },
  series:   { label: 'Phim Bộ',    emoji: '📺' },
  single:   { label: 'Phim Lẻ',    emoji: '🎬' },
  hoathinh: { label: 'Anime',      emoji: '🌙' },
  tvshows:  { label: 'TV Show',    emoji: '🎭' },
  other:    { label: 'Phim khác',  emoji: '🎞️' },
};

const groupMovies = (movies: MovieInfo[]) => {
  const groups: Record<string, MovieInfo[]> = {};
  for (const m of movies) {
    let key = (m.type || 'other').toLowerCase();
    const isHoatHinh = key === 'hoathinh' || key === 'hoat-hinh' || m.categories?.toLowerCase().includes('hoạt hình');
    
    if (isHoatHinh) key = 'hoathinh';
    else if (key === 'live') key = 'live';
    else if (key === 'series') key = 'series';
    else if (key === 'single') key = 'single';
    else if (key === 'tvshows' || key === 'tv-shows') key = 'tvshows';
    else key = 'other';
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return groups;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SearchSkeleton: React.FC = () => (
  <div className="flex flex-col gap-10">
    {[1, 2].map(g => (
      <div key={g} className="flex flex-col gap-4">
        <div className="h-6 w-36 bg-[#1d1f27] animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[2/3] bg-[#1d1f27] animate-pulse rounded-2xl" />
              <div className="h-4 bg-[#1d1f27] animate-pulse rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Search: React.FC = () => {
  const location  = useLocation();
  const navigate  = useNavigate();

  // Sync query state with URL ?q=
  const urlQ = new URLSearchParams(location.search).get('q') || '';
  const [input, setInput] = useState(urlQ);
  const debouncedQuery = useDebounce(input, 300);

  // Keep input in sync when URL changes externally (e.g. browser back/forward)
  useEffect(() => { setInput(urlQ); }, [urlQ]);

  // Update URL when debounced value changes
  useEffect(() => {
    const q = debouncedQuery.trim();
    const currentQ = new URLSearchParams(location.search).get('q') || '';
    if (q !== currentQ) {
      if (q.length >= 2) {
        navigate(`/search?q=${encodeURIComponent(q)}`, { replace: true });
      } else if (!q) {
        navigate('/search', { replace: true });
      }
    }
  }, [debouncedQuery]);

  const { data: results, isLoading, error, refetch } = useSearchMovies(debouncedQuery.trim());
  const grouped = results ? groupMovies(results) : {};
  const hasResults = results && results.length > 0;

  const clearSearch = () => {
    setInput('');
    navigate('/search', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-6 md:px-12 flex flex-col gap-12">
      <div className="max-w-[1500px] mx-auto w-full flex flex-col gap-12">
        
        {/* ── Search Input ───────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <div className="relative flex items-center group">
            <div className="absolute left-6 w-6 h-6 text-primary group-focus-within:scale-125 transition-transform duration-500">
              <MagnifyingGlassIcon />
            </div>
            <input
              id="search-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') clearSearch();
              }}
              placeholder="Tìm kiếm phim, diễn viên, đạo diễn..."
              autoFocus
              className="w-full pl-16 pr-16 py-6 rounded-[32px] glass-premium border border-white/10 text-white placeholder-white/30 text-lg md:text-xl font-bold focus:outline-none focus:border-primary focus:shadow-[0_0_40px_rgba(175,37,254,0.2)] transition-all duration-500"
            />
            {input && (
              <button onClick={clearSearch} className="absolute right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all" aria-label="Xóa">
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Result count */}
          {debouncedQuery.trim().length >= 2 && !isLoading && (
            <p className="text-white/40 text-sm font-black uppercase tracking-[0.2em] text-center flex items-center justify-center gap-3 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {hasResults
                ? `Tìm thấy ${results!.length} siêu phẩm cho "${debouncedQuery.trim()}"`
                : `Không tìm thấy kết quả nào cho "${debouncedQuery.trim()}"`}
            </p>
          )}
        </div>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex flex-col gap-16">
            {[1, 2].map(g => (
              <div key={g} className="flex flex-col gap-8">
                <div className="h-8 w-48 bg-surface-container-highest animate-pulse rounded-full" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-4">
                      <div className="aspect-[2/3] bg-surface-container-highest animate-pulse rounded-[24px]" />
                      <div className="h-4 bg-surface-container-highest animate-pulse rounded-full w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && !isLoading && (
          <div className="py-32 flex flex-col items-center gap-8 text-center glass-premium rounded-[40px]">
            <span className="text-7xl animate-bounce">😵</span>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-white uppercase italic">Hệ thống đang bảo trì</h2>
              <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Không thể thực hiện tìm kiếm lúc này</p>
            </div>
            <button onClick={() => refetch()} className="btn-vibrant">THỬ LẠI NGAY</button>
          </div>
        )}

        {/* ── Empty (has query, no results) ────────────────────────────────── */}
        {!isLoading && !error && debouncedQuery.trim().length >= 2 && !hasResults && (
          <div className="py-24 flex flex-col items-center gap-10 text-center glass-premium rounded-[40px]">
            <div className="w-32 h-32 rounded-[40px] bg-surface-container flex items-center justify-center text-6xl shadow-2xl border border-white/5">🔍</div>
            <div>
              <h2 className="font-display text-3xl font-black text-white mb-3 uppercase tracking-tighter italic">Không có kết quả</h2>
              <p className="text-white/40 max-w-sm font-bold uppercase tracking-widest text-xs">
                Hãy thử từ khóa khác hoặc khám phá các danh mục nổi bật dưới đây
              </p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {[
                { to: '/browse/phim-le',   label: '🎬 Phim Lẻ' },
                { to: '/browse/phim-bo',   label: '📺 Phim Bộ' },
                { to: '/browse/hoat-hinh', label: '🌙 Anime' },
                { to: '/browse/phim-chieu-rap', label: '🎭 Chiếu Rạp' },
              ].map(({ to, label }) => (
                <Link key={to} to={to}
                  className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-primary/20 hover:border-primary/40 text-sm font-black uppercase tracking-widest transition-all">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Results grouped by type ──────────────────────────────────────── */}
        {!isLoading && !error && hasResults && (
          <div className="flex flex-col gap-16">
            {GROUP_ORDER.map(groupKey => {
              const group = grouped[groupKey];
              if (!group || group.length === 0) return null;
              const { label, emoji } = GROUP_LABELS[groupKey];
              return (
                <section key={groupKey} className="flex flex-col gap-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-2xl shadow-lg border border-white/5">
                      {emoji}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-4">
                        <h2 className="font-display text-2xl md:text-3xl font-black text-white uppercase italic text-gradient-primary">
                          {label}
                        </h2>
                        <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20 shadow-[0_0_15px_rgba(175,37,254,0.3)]">
                          {group.length} KẾT QUẢ
                        </span>
                      </div>
                      <div className="h-1 w-12 bg-primary rounded-full mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                    {group.map(m => (
                      <MovieCard
                        key={m.id || m.slug}
                        slug={m.slug}
                        name={m.name}
                        posterUrl={m.posterUrl}
                        thumbUrl={m.thumbUrl}
                        quality={m.quality}
                        lang={m.lang}
                        year={m.year}
                        description={m.description}
                        isCinema={m.isCinema}
                        isStreamable={m.isStreamable}
                        trailerUrl={m.trailerUrl}
                        className="w-full"
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ── Initial state (no query) ─────────────────────────────────────── */}
        {!isLoading && !error && !debouncedQuery.trim() && (
          <div className="py-24 flex flex-col items-center gap-10 text-center glass-premium rounded-[40px]">
            <div className="text-8xl select-none animate-float">🎬</div>
            <div>
              <h2 className="font-display text-4xl font-black text-white mb-3 uppercase tracking-tighter italic text-gradient-primary">Tìm kiếm phim</h2>
              <p className="text-white/40 max-w-sm font-bold uppercase tracking-widest text-xs">Nhập tên phim, diễn viên hoặc đạo diễn để bắt đầu</p>
            </div>
            {/* Trending searches */}
            <div className="flex flex-col items-center gap-5 mt-4">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">Xu hướng tìm kiếm</p>
              <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                {['Lật mặt', 'Avengers', 'One Piece', 'Song Hye Kyo', 'Doraemon', 'Fast Furious', 'Spider-Man'].map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-primary/20 hover:border-primary/40 hover:scale-105 text-sm font-black uppercase tracking-widest transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

