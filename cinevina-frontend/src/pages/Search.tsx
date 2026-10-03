import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const POPULAR_KEYWORDS = [
  'Giật gân',
  'Kịch tính',
  'Hành động',
  'Kinh dị',
  'Tình cảm',
  'Chiếu rạp 2026',
  'Lật Mặt',
  'Mai',
  'Avatar',
  'Dune',
  'Conan',
  'Anime',
];

export const Search: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const urlQ = new URLSearchParams(location.search).get('q') || '';
  const [input, setInput] = useState(urlQ);
  const debouncedQuery = useDebounce(input, 300);
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
      const next = [q, ...prev.filter((i) => i.toLowerCase() !== q.toLowerCase())].slice(0, 8);
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

  const { data: results, isLoading } = useSearchMovies(debouncedQuery.trim());

  // Auto-detect category filter from search phrase
  useEffect(() => {
    const q = debouncedQuery.toLowerCase();
    if (q.includes('phim bộ') || q.includes('phim bo') || q.includes('series')) {
      setSelectedCategory('series');
    } else if (q.includes('phim lẻ') || q.includes('phim le') || q.includes('movie')) {
      setSelectedCategory('single');
    } else if (q.includes('hoạt hình') || q.includes('hoat hinh') || q.includes('anime')) {
      setSelectedCategory('hoathinh');
    } else if (q.includes('chiếu rạp') || q.includes('chieu rap')) {
      setSelectedCategory('cinema');
    }
  }, [debouncedQuery]);

  // Filter results by selected category and detected country
  const filteredResults = useMemo(() => {
    if (!results || results.length === 0) return [];

    let list = results;

    // Detect country intent from search query to filter out foreign movies
    const qLower = debouncedQuery.toLowerCase();
    let queryCountry = '';
    if (qLower.includes('hàn quốc') || qLower.includes('han quoc') || qLower.includes('korea')) {
      queryCountry = 'han-quoc';
    } else if (qLower.includes('trung quốc') || qLower.includes('trung quoc') || qLower.includes('hoa ngữ')) {
      queryCountry = 'trung-quoc';
    } else if (qLower.includes('âu mỹ') || qLower.includes('au my') || qLower.includes('mỹ') || qLower.includes('hollywood')) {
      queryCountry = 'au-my';
    } else if (qLower.includes('nhật bản') || qLower.includes('nhat ban') || qLower.includes('japan')) {
      queryCountry = 'nhat-ban';
    } else if (qLower.includes('thái lan') || qLower.includes('thai lan') || qLower.includes('thailand')) {
      queryCountry = 'thai-lan';
    } else if (qLower.includes('việt nam') || qLower.includes('viet nam')) {
      queryCountry = 'viet-nam';
    }

    if (queryCountry) {
      list = list.filter((m: MovieInfo) => {
        const slug = (m.countrySlug || '').toLowerCase();
        const name = (m.country || '').toLowerCase();
        if (!slug && !name) return true;
        return slug === queryCountry || name.includes(queryCountry.replace('-', ' '));
      });
    }

    if (selectedCategory === 'all') return list;

    return list.filter((m: MovieInfo) => {
      const type = (m.type || '').toLowerCase();
      const cat = (m.categories || '').toLowerCase();
      const totalEp = Number(m.totalEpisodes) || 0;

      switch (selectedCategory) {
        case 'single':
          return type === 'single' || totalEp <= 1;
        case 'series':
          return type === 'series' || totalEp > 1 || (m.episodeCurrent && m.episodeCurrent.includes('Tập'));
        case 'hoathinh':
          return type === 'hoathinh' || type === 'hoat-hinh' || cat.includes('hoạt hình') || cat.includes('anime');
        case 'cinema':
          return m.isCinema === true || cat.includes('chiếu rạp');
        default:
          return true;
      }
    });
  }, [results, selectedCategory, debouncedQuery]);

  const clearSearch = () => {
    setInput('');
    navigate('/search', { replace: true });
  };

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-28 lg:pb-16 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-6 sm:gap-8">
        
        {/* Search Header & Input */}
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          <div className="text-center mb-2">
            <h1 className="text-[26px] sm:text-[34px] font-heading font-black text-slate-950 dark:text-white tracking-tight">
              Tìm Kiếm Phim
            </h1>
            <p className="text-[13px] sm:text-[14px] text-slate-700 dark:text-slate-300 mt-1 font-semibold">
              Tra cứu nhanh qua hệ thống phim Nguồn C & KKPhim
            </p>
          </div>

          <div className="relative flex items-center">
            <div className="absolute left-4 sm:left-5 w-5 h-5 text-slate-400 pointer-events-none">
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
              placeholder="Nhập tên phim, diễn viên hoặc đạo diễn..."
              autoFocus
              className="w-full pl-12 sm:pl-14 pr-12 sm:pr-14 py-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-[15px] sm:text-[16px] font-semibold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none"
            />
            {input && (
              <button
                onClick={clearSearch}
                className="absolute right-3.5 sm:right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Xóa từ khóa"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          {debouncedQuery.trim().length >= 2 && results && results.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400 shrink-0 mr-1 hidden sm:flex">
                <FunnelIcon className="w-4 h-4 text-indigo-500" /> Lọc:
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
                    className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat.key
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
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
            <div className="flex items-center justify-between text-[13px] text-slate-500 dark:text-slate-400 px-1 font-medium">
              <span>
                {results && results.length > 0
                  ? `Tìm thấy ${filteredResults.length} phim phù hợp`
                  : `Không tìm thấy kết quả nào cho "${debouncedQuery.trim()}"`}
              </span>
            </div>
          )}
        </div>

        {/* History & Popular suggestions (Only when no search input) */}
        {!debouncedQuery.trim() && (
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
            
            {/* Search History */}
            {history.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <ClockIcon className="w-4 h-4 text-slate-400" /> Tìm kiếm gần đây
                  </span>
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('cinevina_search_history');
                    }}
                    className="text-[12px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <div
                      key={h}
                      onClick={() => setInput(h)}
                      className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-slate-700 dark:text-slate-200 text-[13px] font-semibold cursor-pointer shadow-sm transition-all"
                    >
                      <span>{h}</span>
                      <button
                        onClick={(e) => removeHistory(h, e)}
                        className="text-slate-400 hover:text-red-500 rounded-full"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <FireIcon className="w-4 h-4 text-amber-500" /> Từ khóa thịnh hành
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_KEYWORDS.map((k) => (
                  <button
                    key={k}
                    onClick={() => setInput(k)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100 text-[13px] font-semibold transition-colors"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5 lg:gap-6 mt-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5 w-full min-w-0">
                <div className="w-full aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-3/4 mt-1" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5 lg:gap-6 mt-4">
            {filteredResults.map((movie) => (
              <MovieCard key={movie.slug || movie.id} {...movie} inGrid={true} className="w-full" />
            ))}
          </div>
        ) : debouncedQuery.trim().length >= 2 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <p className="text-slate-700 dark:text-slate-300 text-lg font-bold">
              Không tìm thấy phim với từ khóa "{debouncedQuery}"
            </p>
            <p className="text-slate-400 text-sm max-w-sm">
              Hãy kiểm tra lại chính tả hoặc thử tìm kiếm bằng tên tiếng Anh gốc của phim.
            </p>
          </div>
        ) : null}

      </div>
    </div>
  );
};
