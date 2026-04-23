import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { movieApi } from '../services/api';
import { MovieCard } from '../components/ui/MovieCard';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

const COUNTRY_SLUGS = [
  "han-quoc", "trung-quoc", "au-my", "nhat-ban",
  "thai-lan", "viet-nam", "an-do", "hong-kong"
];
const CATEGORY_SLUGS = [
  "phim-le", "phim-bo", "hoat-hinh", "tv-shows", "phim-chieu-rap"
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

const SORT_OPTIONS = [
  { value: "modified.time", name: "Mới cập nhật" },
  { value: "year", name: "Năm phát hành" },
  { value: "_id", name: "Ngày đăng" }
];

export const Browse: React.FC = () => {
  const { slug = 'phim-le' } = useParams<{ slug: string }>();
  
  const isCountry = COUNTRY_SLUGS.includes(slug);
  const isCategory = CATEGORY_SLUGS.includes(slug);
  const isGenre = !isCountry && !isCategory;
  
  // Filter states
  const [genreFilter, setGenreFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortFilter, setSortFilter] = useState("modified.time");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [slug, genreFilter, countryFilter, yearFilter]);

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
        page: page,
        genre: genreFilter,
        country: countryFilter,
        year: yearFilter,
        sort: sortFilter
      });
    }
  });

  const getTitle = () => {
    if (isCountry) return `Phim ${COUNTRY_OPTIONS.find(c => c.slug === slug)?.name || slug}`;
    if (isGenre) return `Phim ${GENRE_OPTIONS.find(g => g.slug === slug)?.name || slug}`;
    if (slug === 'phim-le') return 'Phim Lẻ';
    if (slug === 'phim-bo') return 'Phim Bộ';
    if (slug === 'hoat-hinh') return 'Hoạt Hình / Anime';
    if (slug === 'tv-shows') return 'TV Shows';
    if (slug === 'phim-chieu-rap') return 'Phim Chiếu Rạp';
    return 'Khám phá';
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
              <span className="w-2 h-8 bg-purple-600 rounded-full inline-block"></span>
              {getTitle()}
            </h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-5">
              {data?.total ? `${data.total.toLocaleString()} kết quả được tìm thấy` : 'Đang tìm kiếm phim...'}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-10 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 mr-2">
            <FunnelIcon className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Bộ lọc</span>
          </div>

          {(isCountry || isCategory) && (
            <select 
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="bg-[#11131a] border border-white/10 text-white/70 text-[11px] font-bold px-4 py-2 rounded-full focus:border-purple-600 outline-none transition-all uppercase tracking-wider min-w-[140px]"
            >
              <option value="">Tất cả thể loại</option>
              {GENRE_OPTIONS.map(g => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </select>
          )}

          {(isGenre || isCategory) && (
            <select 
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-[#11131a] border border-white/10 text-white/70 text-[11px] font-bold px-4 py-2 rounded-full focus:border-purple-600 outline-none transition-all uppercase tracking-wider min-w-[140px]"
            >
              <option value="">Tất cả quốc gia</option>
              {COUNTRY_OPTIONS.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          )}

          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-[#11131a] border border-white/10 text-white/70 text-[11px] font-bold px-4 py-2 rounded-full focus:border-purple-600 outline-none transition-all uppercase tracking-wider min-w-[100px]"
          >
            <option value="">Tất cả năm</option>
            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select 
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value)}
            className="bg-[#11131a] border border-white/10 text-white/70 text-[11px] font-bold px-4 py-2 rounded-full focus:border-purple-600 outline-none transition-all uppercase tracking-wider min-w-[140px]"
          >
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.name}</option>)}
          </select>

          {(genreFilter || countryFilter || yearFilter || sortFilter !== "modified.time") && (
            <button 
              onClick={() => {
                setGenreFilter("");
                setCountryFilter("");
                setYearFilter("");
                setSortFilter("modified.time");
              }}
              className="p-2 rounded-full bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-lg ml-auto"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Grid Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-8 md:gap-y-10">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCard key={i} isLoading />
            ))}
          </div>
        ) : isError ? (
          <div className="py-32 text-center bg-white/5 rounded-3xl border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tighter italic">Lỗi kết nối API</h3>
            <button onClick={() => refetch()} className="px-8 py-3 rounded-full bg-purple-600 text-white font-black text-[11px] tracking-widest shadow-xl hover:scale-105 transition-all uppercase">Thử lại ngay</button>
          </div>
        ) : data?.items?.length ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-8 md:gap-y-10">
              {data.items.map((movie: any) => (
                <MovieCard key={movie.slug} {...movie} />
              ))}
            </div>

            {/* Pagination */}
            {data.total_pages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-16 pt-10 border-t border-white/5">
                <button 
                  disabled={page === 1}
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="px-6 py-2.5 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all border border-white/10 text-[10px] font-black tracking-widest uppercase"
                >
                  Trang trước
                </button>
                
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-xs shadow-lg">
                  {page}
                </div>

                <button 
                  disabled={page === data.total_pages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="px-6 py-2.5 rounded-full bg-purple-600 text-white shadow-xl hover:scale-105 transition-all text-[10px] font-black tracking-widest uppercase disabled:opacity-20"
                >
                  Trang tiếp
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-32 text-center text-white/30 font-bold uppercase tracking-[0.3em] italic opacity-50">
            Không tìm thấy phim nào phù hợp...
          </div>
        )}
      </div>
    </div>
  );
};
