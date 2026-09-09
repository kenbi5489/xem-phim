import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { movieApi } from '../services/api';
import { MovieCard } from '../components/ui/MovieCard';
import { FunnelIcon, XMarkIcon, ExclamationTriangleIcon, FilmIcon } from '@heroicons/react/24/outline';
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
      return movieApi.getMovies({
        category: slug,
        page,
        genre: genreFilter,
        country: countryFilter,
        year: yearFilter,
        sort: sortFilter,
      });
    },
    staleTime: 30_000,
  });

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
    <div className="min-h-screen bg-[var(--color-bg-base)] pt-24 pb-28 lg:pb-16 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[36px] md:text-[48px] font-heading text-[var(--color-text-1)] uppercase tracking-wide">
              {getTitle()}
            </h1>
            <p className="text-[var(--color-text-3)] text-[14px] font-medium">
              {data?.total ? `${data.total.toLocaleString()} nội dung` : 'Đang tìm kiếm...'}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-[var(--color-bg-surface)] p-4 md:p-6 rounded-[16px] mb-12 flex flex-wrap gap-4 items-center border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mr-2">
            <FunnelIcon className="w-5 h-5 text-[var(--color-text-2)]" />
            <span className="text-[14px] font-semibold text-[var(--color-text-2)] uppercase tracking-wider">Bộ lọc</span>
          </div>

          <div className="flex flex-wrap gap-3 flex-1">
            {(isCountry || isCategory) && (
              <select 
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--color-text-1)] text-[13px] font-medium px-4 py-2 rounded-[8px] focus:border-[var(--color-primary)] outline-none transition-colors min-w-[140px] appearance-none"
              >
                <option value="">Thể loại</option>
                {GENRE_OPTIONS.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
              </select>
            )}

            {(isGenre || isCategory) && (
              <select 
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--color-text-1)] text-[13px] font-medium px-4 py-2 rounded-[8px] focus:border-[var(--color-primary)] outline-none transition-colors min-w-[140px] appearance-none"
              >
                <option value="">Quốc gia</option>
                {COUNTRY_OPTIONS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            )}

            <select 
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--color-text-1)] text-[13px] font-medium px-4 py-2 rounded-[8px] focus:border-[var(--color-primary)] outline-none transition-colors min-w-[100px] appearance-none"
            >
              <option value="">Năm</option>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select 
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              className="bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--color-text-1)] text-[13px] font-medium px-4 py-2 rounded-[8px] focus:border-[var(--color-primary)] outline-none transition-colors min-w-[140px] appearance-none"
            >
              {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
            </select>

            <select 
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--color-text-1)] text-[13px] font-medium px-4 py-2 rounded-[8px] focus:border-[var(--color-primary)] outline-none transition-colors min-w-[140px] appearance-none"
            >
              <option value="">Điểm đánh giá</option>
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
              className="p-2 rounded-[8px] text-[var(--color-text-2)] hover:text-[var(--color-live)] hover:bg-[var(--color-live-bg)] transition-colors border border-[var(--color-border-subtle)]"
              title="Xóa bộ lọc"
              aria-label="Xóa bộ lọc"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Grid Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 w-full">
                <div className="w-full aspect-[2/3] bg-[var(--color-surface)] animate-skeleton rounded-[var(--radius-card)]" />
                <div className="h-3.5 bg-[var(--color-surface)] animate-skeleton rounded w-3/4 mt-1" />
                <div className="h-3 bg-[var(--color-surface)] animate-skeleton rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-24 text-center bg-[var(--color-surface)] rounded-[var(--radius-card)] flex flex-col items-center gap-4 border border-[var(--color-border-subtle)]">
            <ExclamationTriangleIcon className="w-16 h-16 text-[var(--color-text-muted)]" />
            <h3 className="text-[24px] font-heading text-[var(--color-text-primary)] uppercase">Lỗi kết nối API</h3>
            <p className="text-[14px] text-[var(--color-text-muted)]">Không thể tải dữ liệu. Vui lòng thử lại.</p>
            <Button variant="primary" onClick={() => refetch()}>Thử lại</Button>
          </div>
        ) : data?.items?.length ? (
          <>
            {displayItems?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
                {displayItems.map((movie: any) => (
                  <MovieCard key={movie.slug} {...movie} className="w-full" />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-[var(--color-bg-surface)] rounded-[16px] flex flex-col items-center gap-2 border border-[var(--color-border)]">
                <p className="text-[18px] font-semibold text-[var(--color-text-1)]">Trang này không có phim phù hợp</p>
                <p className="text-[14px] text-[var(--color-text-3)]">Hãy thử xóa bớt bộ lọc hoặc sang trang tiếp theo.</p>
              </div>
            )}

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex flex-col items-center gap-3 mt-12 pt-8 border-t border-[var(--color-border-subtle)]">
                <div className="flex justify-center items-center gap-3">
                  <Button 
                    variant="secondary"
                    disabled={page === 1}
                    onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="w-[100px]"
                  >
                    Trước
                  </Button>
                  
                  <div className="w-10 h-10 rounded-[8px] bg-[var(--color-primary)] flex items-center justify-center text-white font-semibold text-[14px]">
                    {page}
                  </div>

                  <Button 
                    variant="secondary"
                    disabled={page === data.total_pages}
                    onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="w-[100px]"
                  >
                    Tiếp theo
                  </Button>
                </div>
                <p className="text-[13px] text-[var(--color-text-muted)]">Trang {page} / {data.total_pages}</p>
              </div>
            )}
          </>
        ) : (
          <div className="py-24 text-center bg-[var(--color-surface)] rounded-[var(--radius-card)] flex flex-col items-center gap-3 border border-[var(--color-border-subtle)]">
            <FilmIcon className="w-16 h-16 text-[var(--color-text-muted)]" />
            <p className="text-[18px] font-semibold text-[var(--color-text-primary)]">Không tìm thấy phim phù hợp</p>
            <p className="text-[14px] text-[var(--color-text-muted)]">Hãy thử với từ khóa hoặc bộ lọc khác.</p>
          </div>
        )}
      </div>
    </div>
  );
};
