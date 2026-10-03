import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  PlayIcon,
  LinkIcon,
  XMarkIcon,
  HeartIcon as HeartSolid,
  StarIcon,
  CheckBadgeIcon,
  TvIcon,
  ServerStackIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useMovieDetail, useSeriesDetail } from '../hooks/useMovies';
import { useFavorites } from '../hooks/useFavorites';
import { computeIsStreamable } from '../services/api';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { getTMDBInfo, type TMDBData, type TMDBCast } from '../services/tmdb';

const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// ── Trailer Modal ──
const TrailerModal: React.FC<{ videoId: string; onClose: () => void }> = ({ videoId, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="relative w-full max-w-[900px] aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors">
        <XMarkIcon className="w-6 h-6" />
      </button>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title="Trailer"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  </div>
);

// ── Cast List ──
const CastList: React.FC<{ castString: string; directorString: string; tmdbCast?: TMDBCast[] }> = ({ castString, directorString, tmdbCast }) => {
  let allCrew: { name: string; role: string; photo?: string | null }[] = [];

  if (tmdbCast && tmdbCast.length > 0) {
    allCrew = tmdbCast.slice(0, 12).map(c => ({
      name: c.name,
      role: c.character || 'Diễn viên',
      photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
    }));
  } else {
    const actors = castString ? castString.split(',').map(s => s.trim()).filter(Boolean) : [];
    const directors = directorString ? directorString.split(',').map(s => s.trim()).filter(Boolean) : [];
    allCrew = [
      ...directors.map(name => ({ name, role: 'Đạo diễn' })),
      ...actors.map(name => ({ name, role: 'Diễn viên' })),
    ];
  }

  if (!allCrew.length) return null;

  return (
    <div className="mt-6">
      <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-3">Diễn viên & Đạo diễn</h3>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {allCrew.map((c, i) => (
          <div key={i} className="w-[84px] shrink-0 flex flex-col items-center gap-1.5 text-center">
            {c.photo ? (
              <img
                src={c.photo}
                alt={decodeHtmlEntities(c.name)}
                className="w-14 h-14 rounded-full object-cover bg-slate-200 dark:bg-slate-800 border-2 border-indigo-100 dark:border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-slate-800 border-2 border-indigo-200 dark:border-slate-700 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-extrabold text-base shadow-sm">
                {c.name.charAt(0)}
              </div>
            )}
            <p className="text-[12px] font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-tight">{decodeHtmlEntities(c.name)}</p>
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 line-clamp-1">{decodeHtmlEntities(c.role)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main MovieDetail Page ──
export const MovieDetail: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: movie, isLoading, error, refetch } = useMovieDetail(slug || '');
  const { data: seriesDetail } = useSeriesDetail(movie?.seriesId || '');
  const { isFavorite, toggleFavorite } = useFavorites();

  const [showTrailer, setShowTrailer] = useState(false);
  const [tmdbData, setTmdbData] = useState<TMDBData | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeServerIdx, setActiveServerIdx] = useState(0);

  useEffect(() => {
    if (movie?.tmdbId) {
      const isSeries = movie.type?.toLowerCase().includes('series') || movie.type?.toLowerCase().includes('tv') || movie.type?.toLowerCase().includes('hoathinh');
      getTMDBInfo(movie.tmdbId, !!isSeries).then(setTmdbData);
    }
  }, [movie?.tmdbId, movie?.type]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang tải thông tin phim...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-slate-600 dark:text-slate-300 text-base font-semibold">Không tìm thấy thông tin phim hoặc link phim đã hết hạn.</p>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => refetch()}>Thử lại</Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  const isStreamable = computeIsStreamable(movie);
  const servers = movie.servers || [];
  const currentServer = servers[activeServerIdx] || servers[0];
  const episodes = currentServer?.server_data || [];

  const firstEp = episodes[0]?.slug || '';
  const lastWatchedEp = localStorage.getItem(`last_watched_ep_${movie.slug}`) || '';
  const initialEpToPlay = lastWatchedEp || firstEp;

  const trailerYtId = extractYouTubeId(movie.trailerUrl || '');

  const handleWatchEpisode = (epSlug: string) => {
    navigate(`/play/${movie.slug}/${epSlug}`);
  };

  const handleWatchNow = () => {
    navigate(`/play/${movie.slug}/${initialEpToPlay}`);
  };

  const handleToggleFavorite = () => {
    toggleFavorite({
      slug: movie.slug,
      name: movie.name,
      posterUrl: movie.posterUrl,
      thumbUrl: movie.thumbUrl,
    });
  };

  const genres = movie.categories ? movie.categories.split(',').map(s => s.trim()).filter(Boolean) : [];
  const countries = movie.country ? movie.country.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen w-full flex flex-col items-center pb-20">
      {showTrailer && trailerYtId && (
        <TrailerModal videoId={trailerYtId} onClose={() => setShowTrailer(false)} />
      )}

      {/* Top Ambient Backdrop */}
      <div className="relative w-full h-[36vh] min-h-[280px] max-h-[420px] overflow-hidden">
        <img
          src={tmdbData?.backdrops?.[0]?.file_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrops[0].file_path}` : movie.thumbUrl || movie.posterUrl}
          className="w-full h-full object-cover blur-2xl scale-110 opacity-70 dark:opacity-40"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-app)] via-[var(--color-bg-app)]/80 to-transparent" />
        <div className="absolute top-4 left-4 sm:left-8 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Quay lại
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -mt-[140px] sm:-mt-[160px] relative z-20">
        
        {/* Top Hero Section: Poster + Metadata */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
          
          {/* Left: Poster & Quick CTAs */}
          <div className="w-[200px] sm:w-[240px] md:w-[260px] shrink-0 mx-auto md:mx-0 flex flex-col gap-4">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 shadow-2xl border border-slate-200/80 dark:border-slate-800">
              <img
                src={movie.posterUrl || movie.thumbUrl || '/fallback-poster.svg'}
                className="w-full h-full object-cover"
                alt={movie.name}
              />
              {movie.quality && (
                <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg shadow-md uppercase">
                  {movie.quality}
                </div>
              )}
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-col gap-2.5 w-full">
              <Button
                variant="primary"
                size="lg"
                onClick={handleWatchNow}
                disabled={!isStreamable}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-[15px] bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
              >
                <PlayIcon className="w-5 h-5 ml-0.5" />
                {lastWatchedEp ? 'Tiếp Tục Xem' : 'Xem Phim Ngay'}
              </Button>

              <div className="flex gap-2">
                {trailerYtId && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setShowTrailer(true)}
                    className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-[13px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <LinkIcon className="w-4 h-4" /> Trailer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleToggleFavorite}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  title={isFavorite(movie.slug) ? 'Bỏ lưu' : 'Lưu phim'}
                >
                  {isFavorite(movie.slug) ? (
                    <HeartSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartOutline className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Metadata */}
          <div className="flex-1 flex flex-col">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  <CheckBadgeIcon className="w-3.5 h-3.5" /> Đa Nguồn (Nguồn C + KKPhim)
                </span>
                {movie.episodeCurrent && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    {movie.episodeCurrent}
                  </span>
                )}
              </div>

              <h1 className="font-heading text-[24px] sm:text-[32px] lg:text-[40px] font-black text-slate-950 dark:text-white leading-tight">
                {movie.name}
              </h1>

              {movie.originalName && (
                <p className="font-body text-[14px] sm:text-[16px] font-bold text-slate-700 dark:text-slate-300">
                  {movie.originalName}
                </p>
              )}
            </div>

            {/* Ratings & Quick Specs Row */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5">
                <StarIcon className="w-5 h-5 text-amber-500 fill-current" />
                <span className="font-sans text-[18px] font-black text-slate-950 dark:text-white">
                  {movie.rating || '8.5'}
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">TMDB</span>
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />

              {movie.year && (
                <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                  Năm: <span className="font-bold text-slate-950 dark:text-white">{movie.year}</span>
                </div>
              )}

              {movie.duration && (
                <>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                  <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                    Thời lượng: <span className="font-bold text-slate-950 dark:text-white">{movie.duration}</span>
                  </div>
                </>
              )}

              {movie.lang && (
                <>
                  <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                  <div className="text-[13px] font-semibold text-indigo-700 dark:text-indigo-400">
                    Phụ đề: <span className="font-bold">{movie.lang}</span>
                  </div>
                </>
              )}
            </div>

            {/* Genres & Countries Tags */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {genres.map(g => (
                <Link key={g} to={`/browse/the-loai/${g.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Chip>{g}</Chip>
                </Link>
              ))}
              {countries.map(c => (
                <Link key={c} to={`/browse/quoc-gia/${c.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Chip>{c}</Chip>
                </Link>
              ))}
            </div>

            {/* Synopsis */}
            <div className="mt-5">
              <h3 className="text-[15px] font-bold text-slate-950 dark:text-white mb-1.5">Nội dung phim</h3>
              <p
                className={`text-[14px] sm:text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 font-medium ${
                  descExpanded ? '' : 'line-clamp-3'
                }`}
                dangerouslySetInnerHTML={{ __html: movie.description || 'Đang cập nhật nội dung cho bộ phim này.' }}
              />
              {(movie.description?.length || 0) > 180 && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="text-[13px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 hover:underline cursor-pointer"
                >
                  {descExpanded ? 'Rút gọn' : 'Xem thêm'}
                </button>
              )}
            </div>

            {/* Cast & Director List */}
            <CastList castString={movie.cast || ''} directorString={movie.director || ''} tmdbCast={tmdbData?.cast} />

          </div>
        </div>

        {/* ── NEW: In-Page Episode & Server Selector ── */}
        <div className="mt-12 bg-white dark:bg-slate-900/90 rounded-2xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <TvIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">
                  Danh Sách Tập Phim
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  Chọn máy chủ nguồn phát và tập phim để xem ngay
                </p>
              </div>
            </div>

            {/* Server Tabs */}
            {servers.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
                <span className="text-[12px] font-medium text-slate-400 shrink-0 flex items-center gap-1">
                  <ServerStackIcon className="w-4 h-4" /> Nguồn phát:
                </span>
                {servers.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveServerIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-bold shrink-0 transition-all ${
                      idx === activeServerIdx
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.server_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Episode Grid */}
          <div className="mt-5">
            {episodes.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">Chưa có danh sách tập hoặc phim đang cập nhật.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
                {episodes.map((ep) => {
                  const isCurrent = ep.slug === lastWatchedEp;
                  return (
                    <button
                      key={ep.slug}
                      onClick={() => handleWatchEpisode(ep.slug)}
                      className={`h-11 rounded-xl text-[13px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 active:scale-95'
                      }`}
                    >
                      {ep.name.startsWith('Tập') ? ep.name : `Tập ${ep.name}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Series Seasons if any */}
        {seriesDetail?.seasons && seriesDetail.seasons.length > 1 && (
          <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-3">Các Phần Phim (Seasons)</h3>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
              {seriesDetail.seasons.map((s: any) => (
                <button
                  key={s.slug}
                  onClick={() => navigate(`/phim/${s.slug}`)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                    s.slug === movie.slug
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Phần {s.season_number}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Backdrops Photos */}
        {tmdbData?.backdrops && tmdbData.backdrops.length > 0 && (
          <div className="mt-10">
            <h3 className="text-[17px] font-bold text-slate-900 dark:text-white mb-3">Hình Ảnh Trong Phim</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tmdbData.backdrops.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 shadow-sm">
                  <img
                    src={`https://image.tmdb.org/t/p/w780${img.file_path}`}
                    alt={`Ảnh ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
