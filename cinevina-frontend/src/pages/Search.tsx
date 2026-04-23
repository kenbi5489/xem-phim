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
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-24 md:pb-12 flex flex-col gap-8">

      {/* ── Search Input ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-3">
        <div className="relative flex items-center">
          <MagnifyingGlassIcon className="absolute left-4 w-5 h-5 text-white/40 pointer-events-none" />
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
            className="w-full pl-12 pr-12 py-4 rounded-2xl bg-[#1d1f27] border border-white/10 text-white placeholder-white/30 text-base focus:outline-none focus:border-[#d692ff]/60 focus:shadow-[0_0_0_3px_rgba(214,146,255,0.1)] transition-all"
          />
          {input && (
            <button onClick={clearSearch} className="absolute right-4 text-white/40 hover:text-white transition-colors" aria-label="Xóa">
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Result count */}
        {debouncedQuery.trim().length >= 2 && !isLoading && (
          <p className="text-white/40 text-sm text-center">
            {hasResults
              ? `Tìm thấy ${results!.length} kết quả cho "${debouncedQuery.trim()}"`
              : `Không tìm thấy kết quả nào cho "${debouncedQuery.trim()}"`}
          </p>
        )}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {isLoading && <SearchSkeleton />}

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && !isLoading && (
        <div className="py-20 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">😵</span>
          <p className="text-white/50">Không thể thực hiện tìm kiếm. Hệ thống đang gặp lỗi.</p>
          <button onClick={() => refetch()}
            className="px-5 py-2.5 rounded-xl bg-[#d692ff]/20 text-[#d692ff] text-sm font-semibold hover:bg-[#d692ff]/30 transition-colors">
            Thử lại
          </button>
        </div>
      )}

      {/* ── Empty (has query, no results) ────────────────────────────────── */}
      {!isLoading && !error && debouncedQuery.trim().length >= 2 && !hasResults && (
        <div className="py-20 flex flex-col items-center gap-6 text-center">
          <div className="w-24 h-24 rounded-full bg-[#1d1f27] flex items-center justify-center text-5xl">🔍</div>
          <div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Không tìm thấy kết quả</h2>
            <p className="text-white/40 max-w-sm">
              Thử tìm với từ khóa khác hoặc duyệt theo danh mục bên dưới.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {[
              { to: '/browse/phim-le',   label: '🎬 Phim Lẻ' },
              { to: '/browse/phim-bo',   label: '📺 Phim Bộ' },
              { to: '/browse/hoat-hinh', label: '🌙 Anime' },
              { to: '/browse/phim-chieu-rap', label: '🎭 Chiếu Rạp' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="px-5 py-2.5 rounded-full bg-[#1d1f27] border border-white/10 text-white/65 hover:text-white hover:bg-[#23262e] text-sm font-medium transition-all">
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Results grouped by type ──────────────────────────────────────── */}
      {!isLoading && !error && hasResults && (
        <div className="flex flex-col gap-12">
          {GROUP_ORDER.map(groupKey => {
            const group = grouped[groupKey];
            if (!group || group.length === 0) return null;
            const { label, emoji } = GROUP_LABELS[groupKey];
            return (
              <section key={groupKey}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="font-display text-xl font-bold text-white">
                    {emoji} {label}
                  </h2>
                  <span className="bg-white/8 text-white/45 text-xs font-bold px-2.5 py-1 rounded-full border border-white/8">
                    {group.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
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
        <div className="py-16 flex flex-col items-center gap-5 text-center">
          <div className="text-7xl select-none">🎬</div>
          <div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Tìm phim yêu thích</h2>
            <p className="text-white/40 max-w-sm">Nhập tên phim, diễn viên hoặc thể loại để bắt đầu tìm kiếm</p>
          </div>
          {/* Trending searches */}
          <div className="flex flex-col items-center gap-3 mt-2">
            <p className="text-white/30 text-xs uppercase tracking-wider">Tìm kiếm phổ biến</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Lật mặt', 'Avengers', 'One Piece', 'Song Hye Kyo', 'Doraemon', 'Fast Furious'].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="px-4 py-2 rounded-full bg-[#1d1f27] border border-white/8 text-white/55 hover:text-white hover:bg-[#23262e] text-sm transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
