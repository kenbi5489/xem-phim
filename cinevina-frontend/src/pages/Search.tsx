import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  FireIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { MovieCard } from '../components/ui/MovieCard';
import { useSearchMovies, useDebounce } from '../hooks/useMovies';
import type { MovieInfo } from '../services/api';

type FilterCategory = 'all' | 'single' | 'series' | 'hoathinh' | 'cinema';

interface CategoryFilter {
  key: FilterCategory;
  label: string;
}

const CATEGORIES: CategoryFilter[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'single', label: 'Phim lẻ' },
  { key: 'series', label: 'Phim bộ' },
  { key: 'hoathinh', label: 'Anime / Hoạt hình' },
  { key: 'cinema', label: 'Chiếu rạp' },
];

export const Search: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const urlQ = new URLSearchParams(location.search).get('q') || '';
  const [input, setInput] = useState(urlQ);
  const debouncedQuery = useDebounce(input, 250);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');

  // Load search history
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cinevina_search_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not load search history');
    }
  }, []);

  const addToHistory = (query: string) => {
    const q = query.trim();
    if (q.length < 2) return;
    setHistory((prev) => {
      const next = [q, ...prev.filter((i) => i.toLowerCase() !== q.toLowerCase())].slice(0, 10);
      try {
        localStorage.setItem('cinevina_search_history', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const removeHistory = (query: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHistory((prev) => {
      const next = prev.filter((i) => i.toLowerCase() !== query.toLowerCase());
      try {
        localStorage.setItem('cinevina_search_history', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    setInput(urlQ);
  }, [urlQ]);

  // Sync URL with debounced query
  useEffect(() => {
    const q = debouncedQuery.trim();
    const currentQ = new URLSearchParams(location.search).get('q') || '';
    if (q !== currentQ) {
      if (q.length >= 2) {
        addToHistory(q);
        navigate(`/search?q=${encodeURIComponent(q)}`, { replace: true });
      } else if (!q) {
        navigate('/search', { replace: true });
      }
    }
  }, [debouncedQuery]);

  const { data: results, isLoading, error } = useSearchMovies(debouncedQuery.trim());

  // Filter results by selected category
  const filteredResults = useMemo(() => {
    if (!results || results.length === 0) return [];
    if (selectedCategory === 'all') return results;

    return results.filter((m: MovieInfo) => {
      const type = (m.type || '').toLowerCase();
      const cat = (m.categories || '').toLowerCase();

      switch (selectedCategory) {
        case 'single':
          return type === 'single';
        case 'series':
          return type === 'series';
        case 'hoathinh':
          return type === 'hoathinh' || type === 'hoat-hinh' || cat.includes('hoạt hình') || cat.includes('anime');
        case 'cinema':
          return m.isCinema === true || cat.includes('chiếu rạp');
        default:
          return true;
      }
    });
  }, [results, selectedCategory]);

  const clearSearch = () => {
    setInput('');
    navigate('/search', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] pt-24 sm:pt-28 pb-28 lg:pb-16 px-4 md:px-8 flex flex-col">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-6 sm:gap-8">
        {/* ── Search Header & Input ── */}
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <div className="relative flex items-center">
            <div className="absolute left-4 sm:left-5 w-5 h-5 text-[var(--color-text-3)] pointer-events-none">
              <MagnifyingGlassIcon />
            </div>
            <input
              id="search-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') clearSearch();
              }}
              placeholder="Tìm kiếm phim, diễn viên, đạo diễn..."
              autoFocus
              className="w-full pl-12 sm:pl-14 pr-12 sm:pr-14 py-3.5 sm:py-4 rounded-[14px] bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-1)] placeholder-[var(--color-text-3)] text-[15px] sm:text-[16px] font-medium focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all shadow-lg"
            />
            {input && (
              <button
                onClick={clearSearch}
                className="absolute right-3.5 sm:right-4 p-1.5 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors active:scale-95"
                aria-label="Xóa từ khóa"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          {debouncedQuery.trim().length >= 2 && results && results.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar -mx-2 px-2">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-text-3)] shrink-0 mr-1 hidden sm:flex">
                <FunnelIcon className="w-3.5 h-3.5" /> Lọc:
              </div>
              {CATEGORIES.map((cat) => {
                const count =
                  cat.key === 'all'
                    ? results.length
                    : results.filter((m) => {
                        const type = (m.type || '').toLowerCase();
                        const c = (m.categories || '').toLowerCase();
                        if (cat.key === 'single') return type === 'single';
                        if (cat.key === 'series') return type === 'series';
                        if (cat.key === 'hoathinh')
                          return type === 'hoathinh' || type === 'hoat-hinh' || c.includes('hoạt hình') || c.includes('anime');
                        if (cat.key === 'cinema') return m.isCinema === true || c.includes('chiếu rạp');
                        return true;
                      }).length;

                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3.5 py-1.5 rounded-[20px] text-[12px] sm:text-[13px] font-semibold transition-all whitespace-nowrap active:scale-95 ${
                      selectedCategory === cat.key
                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                        : 'bg-[var(--color-bg-surface)] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] border border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {cat.label} <span className="opacity-70 text-[11px]">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search feedback summary */}
          {debouncedQuery.trim().length >= 2 && !isLoading && (
            <div className="flex items-center justify-between text-[13px] text-[var(--color-text-3)] px-1">
              <span>
                {results && results.length > 0
                  ? `Tìm thấy ${filteredResults.length} phim phù hợp`
                  : `Không tìm thấy kết quả cho "${debouncedQuery.trim()}"`}
              </span>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-[var(--color-primary)] hover:underline font-semibold"
                >
                  Bỏ lọc
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Loading Skeleton Grid ── */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 w-full">
                <div className="w-full aspect-[2/3] bg-[var(--color-bg-surface)] animate-skeleton rounded-[12px]" />
                <div className="h-4 bg-[var(--color-bg-surface)] animate-skeleton rounded w-3/4 mt-1" />
                <div className="h-3 bg-[var(--color-bg-surface)] animate-skeleton rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && !error && debouncedQuery.trim().length >= 2 && filteredResults.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-3)] mb-2">
              <MagnifyingGlassIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-heading text-[24px] sm:text-[28px] text-[var(--color-text-1)] tracking-wide uppercase mb-1">
                Không tìm thấy phim
              </h2>
              <p className="text-[var(--color-text-3)] text-[14px] max-w-md">
                Không có phim nào phù hợp với từ khóa <strong className="text-[var(--color-text-1)]">"{debouncedQuery.trim()}"</strong>
                {selectedCategory !== 'all' && ' trong danh mục này'}. Hãy thử tìm từ khóa khác hoặc khám phá các mục dưới đây.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 justify-center mt-3">
              {[
                { to: '/browse/phim-le', label: 'Phim Lẻ' },
                { to: '/browse/phim-bo', label: 'Phim Bộ' },
                { to: '/browse/hoat-hinh', label: 'Anime & Hoạt hình' },
                { to: '/browse/phim-chieu-rap', label: 'Chiếu Rạp' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="px-5 py-2.5 rounded-[10px] bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:border-[var(--color-primary)] text-[13px] font-semibold transition-all shadow-sm active:scale-95"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Results Unified Grid ── */}
        {!isLoading && !error && filteredResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredResults.map((m) => (
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
        )}

        {/* ── Initial State (No Query) ── */}
        {!isLoading && !error && !debouncedQuery.trim() && (
          <div className="py-12 flex flex-col items-center gap-8 max-w-2xl mx-auto w-full">
            <div className="text-center">
              <h2 className="font-heading text-[30px] sm:text-[36px] text-[var(--color-text-1)] tracking-wide uppercase mb-2">
                Tìm kiếm phim
              </h2>
              <p className="text-[var(--color-text-3)] text-[14px]">
                Nhập tên phim, diễn viên hoặc thể loại để bắt đầu thưởng thức ngay
              </p>
            </div>

            {/* Search History */}
            {history.length > 0 && (
              <div className="flex flex-col gap-3 w-full bg-[var(--color-bg-surface)]/50 p-4 sm:p-5 rounded-[16px] border border-[var(--color-border)]">
                <div className="flex items-center justify-between w-full">
                  <p className="text-[var(--color-text-2)] text-[13px] font-bold flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-[var(--color-primary)]" /> Tìm kiếm gần đây
                  </p>
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('cinevina_search_history');
                    }}
                    className="text-[var(--color-text-3)] hover:text-[var(--color-text-2)] text-[12px] font-medium transition-colors"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 w-full">
                  {history.map((q) => (
                    <div key={q} className="group relative flex items-center">
                      <button
                        onClick={() => setInput(q)}
                        className="px-3.5 py-1.5 pr-8 rounded-[8px] bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-1)] text-[13px] font-medium hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-primary)]/50 transition-all active:scale-95"
                      >
                        {q}
                      </button>
                      <button
                        onClick={(e) => removeHistory(q, e)}
                        className="absolute right-2 p-1 rounded-full text-[var(--color-text-3)] hover:text-[var(--color-text-1)] transition-colors"
                        aria-label={`Xóa ${q}`}
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Popular Searches */}
            <div className="flex flex-col gap-3 w-full">
              <p className="text-[var(--color-text-2)] text-[13px] font-bold flex items-center gap-2">
                <FireIcon className="w-4 h-4 text-[var(--color-primary)]" /> Từ khóa phổ biến
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Lật Mặt 7',
                  'Mai',
                  'Avengers',
                  'One Piece',
                  'Doraemon',
                  'Thám Tử Lừng Danh Conan',
                  'Nữ Hoàng Nước Mắt',
                  'Spider-Man',
                  'Harry Potter',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-4 py-2 rounded-[10px] bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-1)] text-[13px] font-medium hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-primary)]/50 transition-all active:scale-95 shadow-sm"
                  >
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
