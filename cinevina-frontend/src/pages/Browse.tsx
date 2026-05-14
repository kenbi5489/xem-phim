import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { movieApi } from '../services/api';
import { MovieCard } from '../components/ui/MovieCard';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  { slug: "the-thao", name: "Thể thao" },
  { slug: "vo-thuat", name: "Võ thuật" },
  { slug: "vien-tuong", name: "Viễn tưởng" },
  { slug: "phieu-luu", name: "Phiêu lưu" },
  { slug: "khoa-hoc", name: "Khoa học" },
  { slug: "kinh-di", name: "Kinh dị" },
  { slug: "am-nhac", name: "Âm nhạc" },
  { slug: "than-thoai", name: "Thần thoại" },
  { slug: "gia-dinh", name: "Gia đình" }
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

const YEAR_OPTIONS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010"];

const RATING_OPTIONS = [
  { value: "10", name: "10 điểm" },
  { value: "9", name: "Từ 9 điểm" },
  { value: "8", name: "Từ 8 điểm" },
  { value: "7", name: "Từ 7 điểm" },
  { value: "under_6", name: "Dưới 6 điểm" }
];

const SORT_OPTIONS = [
  { value: "modified.time", name: "Mới cập nhật" },
  { value: "year", name: "Năm phát hành" },
  { value: "_id", name: "Ngày đăng" }
];

