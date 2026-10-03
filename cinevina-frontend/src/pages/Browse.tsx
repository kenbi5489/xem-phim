import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { movieApi } from '../services/api';
import { FunnelIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { MovieCard } from '../components/ui/MovieCard';
import { Button } from '../components/ui/Button';

const COUNTRY_SLUGS = [
  "han-quoc", "trung-quoc", "au-my", "nhat-ban",
  "thai-lan", "viet-nam", "an-do", "hong-kong"
];
const CATEGORY_SLUGS = [
  "phim-le", "phim-bo", "hoat-hinh", "tv-shows", "phim-chieu-rap", "phim-moi-cap-nhat"
];

const GENRE_OPTIONS = [
  { slug: "hanh-dong", name: "Hành động" },
  { slug: "tinh-cam", name: "Tình cảm" },
  { slug: "hai-huoc", name: "Hài hước" },
  { slug: "co-trang", name: "Cổ trang" },
  { slug: "tam-ly", name: "Tâm lý" },
  { slug: "hinh-su", name: "Hình sự" },
  { slug: "chien-tranh", name: "Chiến tranh" },
  { slug: "vo-thuat", name: "Võ thuật" },
  { slug: "vien-tuong", name: "Viễn tưởng" },
  { slug: "phieu-luu", name: "Phiêu lưu" },
  { slug: "khoa-hoc", name: "Khoa học" },
  { slug: "kinh-di", name: "Kinh dị" },
  { slug: "am-nhac", name: "Âm nhạc" },
  { slug: "than-thoai", name: "Thần thoại" },
  { slug: "gia-dinh", name: "Gia đình" },
  { slug: "hoat-hinh", name: "Hoạt hình" },
  { slug: "tai-lieu", name: "Tài liệu" },
  { slug: "bi-an", name: "Bí ẩn" },
  { slug: "hoc-duong", name: "Học đường" },
  { slug: "kinh-dien", name: "Kinh điển" },
];

const COUNTRY_OPTIONS = [
  { slug: "trung-quoc", name: "Trung Quốc" },
  { slug: "han-quoc", name: "Hàn Quốc" },
  { slug: "nhat-ban", name: "Nhật Bản" },
  { slug: "thai-lan", name: "Thái Lan" },
  { slug: "au-my", name: "Âu Mỹ" },
  { slug: "viet-nam", name: "Việt Nam" },
  { slug: "an-do", name: "Ấn Độ" },
  { slug: "hong-kong", name: "Hồng Kông" },
  { slug: "phap", name: "Pháp" },
  { slug: "duc", name: "Đức" }
];

const SOURCE_OPTIONS = [
  { value: "all", name: "Tất cả nguồn (Khuyên dùng)" },
  { value: "nguonc", name: "🌟 Nguồn C (VIP Sub)" },
  { value: "kkphim", name: "⚡ KKPhim (HLS Fast)" }
];

const YEAR_OPTIONS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010"];

const SORT_OPTIONS = [
  { value: "modified.time", name: "Mới cập nhật" },
  { value: "year", name: "Năm phát hành" },
  { value: "_id", name: "Ngày đăng" }
];

export const Browse: React.FC = () => {
  const { slug = 'phim-le' } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isCountry = COUNTRY_SLUGS.includes(slug);
  const isCategory = CATEGORY_SLUGS.includes(slug);
  const isGenre = !isCountry && !isCategory;
  
  const genreFilter = searchParams.get('genre') || '';
  const countryFilter = searchParams.get('country') || '';
  const yearFilter = searchParams.get('year') || '';
  const sortFilter = searchParams.get('sort') || 'modified.time';
  const sourceFilter = searchParams.get('source') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'all') newParams.set(k, v);
      else newParams.delete(k);
    });
    setSearchParams(newParams);
  };

  const setGenreFilter = (val: string) => updateParams({ genre: val, page: '1' });
  const setCountryFilter = (val: string) => updateParams({ country: val, page: '1' });
  const setYearFilter = (val: string) => updateParams({ year: val, page: '1' });
  const setSortFilter = (val: string) => updateParams({ sort: val, page: '1' });
  const setSourceFilter = (val: string) => updateParams({ source: val, page: '1' });
  const setPage = (val: number | ((p: number) => number)) => {
    const next = typeof val === 'function' ? val(page) : val;
    updateParams({ page: next.toString() });
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["browse", slug, page, genreFilter, countryFilter, yearFilter, sortFilter, sourceFilter],
    queryFn: () => {
      if (isCountry) return movieApi.getMoviesByCountry(slug, page, {
        genre: genreFilter, year: yearFilter, sort: sortFilter
      }, sourceFilter);
      if (isGenre) return movieApi.getMoviesByGenre(slug, page, {
        country: countryFilter, year: yearFilter, sort: sortFilter
      }, sourceFilter);
      return movieApi.getMovies({
        category: slug,
        page,
        genre: genreFilter,
        country: countryFilter,
        year: yearFilter,
        sort: sortFilter,
        source: sourceFilter,
      });
    },
    staleTime: 30_000,
  });


  const hasActiveFilters = Boolean(genreFilter || countryFilter || yearFilter || (sourceFilter && sourceFilter !== 'all'));

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const displayItems = React.useMemo(() => {
    if (!data?.items) return [];
    let items = data.items;

    // Strict Category filter enforcement:
    if (slug === 'phim-bo') {
      items = items.filter(m => m.type === 'series' || (m.totalEpisodes && String(m.totalEpisodes) !== '1'));
    } else if (slug === 'phim-le') {
      items = items.filter(m => m.type === 'single' || (m.totalEpisodes && String(m.totalEpisodes) === '1'));
    } else if (slug === 'hoat-hinh') {
      items = items.filter(m => m.type === 'hoathinh' || m.type === 'hoat-hinh' || (m.categories || '').toLowerCase().includes('hoạt hình') || (m.categories || '').toLowerCase().includes('anime'));
    }

    // Strict Country filter enforcement:
    if (countryFilter) {
      items = items.filter(m => {
        if (!m.country && !m.countrySlug) return true;
        const cSlug = (m.countrySlug || '').toLowerCase();
        const cName = (m.country || '').toLowerCase();
        const target = countryFilter.toLowerCase();
        if (cSlug === target) return true;
        if (target === 'han-quoc' && (cName.includes('hàn') || cName.includes('korea'))) return true;
        if (target === 'trung-quoc' && (cName.includes('trung') || cName.includes('china'))) return true;
        if (target === 'au-my' && (cName.includes('mỹ') || cName.includes('âu') || cName.includes('us') || cName.includes('anh') || cName.includes('pháp'))) return true;
        if (target === 'nhat-ban' && (cName.includes('nhật') || cName.includes('japan'))) return true;
        if (target === 'thai-lan' && (cName.includes('thái') || cName.includes('thai'))) return true;
        if (target === 'viet-nam' && (cName.includes('việt') || cName.includes('vietnam'))) return true;
        return false;
      });
    }

    return items;
  }, [data?.items, slug, countryFilter]);

  return (
    <div className="min-h-screen pt-24 pb-28 lg:pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto w-full">
        
        {/* Top Control Bar (No genre title header) */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] sm:text-[14px] text-slate-700 dark:text-slate-300 font-bold">
              {data?.total ? `${data.total.toLocaleString()} bộ phim` : ''}
            </span>
          </div>

          {/* Quick source pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {SOURCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSourceFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                  sourceFilter === opt.value
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Genre Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4 -mx-1 px-1">
          {GENRE_OPTIONS.map(g => {
            const isSelected = isGenre ? slug === g.slug : genreFilter === g.slug;
            return (
              <button
                key={g.slug}
                onClick={() => {
                  if (isGenre) {
                    navigate(`/browse/${g.slug}`);
                  } else {
                    setGenreFilter(isSelected ? '' : g.slug);
                  }
                }}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {g.name}
              </button>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl mb-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 mr-1 text-slate-900 dark:text-slate-100 font-bold text-[13px]">
            <FunnelIcon className="w-4 h-4 text-indigo-600" />
            <span>Lọc:</span>
          </div>

          {(isCountry || isCategory) && (
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] font-semibold px-3 py-2 rounded-xl focus:border-indigo-500 outline-none transition-colors"
            >
              <option value="">Tất cả thể loại</option>
              {GENRE_OPTIONS.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </select>
          )}

          {(isGenre || isCategory) && (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] font-semibold px-3 py-2 rounded-xl focus:border-indigo-500 outline-none transition-colors"
            >
              <option value="">Tất cả quốc gia</option>
              {COUNTRY_OPTIONS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          )}

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] font-semibold px-3 py-2 rounded-xl focus:border-indigo-500 outline-none transition-colors"
          >
            <option value="">Năm phát hành</option>
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[13px] font-semibold px-3 py-2 rounded-xl focus:border-indigo-500 outline-none transition-colors"
          >
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors ml-auto"
            >
              <XMarkIcon className="w-4 h-4" /> Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Movie Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5 lg:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5 w-full min-w-0">
                <div className="w-full aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-3/4 mt-1" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <ExclamationTriangleIcon className="w-12 h-12 text-amber-500" />
            <p className="text-slate-600 dark:text-slate-300 font-semibold">Lỗi tải danh sách phim.</p>
            <Button variant="primary" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <p className="text-slate-600 dark:text-slate-300 text-lg font-bold">Không tìm thấy phim phù hợp</p>
            <p className="text-slate-400 text-sm">Hãy thử chọn lại tiêu chí tìm kiếm hoặc chuyển đổi nguồn phim.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5 lg:gap-6">
            {displayItems.map((movie) => (
              <MovieCard key={movie.slug} {...movie} inGrid={true} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl text-[13px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              ← Trang trước
            </button>
            <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">
              Trang <span className="font-bold text-slate-900 dark:text-white">{page}</span> / {data.total_pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
              disabled={page >= data.total_pages}
              className="px-4 py-2 rounded-xl text-[13px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Trang sau →
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
