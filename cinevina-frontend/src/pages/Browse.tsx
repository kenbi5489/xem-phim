import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MovieCard } from '../components/ui/MovieCard';
import { FunnelIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useMovies } from '../hooks/useMovies';

// ─── Route → API params mapping ──────────────────────────────────────────────
interface RouteParams {
  category?: string;
  country?: string;
  source?: string;
}

const ROUTE_PARAMS: Record<string, RouteParams> = {
  'phim-le':        { category: 'phim-le' },
  'phim-bo':        { category: 'phim-bo' },
  'hoat-hinh':      { category: 'hoat-hinh' },
  'tv-shows':       { category: 'tv-shows' },
  'phim-chieu-rap': { category: 'phim-chieu-rap' },
  'phim-viet':      { country: 'viet-nam' },       // ← country, không phải category
  'phim-han':       { country: 'han-quoc' },
  'han-quoc':       { country: 'han-quoc' },
  'trung-quoc':     { country: 'trung-quoc' },
  'au-my':          { country: 'au-my' },
  'nhat-ban':       { country: 'nhat-ban' },
  'thai-lan':       { country: 'thai-lan' },
  'the-thao':       { source: 'sport_live' },
  'hanh-dong':      { category: 'phim-le', },
  'tinh-cam':       { category: 'phim-le', },
  'kinh-di':        { category: 'phim-le', },
  'hai-huoc':       { category: 'phim-le', },
  'tam-ly':         { category: 'phim-le', },
  'tai-lieu':       { category: 'phim-le', },
  'lich-su':        { category: 'phim-le', },
  'co-trang':       { category: 'phim-le', },
  'vien-tuong':     { category: 'phim-le', },
  'vo-thuat':       { category: 'phim-le', },
};

// Genre slug map (for genre-route categories)
const GENRE_ROUTE_SLUGS: Record<string, string> = {
  'hanh-dong': 'hanh-dong', 'tinh-cam': 'tinh-cam', 'kinh-di': 'kinh-di',
  'hai-huoc': 'hai-huoc', 'tam-ly': 'tam-ly', 'tai-lieu': 'tai-lieu',
  'lich-su': 'lich-su', 'co-trang': 'co-trang', 'vien-tuong': 'vien-tuong', 'vo-thuat': 'vo-thuat',
};

const TYPE_TABS = [
  { id: 'all', name: 'Tất cả' },
  { id: 'phim-le', name: 'Phim lẻ' },
  { id: 'phim-bo', name: 'Phim bộ' },
  { id: 'hoat-hinh', name: 'Anime' },
  { id: 'tv-shows', name: 'TV Show' },
];

const GENRE_FILTERS = [
  'Hành động', 'Tình cảm', 'Kinh dị', 'Hài hước', 'Tâm lý',
  'Hoạt hình', 'Tài liệu', 'Lịch sử', 'Viễn tưởng', 'Võ thuật',
];

const COUNTRY_FILTERS = [
  { id: 'all', name: 'Tất cả' },
  { id: 'viet-nam', name: '🇻🇳 Việt Nam' },
  { id: 'han-quoc', name: '🇰🇷 Hàn Quốc' },
  { id: 'trung-quoc', name: '🇨🇳 Trung Quốc' },
  { id: 'au-my', name: '🇺🇸 Âu Mỹ' },
  { id: 'nhat-ban', name: '🇯🇵 Nhật Bản' },
  { id: 'thai-lan', name: '🇹🇭 Thái Lan' },
];

const YEAR_FILTERS = [
  { id: 'all', name: 'Tất cả năm' },
  { id: '2026', name: '2026' },
  { id: '2025', name: '2025' },
  { id: '2024', name: '2024' },
  { id: '2023', name: '2023' },
  { id: 'older', name: 'Cũ hơn' },
];

const SORT_OPTIONS = [
  { id: 'newest', name: 'Mới nhất' },
  { id: 'rating', name: 'Đánh giá cao' },
  { id: 'views', name: 'Xem nhiều nhất' },
];

interface FilterState {
  type: string;
  genres: string[];
  country: string;
  year: string;
  sort: string;
}