export const Browse: React.FC = () => {
  const { slug = 'phim-le' } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const isCountry = COUNTRY_SLUGS.includes(slug);
  const isCategory = CATEGORY_SLUGS.includes(slug);
  const isGenre = !isCountry && !isCategory;
  
  // Filter states synced with URL
  const genreFilter = searchParams.get('genre') || '';
  const countryFilter = searchParams.get('country') || '';
  const yearFilter = searchParams.get('year') || '';
  const sortFilter = searchParams.get('sort') || 'modified.time';
  const ratingFilter = searchParams.get('rating') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) newParams.set(k, v);
      else newParams.delete(k);
    });
    setSearchParams(newParams);
  };

  const setGenreFilter = (val: string) => updateParams({ genre: val, page: '1' });
  const setCountryFilter = (val: string) => updateParams({ country: val, page: '1' });
  const setYearFilter = (val: string) => updateParams({ year: val, page: '1' });
  const setSortFilter = (val: string) => updateParams({ sort: val, page: '1' });
  const setRatingFilter = (val: string) => updateParams({ rating: val, page: '1' });
  const setPage = (val: number | ((p: number) => number)) => {
    const next = typeof val === 'function' ? val(page) : val;
    updateParams({ page: next.toString() });
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["browse", slug, page, genreFilter, countryFilter, yearFilter, sortFilter],
    queryFn: () => {
      if (isCountry) return movieApi.getMoviesByCountry(slug, page, {
        genre: genreFilter, year: yearFilter, sort: sortFilter
      });
      if (isGenre) return movieApi.getMoviesByGenre(slug, page, {
        country: countryFilter, year: yearFilter, sort: sortFilter
      });
      // Category route — now properly passes year + sort
      return movieApi.getMovies({
        category: slug,
        page,
        genre: genreFilter,
        country: countryFilter,
        year: yearFilter,
        sort: sortFilter,
      });
    },
    staleTime: 30_000, // Cache 30s to avoid re-fetching on every minor state change
  });

  // Client-side filtering cho Điểm đánh giá (do API không hỗ trợ)
  const displayItems = React.useMemo(() => {
    if (!data?.items) return [];
    if (!ratingFilter) return data.items;

    return data.items.filter((movie: any) => {
      const rating = parseFloat(movie.rating) || 0;
      if (ratingFilter === '10') return rating === 10;
      if (ratingFilter === '9') return rating >= 9 && rating < 10;
      if (ratingFilter === '8') return rating >= 8 && rating < 9;
      if (ratingFilter === '7') return rating >= 7 && rating < 8;
      if (ratingFilter === 'under_6') return rating > 0 && rating < 6;
      return true;
    });
  }, [data?.items, ratingFilter]);


  const getTitle = () => {
    if (isCountry) return `Phim ${COUNTRY_OPTIONS.find(c => c.slug === slug)?.name || slug}`;
    if (isGenre) return `Phim ${GENRE_OPTIONS.find(g => g.slug === slug)?.name || slug}`;
    if (slug === 'phim-le') return 'Phim Lẻ';
    if (slug === 'phim-bo') return 'Phim Bộ';
    if (slug === 'hoat-hinh') return 'Hoạt Hình / Anime';
    if (slug === 'tv-shows') return 'TV Shows';
    if (slug === 'phim-chieu-rap') return 'Phim Chiếu Rạp';
    if (slug === 'phim-moi-cap-nhat') return 'Phim Mới Cập Nhật';
    return 'Khám phá';
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-16 px-6 md:px-12">
      <div className="max-w-[1500px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4 text-gradient-primary">
              <span className="w-2.5 h-10 bg-primary rounded-full inline-block shadow-[0_0_15px_rgba(175,37,254,0.6)]"></span>
              {getTitle()}
            </h1>
            <p className="text-white/40 text-[13px] font-black uppercase tracking-[0.3em] mt-3 ml-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              {data?.total ? `${data.total.toLocaleString()} nội dung đỉnh cao` : 'Đang tìm kiếm phim...'}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-premium p-6 md:p-8 rounded-[40px] mb-16 flex flex-wrap gap-5 items-center">
          <div className="flex items-center gap-3 mr-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <FunnelIcon className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-black text-white uppercase tracking-[0.2em] italic">Bộ lọc</span>
          </div>

          <div className="flex flex-wrap gap-4 flex-1">
            {(isCountry || isCategory) && (
              <select 
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="bg-surface-container border border-white/5 text-white/70 text-[12px] font-bold px-6 py-3 rounded-2xl focus:border-primary outline-none transition-all uppercase tracking-wider min-w-[160px] shadow-lg appearance-none cursor-pointer hover:bg-surface-container-high"
              >
                <option value="">Thể loại</option>
                {GENRE_OPTIONS.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
              </select>
            )}

            {(isGenre || isCategory) && (
              <select 
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-surface-container border border-white/5 text-white/70 text-[12px] font-bold px-6 py-3 rounded-2xl focus:border-primary outline-none transition-all uppercase tracking-wider min-w-[160px] shadow-lg appearance-none cursor-pointer hover:bg-surface-container-high"
              >
                <option value="">Quốc gia</option>
                {COUNTRY_OPTIONS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            )}

            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-surface-container border border-white/5 text-white/70 text-[12px] font-bold px-6 py-3 rounded-2xl focus:border-primary outline-none transition-all uppercase tracking-wider min-w-[120px] shadow-lg appearance-none cursor-pointer hover:bg-surface-container-high"
            >
              <option value="">Năm</option>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select 
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              className="bg-surface-container border border-white/5 text-white/70 text-[12px] font-bold px-6 py-3 rounded-2xl focus:border-primary outline-none transition-all uppercase tracking-wider min-w-[160px] shadow-lg appearance-none cursor-pointer hover:bg-surface-container-high"
            >
              {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
            </select>

            <select 
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-surface-container border border-primary/30 text-primary text-[12px] font-bold px-6 py-3 rounded-2xl focus:border-primary outline-none transition-all uppercase tracking-wider min-w-[140px] shadow-lg appearance-none cursor-pointer hover:bg-surface-container-high"
            >
              <option value="">Tất cả điểm</option>
              {RATING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.name}</option>)}
            </select>
          </div>

          {(genreFilter || countryFilter || yearFilter || sortFilter !== "modified.time" || ratingFilter) && (
            <button 
              onClick={() => {
                setGenreFilter("");
                setCountryFilter("");
                setYearFilter("");
                setSortFilter("modified.time");
                setRatingFilter("");
              }}
              className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-xl flex items-center justify-center border border-red-500/30"
              title="Xóa bộ lọc"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Grid Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4 w-full">
                <div className="w-full aspect-[2/3] bg-surface-container-highest animate-pulse rounded-[24px]" />
                <div className="h-4 bg-surface-container-highest animate-pulse rounded-full w-3/4" />
                <div className="h-3 bg-surface-container-highest animate-pulse rounded-full w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-32 text-center glass-premium rounded-[40px] flex flex-col items-center gap-6">
            <span className="text-5xl">📡</span>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Lỗi kết nối API</h3>
            <button onClick={() => refetch()} className="btn-vibrant">THỬ LẠI NGAY</button>
          </div>
        ) : data?.items?.length ? (
          <>
            {displayItems?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-12 md:gap-y-16">
                {displayItems.map((movie: any) => (
                  <MovieCard key={movie.slug} {...movie} />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center glass-premium rounded-[40px] flex flex-col items-center gap-4 opacity-50 border border-white/5">
                <span className="text-4xl">🎬</span>
                <p className="text-xl font-black text-white/40 uppercase tracking-[0.3em] italic">Trang này không có phim phù hợp</p>
                <p className="text-sm text-white/30">Hãy chuyển sang trang tiếp theo để tìm kiếm tiếp</p>
              </div>
            )}

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex justify-center items-center gap-8 mt-24 pt-12 border-t border-white/5">
                <button 
                  disabled={page === 1}
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="px-8 py-3 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all border border-white/10 text-[11px] font-black tracking-widest uppercase"
                >
                  Trước
                </button>
                
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-[0_0_20px_rgba(175,37,254,0.6)] transform rotate-3">
                  {page}
                </div>

                <button 
                  disabled={page === data.total_pages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="btn-vibrant !px-8 !py-3 !text-[11px] !rounded-2xl disabled:opacity-20"
                >
                  Tiếp theo
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-32 text-center glass-premium rounded-[40px] flex flex-col items-center gap-4 opacity-50">
            <span className="text-4xl">🎬</span>
            <p className="text-xl font-black text-white/40 uppercase tracking-[0.3em] italic">Không tìm thấy phim phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
};

