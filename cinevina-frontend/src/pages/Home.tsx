import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, InformationCircleIcon, SparklesIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { Carousel } from '../components/ui/Carousel';
import { MovieCard } from '../components/ui/MovieCard';
import { Button } from '../components/ui/Button';
import { useMovies, useCinemaMovies } from '../hooks/useMovies';
import type { MovieInfo } from '../services/api';

const HeroBanner: React.FC<{ movie: MovieInfo; isActive: boolean }> = ({ movie, isActive }) => {
  const bgImage = movie.thumbUrl || movie.posterUrl || '/fallback-poster.svg';

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
      }`}
    >
      {/* Background Media */}
      <div className={`absolute inset-0 overflow-hidden transition-transform duration-[7000ms] ease-out ${isActive ? 'scale-105' : 'scale-100'}`}>
        <img
          src={bgImage}
          alt={movie.name}
          className="w-full h-full object-cover object-center"
          loading={isActive ? 'eager' : 'lazy'}
          decoding="async"
        />
        {/* Soft Modern Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent dark:from-[#0B0F19] dark:via-[#0B0F19]/70 dark:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent dark:from-[#0B0F19]/95 dark:via-[#0B0F19]/60 dark:to-transparent w-full md:w-[75%]" />
      </div>

      {/* Banner Content Container */}
      <div className="absolute inset-0 flex items-end pb-10 sm:pb-14 md:pb-16">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex flex-col items-start max-w-[680px] gap-3 transition-all duration-500 delay-150 ${
              isActive ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            {/* Badges / Meta */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
                <CheckBadgeIcon className="w-3.5 h-3.5" /> Đa nguồn VIP
              </span>

              {movie.quality && movie.quality !== 'UNKNOWN' && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-600 text-white shadow-sm uppercase">
                  {movie.quality}
                </span>
              )}
              {movie.year && (
                <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                  {movie.year}
                </span>
              )}
              {movie.lang && (
                <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                  {movie.lang}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1 w-full">
              <h1 className="font-heading text-[26px] sm:text-[36px] md:text-[44px] lg:text-[50px] leading-[1.1] font-black text-white drop-shadow-md line-clamp-2">
                {movie.name}
              </h1>
              {movie.originalName && (
                <p className="font-body text-[14px] sm:text-[15px] font-medium text-slate-300 tracking-wide line-clamp-1">
                  {movie.originalName}
                </p>
              )}
            </div>

            {/* Description */}
            {movie.description && (
              <p className="line-clamp-2 text-[13px] sm:text-[14px] text-slate-200/90 leading-relaxed max-w-[90%] font-normal">
                {movie.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-3">
              <Link to={`/phim/${movie.slug}`}>
                <Button
                  variant="primary"
                  size="md"
                  className="px-7 py-3 rounded-full flex items-center gap-2 font-bold text-[14px] bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
                >
                  <PlayIcon className="w-5 h-5 ml-0.5" /> Xem Phim Ngay
                </Button>
              </Link>
              <Link to={`/phim/${movie.slug}`}>
                <Button
                  variant="secondary"
                  size="md"
                  className="px-5 py-3 rounded-full flex items-center gap-1.5 font-semibold text-[14px] bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-md transition-transform active:scale-95"
                >
                  <InformationCircleIcon className="w-5 h-5 text-white/90" /> Chi tiết
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const [heroIdx, setHeroIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recentQ = useMovies({ category: 'phim-moi-cap-nhat', page: 1, source: 'all' });
  const cinemaQ = useCinemaMovies(1);
  const actionQ = useMovies({ genre: 'hanh-dong', page: 1, source: 'all' });
  const seriesQ = useMovies({ category: 'phim-bo', page: 1, source: 'all' });
  const animeQ  = useMovies({ category: 'hoat-hinh', page: 1, source: 'all' });

  const heroMovies = (recentQ.data?.items || []).slice(0, 5);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heroMovies.length > 1) {
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          setHeroIdx(i => (i + 1) % heroMovies.length);
        }
      }, 6000);
    }
  }, [heroMovies.length]);

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startInterval]);

  return (
    <div className="flex flex-col pb-16 w-full overflow-x-hidden">
      {/* ── 1. HERO BANNER ── */}
      <section
        className="relative w-full h-[52vh] sm:h-[60vh] md:h-[68vh] max-h-[660px] bg-slate-900 overflow-hidden"
        onMouseEnter={() => { if (intervalRef.current) clearInterval(intervalRef.current); }}
        onMouseLeave={startInterval}
      >
        {heroMovies.length === 0 && !recentQ.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Đang tải danh sách phim...</p>
          </div>
        )}
        {recentQ.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {heroMovies.map((m, i) => (
          <HeroBanner key={m.slug || m.id} movie={m} isActive={i === heroIdx} />
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-2">
          {heroMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => { setHeroIdx(i); startInterval(); }}
              className={`rounded-full transition-all duration-300 ${
                i === heroIdx
                  ? 'w-7 h-2 bg-indigo-500 shadow-md shadow-indigo-500/50'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Quick Categories Bar ── */}
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-5 relative z-30">
        <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Link
            to="/browse/phim-moi-cap-nhat"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 shrink-0 transition-colors"
          >
            <SparklesIcon className="w-4 h-4 text-indigo-500" /> Phim Mới Cập Nhật
          </Link>
          <Link
            to="/browse/phim-chieu-rap"
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors"
          >
            🎬 Phim Chiếu Rạp
          </Link>
          <Link
            to="/browse/phim-bo"
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors"
          >
            📺 Phim Bộ Hàn - Trung
          </Link>
          <Link
            to="/browse/hoat-hinh"
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors"
          >
            🌸 Hoạt Hình & Anime
          </Link>
          <Link
            to="/browse/phim-le"
            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-colors"
          >
            🍿 Phim Lẻ Chọn Lọc
          </Link>
        </div>
      </div>

      {/* ── MOVIE SECTIONS ── */}
      <div className="flex flex-col gap-10 sm:gap-14 mt-8 relative z-20">
        
        {/* ── 2. MỚI CẬP NHẬT ── */}
        {(recentQ.isLoading || recentQ.error || (recentQ.data?.items && recentQ.data.items.length > 0)) && (
          <Carousel
            title="Mới Cập Nhật"
            subtitle="Phim mới nhất từ hệ thống Nguồn C & KKPhim"
            badge="Tự động gộp"
            isLoading={recentQ.isLoading}
            error={recentQ.error}
            onRetry={recentQ.refetch}
            viewAllLink="/browse/phim-moi-cap-nhat"
          >
            {recentQ.data?.items?.map(m => (
              <MovieCard key={m.slug} {...m} />
            ))}
          </Carousel>
        )}

        {/* ── 3. PHIM CHIẾU RẠP ── */}
        {(cinemaQ.isLoading || cinemaQ.error || (cinemaQ.data?.items && cinemaQ.data.items.length > 0)) && (
          <Carousel
            title="Phim Chiếu Rạp Đỉnh Cao"
            subtitle="Bom tấn phòng vé với chất lượng Full HD / 4K"
            badge="Bom Tấn"
            isLoading={cinemaQ.isLoading}
            error={cinemaQ.error}
            onRetry={cinemaQ.refetch}
            viewAllLink="/browse/phim-chieu-rap"
          >
            {cinemaQ.data?.items?.map(m => (
              <MovieCard key={m.slug} {...m} />
            ))}
          </Carousel>
        )}

        {/* ── PHIM HÀNH ĐỘNG CHỌN LỌC ── */}
        {(actionQ.isLoading || actionQ.error || (actionQ.data?.items && actionQ.data.items.length > 0)) && (
          <Carousel
            title="Phim Hành Động Chọn Lọc"
            subtitle="Mãn nhãn, kỹ xảo bom tấn và những pha đối đầu nghẹt thở"
            badge="💥 Hành Động"
            isLoading={actionQ.isLoading}
            error={actionQ.error}
            onRetry={actionQ.refetch}
            viewAllLink="/browse/hanh-dong"
          >
            {actionQ.data?.items?.map(m => (
              <MovieCard key={m.slug} {...m} />
            ))}
          </Carousel>
        )}

        {/* ── KHÁM PHÁ THEO THỂ LOẠI TUYỂN CHỌN ── */}
        <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              <div>
                <h2 className="font-heading text-[18px] sm:text-[20px] font-black text-slate-950 dark:text-white tracking-tight">
                  Khám Phá Theo Thể Loại Tuyển Chọn
                </h2>
                <p className="text-[12px] sm:text-[13px] text-slate-700 dark:text-slate-300 font-semibold">
                  Tìm kiếm nhanh các thể loại phim được yêu thích nhất
                </p>
              </div>
            </div>
            <Link
              to="/browse/hanh-dong"
              className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            {[
              { slug: 'hanh-dong', name: 'Hành Động', icon: '💥', desc: 'Kỹ xảo bom tấn', bg: 'hover:border-red-400' },
              { slug: 'tinh-cam', name: 'Tình Cảm', icon: '💖', desc: 'Lãng mạn sâu lắng', bg: 'hover:border-pink-400' },
              { slug: 'hai-huoc', name: 'Hài Hước', icon: '🤣', desc: 'Cười xua mệt mỏi', bg: 'hover:border-yellow-400' },
              { slug: 'co-trang', name: 'Cổ Trang', icon: '🏮', desc: 'Cung đình kỳ ảo', bg: 'hover:border-rose-400' },
              { slug: 'tam-ly', name: 'Tâm Lý', icon: '🧠', desc: 'Chiều sâu nhân văn', bg: 'hover:border-indigo-400' },
              { slug: 'hinh-su', name: 'Hình Sự', icon: '🔍', desc: 'Phá án ly kỳ', bg: 'hover:border-blue-400' },
              { slug: 'kinh-di', name: 'Kinh Dị', icon: '👻', desc: 'Rùng rợn kịch tính', bg: 'hover:border-emerald-500' },
              { slug: 'vien-tuong', name: 'Viễn Tưởng', icon: '🚀', desc: 'Vũ trụ kỳ vĩ', bg: 'hover:border-cyan-400' },
              { slug: 'phieu-luu', name: 'Phiêu Lưu', icon: '🗺️', desc: 'Vùng đất kỳ bí', bg: 'hover:border-teal-400' },
              { slug: 'vo-thuat', name: 'Võ Thuật', icon: '⚔️', desc: 'Kiếm hiệp chân thực', bg: 'hover:border-amber-600' },
              { slug: 'hoat-hinh', name: 'Hoạt Hình', icon: '🎨', desc: 'Thế giới sắc màu', bg: 'hover:border-violet-400' },
              { slug: 'chien-tranh', name: 'Chiến Tranh', icon: '🎖️', desc: 'Lịch sử khốc liệt', bg: 'hover:border-slate-500' },
            ].map(g => (
              <Link
                key={g.slug}
                to={`/browse/${g.slug}`}
                className={`flex flex-col p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${g.bg}`}
              >
                <div className="text-2xl mb-1">{g.icon}</div>
                <span className="font-heading text-[14px] font-black text-slate-950 dark:text-white leading-tight">
                  {g.name}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {g.desc}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 4. PHIM BỘ THỊNH HÀNH ── */}
        {(seriesQ.isLoading || seriesQ.error || (seriesQ.data?.items && seriesQ.data.items.length > 0)) && (
          <Carousel
            title="Phim Bộ Thịnh Hành"
            subtitle="Đầy đủ server Vietsub, Thuyết minh & Lồng tiếng"
            badge="Hot Series"
            isLoading={seriesQ.isLoading}
            error={seriesQ.error}
            onRetry={seriesQ.refetch}
            viewAllLink="/browse/phim-bo"
          >
            {seriesQ.data?.items?.map(m => (
              <MovieCard key={m.slug} {...m} />
            ))}
          </Carousel>
        )}

        {/* ── 5. HOẠT HÌNH / ANIME ── */}
        {(animeQ.isLoading || animeQ.error || (animeQ.data?.items && animeQ.data.items.length > 0)) && (
          <Carousel
            title="Anime & Hoạt Hình Đặc Sắc"
            subtitle="Các bộ Anime Nhật Bản, Hoạt hình 3D Trung Quốc mới nhất"
            badge="Anime"
            isLoading={animeQ.isLoading}
            error={animeQ.error}
            onRetry={animeQ.refetch}
            viewAllLink="/browse/hoat-hinh"
          >
            {animeQ.data?.items?.map(m => (
              <MovieCard key={m.slug} {...m} />
            ))}
          </Carousel>
        )}

      </div>
    </div>
  );
};