const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  genres: [],
  country: 'all',
  year: 'all',
  sort: 'newest',
};

const FilterDropdown: React.FC<{
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.id === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          value !== 'all' && value !== 'newest'
            ? 'bg-[#d692ff]/20 text-[#d692ff] border border-[#d692ff]/30'
            : 'bg-[#1d1f27] text-white/70 hover:text-white hover:bg-[#23262e] border border-white/8'
        }`}
      >
        {current?.name || label}
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-[#1d1f27] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-30">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/8 ${
                value === opt.id ? 'text-[#d692ff] font-semibold' : 'text-white/70'
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const Browse: React.FC = () => {
  const { category: routeCategory = 'phim-le' } = useParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [showGenrePanel, setShowGenrePanel] = useState(false);

  // Reset filters when route changes
  React.useEffect(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, [routeCategory]);

  // ── Derive API params from route + filters ─────────────────────────────────
  const routeP = ROUTE_PARAMS[routeCategory] ?? { category: routeCategory };
  const isCountryRoute = !!routeP.country && !routeP.category;  // e.g. phim-viet
  const isGenreRoute   = !!GENRE_ROUTE_SLUGS[routeCategory];   // e.g. hanh-dong

  const genreSlugMap: Record<string, string> = {
    'Hành động': 'hanh-dong', 'Tình cảm': 'tinh-cam', 'Kinh dị': 'kinh-di',
    'Hài hước': 'hai-huoc', 'Tâm lý': 'tam-ly', 'Hoạt hình': 'hoat-hinh',
    'Tài liệu': 'tai-lieu', 'Lịch sử': 'lich-su', 'Viễn tưởng': 'vien-tuong', 'Võ thuật': 'vo-thuat',
  };

  // Build the effective API query params
  const activeType = filters.type !== 'all' ? filters.type : null;
  const apiParams = {
    // category: from tab filter override > route default > undefined (for country-routes)
    category: activeType ?? (isCountryRoute ? undefined : (routeP.category ?? 'phim-le')),
    // country: from dropdown filter > route-level country
    country: filters.country !== 'all' ? filters.country : (routeP.country ?? undefined),
    genre: isGenreRoute && !filters.genres.length
      ? GENRE_ROUTE_SLUGS[routeCategory]               // genre from URL route
      : filters.genres.length > 0
        ? genreSlugMap[filters.genres[0]]              // genre from filter chips
        : undefined,
    year:  filters.year  !== 'all'    ? filters.year     : undefined,
    sort:  filters.sort  !== 'newest' ? filters.sort    : undefined,
    source: routeP.source,
    page,
  };

  const { data: movies, isLoading, error, refetch } = useMovies(apiParams);


  const updateFilter = <K extends keyof FilterState>(key: K, val: FilterState[K]) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const toggleGenre = (g: string) => {
    setFilters(f => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter(x => x !== g) : [...f.genres, g],
    }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const hasActiveFilters = filters.genres.length > 0 || filters.country !== 'all' || filters.year !== 'all' || filters.type !== 'all';
  const activeFilterCount = filters.genres.length + (filters.country !== 'all' ? 1 : 0) + (filters.year !== 'all' ? 1 : 0);

  const activeCategoryName = TYPE_TABS.find(t => t.id === filters.type)?.name || 'Danh mục phim';

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 pt-24 pb-24 md:pb-12 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl md:text-4xl font-black text-white">
          {activeCategoryName}
        </h1>
        <p className="text-white/40 text-sm">
          {movies?.length ? `${movies.length}+ bộ phim` : 'Đang tải...'}
        </p>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { updateFilter('type', tab.id); navigate(`/browse/${tab.id === 'all' ? 'phim-moi-cap-nhat' : tab.id}`); }}
            className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              filters.type === tab.id
                ? 'text-[#3a005a] shadow-[0_0_20px_rgba(214,146,255,0.4)]'
                : 'bg-[#1d1f27] text-white/60 hover:text-white hover:bg-[#23262e]'
            }`}
            style={filters.type === tab.id ? { background: 'linear-gradient(135deg, #d692ff, #af25fe)' } : {}}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Genre filter toggle */}
        <button
          onClick={() => setShowGenrePanel(p => !p)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            filters.genres.length > 0
              ? 'bg-[#d692ff]/20 text-[#d692ff] border-[#d692ff]/30'
              : 'bg-[#1d1f27] text-white/70 hover:text-white border-white/8'
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
          Thể loại
          {filters.genres.length > 0 && (
            <span className="bg-[#d692ff] text-[#3a005a] text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
              {filters.genres.length}
            </span>
          )}
        </button>

        <FilterDropdown label="Quốc gia" value={filters.country} options={COUNTRY_FILTERS} onChange={v => updateFilter('country', v)} />
        <FilterDropdown label="Năm" value={filters.year} options={YEAR_FILTERS} onChange={v => updateFilter('year', v)} />
        <FilterDropdown label="Sắp xếp" value={filters.sort} options={SORT_OPTIONS} onChange={v => updateFilter('sort', v)} />

        {/* Active filter chips */}
        {filters.genres.map(g => (
          <button
            key={g}
            onClick={() => toggleGenre(g)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#d692ff]/15 text-[#d692ff] text-xs font-semibold border border-[#d692ff]/25 hover:bg-[#d692ff]/25 transition-colors"
          >
            {g}
            <XMarkIcon className="w-3 h-3" />
          </button>
        ))}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 text-white/50 text-xs font-semibold hover:text-white hover:bg-white/15 transition-colors ml-auto"
          >
            <XMarkIcon className="w-3 h-3" />
            Xóa tất cả ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Genre Panel */}
      {showGenrePanel && (
        <div className="bg-[#11131a] rounded-2xl p-5 border border-white/8 flex flex-wrap gap-2">
          {GENRE_FILTERS.map(g => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                filters.genres.includes(g)
                  ? 'text-[#3a005a] shadow-[0_0_15px_rgba(214,146,255,0.3)]'
                  : 'bg-[#1d1f27] text-white/60 hover:text-white hover:bg-[#23262e]'
              }`}
              style={filters.genres.includes(g) ? { background: 'linear-gradient(135deg, #d692ff, #af25fe)' } : {}}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Movie Grid */}
      {error ? (
        <div className="py-20 flex flex-col items-center gap-4 text-center">
          <p className="text-white/50">Không thể tải danh sách phim.</p>
          <button onClick={() => refetch()} className="px-5 py-2.5 rounded-xl bg-[#d692ff]/20 text-[#d692ff] text-sm font-semibold hover:bg-[#d692ff]/30 transition-colors">
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
          {isLoading
            ? Array.from({ length: 18 }).map((_, i) => (
                <MovieCard key={i} isLoading className="w-full" />
              ))
            : movies?.length
              ? movies.map(m => (
                  <MovieCard
                    key={m.id || m.slug}
                    slug={m.slug}
                    name={m.name}
                    posterUrl={m.posterUrl}
                    thumbUrl={m.thumbUrl}
                    quality={m.quality}
                    lang={m.lang}
                    year={m.year}
                    isStreamable={m.isStreamable}
                    trailerUrl={m.trailerUrl}
                    className="w-full"
                  />
                ))
              : (
                <div className="col-span-full py-20 text-center text-white/40">
                  Không tìm thấy phim nào. Hãy thử thay đổi bộ lọc.
                </div>
              )
          }
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && movies && movies.length > 0 && (
        <div className="flex justify-center items-center gap-3 mt-4">
          {page > 1 && (
            <button onClick={() => setPage(p => p - 1)}
              className="px-6 py-2.5 rounded-xl bg-[#1d1f27] text-white/70 hover:text-white hover:bg-[#23262e] text-sm font-medium border border-white/8 transition-all">
              ← Trang trước
            </button>
          )}
          <span className="px-4 py-2.5 rounded-xl bg-[#11131a] text-white/50 text-sm border border-white/8">
            Trang {page}
          </span>
          <button onClick={() => setPage(p => p + 1)}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-[#3a005a] transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #d692ff, #af25fe)' }}>
            Trang tiếp →
          </button>
        </div>
      )}
    </div>
  );
};
