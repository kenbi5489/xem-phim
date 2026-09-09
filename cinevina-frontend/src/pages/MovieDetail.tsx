import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayIcon, LinkIcon, XMarkIcon, Cog6ToothIcon, HeartIcon as HeartSolid, StarIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { useMovieDetail, useSeriesDetail } from '../hooks/useMovies';
import { useFavorites } from '../hooks/useFavorites';
import { computeIsStreamable } from '../services/api';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { getTMDBInfo } from '../services/tmdb';
import type { TMDBData, TMDBCast } from '../services/tmdb';

const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

// ── Trailer Modal ──
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const TrailerModal: React.FC<{ videoId: string; onClose: () => void }> = ({ videoId, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg-base)]/90 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="relative w-full max-w-[900px] aspect-video bg-[var(--color-bg-surface)] rounded-[16px] overflow-hidden shadow-2xl border border-[var(--color-border)]" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[var(--color-bg-base)]/50 text-[var(--color-text-1)] hover:bg-[var(--color-bg-hover)] transition-colors">
        <XMarkIcon className="w-6 h-6" />
      </button>
      <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} title="Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full border-0" />
    </div>
  </div>
);

// ── Helpers ──
const CastList: React.FC<{ castString: string; directorString: string; tmdbCast?: TMDBCast[] }> = ({ castString, directorString, tmdbCast }) => {
  let allCrew: { name: string; role: string; photo?: string | null }[] = [];

  if (tmdbCast && tmdbCast.length > 0) {
    allCrew = tmdbCast.slice(0, 15).map(c => ({
      name: c.name,
      role: c.character || 'Acting',
      photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
    }));
  } else {
    const actors = castString ? castString.split(',').map(s => s.trim()).filter(Boolean) : [];
    const directors = directorString ? directorString.split(',').map(s => s.trim()).filter(Boolean) : [];
    allCrew = [
      ...directors.map(name => ({ name, role: 'Director / Writing' })),
      ...actors.map(name => ({ name, role: 'Acting' }))
    ];
  }

  if (!allCrew.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-[16px] font-semibold text-[var(--color-text-1)] mb-4">Diễn viên & Đạo diễn</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {allCrew.map((c, i) => (
          <div key={i} className="w-[100px] shrink-0 flex flex-col items-center gap-2 snap-start">
            {c.photo ? (
              <img src={c.photo} alt={decodeHtmlEntities(c.name)} className="w-[64px] h-[64px] rounded-full object-cover bg-[var(--color-surface)]" />
            ) : (
              <div className="w-[64px] h-[64px] rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[var(--color-text-disabled)]">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="text-center w-full">
              <p className="text-[13px] font-medium text-[var(--color-text-primary)] line-clamp-2 leading-tight">{decodeHtmlEntities(c.name)}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1">{decodeHtmlEntities(c.role)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SeasonSelector: React.FC<{ seasons: any[]; activeSlug: string }> = ({ seasons, activeSlug }) => {
  const navigate = useNavigate();
  if (!seasons || seasons.length <= 1) return null;
  return (
    <div className="mt-8">
      <h3 className="text-[16px] font-semibold text-[var(--color-text-1)] mb-3">Phần phim</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {seasons.map((s) => (
          <button
            key={s.slug}
            onClick={() => navigate(`/phim/${s.slug}?season=${s.season_number}`)}
            className={`shrink-0 px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors border border-transparent ${
              s.slug === activeSlug 
                ? 'bg-[var(--color-primary)] text-white' 
                : 'bg-[var(--color-bg-surface)] text-[var(--color-text-2)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-1)]'
            }`}
          >
            Phần {s.season_number}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ──
export const MovieDetail: React.FC = () => {
  const { slug } = useParams();
  const { data: movie, isLoading, error, refetch } = useMovieDetail(slug || '');
  const { data: seriesDetail } = useSeriesDetail(movie?.seriesId || '');
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const navigate = useNavigate();
  const [showTrailer, setShowTrailer] = useState(false);
  const [tmdbData, setTmdbData]       = useState<TMDBData | null>(null);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  React.useEffect(() => {
    if (movie?.tmdbId) {
      const isSeries = movie.type?.toLowerCase().includes('series') || movie.type?.toLowerCase().includes('tv') || movie.type?.toLowerCase().includes('hoathinh');
      getTMDBInfo(movie.tmdbId, !!isSeries).then(setTmdbData);
    }
  }, [movie?.tmdbId, movie?.type]);

  if (isLoading) return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[var(--color-bg-hover)] border-t-[var(--color-primary)] rounded-full animate-spin" />
    </div>
  );
  if (error || !movie) return (
    <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center gap-4">
      <p className="text-[var(--color-text-3)] text-sm">Không tìm thấy phim</p>
      <Button variant="primary" onClick={() => refetch()}>Thử lại</Button>
    </div>
  );

  const isStreamable = computeIsStreamable(movie);
  const firstEp      = movie.servers?.[0]?.server_data?.[0]?.slug || movie.episodes?.[0]?.slug || '';
  const trailerYtId  = extractYouTubeId(movie.trailerUrl || '');

  const lastWatchedEp = localStorage.getItem(`last_watched_ep_${movie?.slug}`) || '';
  const initialEpToPlay = lastWatchedEp || firstEp;

  const handleWatchNow = () => {
    navigate(`/play/${movie.slug}/${initialEpToPlay}`);
  };

  const handleToggleFavorite = () => {
    if (movie) {
      toggleFavorite({
        slug: movie.slug,
        name: movie.name,
        posterUrl: movie.posterUrl,
        thumbUrl: movie.thumbUrl
      });
    }
  };

  const genres = movie.categories ? movie.categories.split(',').map(s => s.trim()) : [];
  const countries = movie.country ? movie.country.split(',').map(s => s.trim()) : [];

  const getEpisodeDisplay = () => {
    const curr = (movie.episodeCurrent || '').trim();
    const tot = String(movie.totalEpisodes || '').trim();
    if (curr.toLowerCase() === 'full' || curr.toLowerCase() === 'hoàn tất') {
      return tot && tot !== '?' && tot !== '1' ? `Hoàn tất ${tot}/${tot} tập` : 'Đã hoàn tất';
    }
    if (curr && tot && tot !== '?' && curr !== tot) return `${curr} / ${tot} tập`;
    if (curr) return curr;
    if (tot && tot !== '?') return `${tot} tập`;
    return 'Đang cập nhật';
  };

  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] w-full flex flex-col items-center">
      {showTrailer && trailerYtId && <TrailerModal videoId={trailerYtId} onClose={() => setShowTrailer(false)} />}

      {/* TOP BACKDROP (30vh) */}
      <div className="relative w-full h-[30vh] min-h-[250px] overflow-hidden">
        <img 
          src={tmdbData?.backdrops?.[0]?.file_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrops[0].file_path}` : movie.posterUrl || movie.thumbUrl} 
          className="w-full h-full object-cover blur-[40px] scale-110" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-base)] via-[var(--color-bg-base)]/80 to-[var(--color-bg-base)]/40" />
      </div>

      <div className="w-full max-w-[1000px] mx-auto px-4 lg:px-8 -mt-[120px] relative z-10">
        
        {/* LAYOUT: Left Poster + Right Metadata */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          
          {/* Left: Poster */}
          <div className="w-[180px] sm:w-[220px] shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface)] shadow-2xl border border-[var(--color-border-strong)]">
              <img src={movie.posterUrl || movie.thumbUrl || ''} className="w-full h-full object-cover" alt={decodeHtmlEntities(movie.name)} />
            </div>
          </div>

          {/* Right: Metadata */}
          <div className="flex-1 flex flex-col">
            
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <h1 className="font-heading text-[28px] md:text-[36px] lg:text-[42px] leading-none text-[var(--color-text-primary)] drop-shadow-md">
                  {decodeHtmlEntities(movie.name)}
                </h1>
                {movie.originalName && (
                  <p className="font-body text-[16px] font-medium text-[var(--color-text-secondary)]">{decodeHtmlEntities(movie.originalName)}</p>
                )}
              </div>

              {/* Dev Tools Dropdown */}
              {isDev && (
                <div className="relative">
                  <button onClick={() => setShowDevMenu(!showDevMenu)} className="p-2 text-[var(--color-text-3)] hover:text-[var(--color-text-1)]">
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                  {showDevMenu && (
                    <div className="absolute right-0 mt-2 w-32 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[8px] py-1 z-50">
                      <span className="block px-4 py-2 text-[12px] text-[var(--color-text-2)] hover:bg-[var(--color-bg-hover)]">API Data</span>
                      <span className="block px-4 py-2 text-[12px] text-[#3b82f6] hover:bg-[var(--color-bg-hover)]">TMDB Data</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags Row */}
            <div className="flex flex-wrap gap-2 mt-4">
              {movie.type && <Chip>{movie.type}</Chip>}
              {movie.year && <Chip>{movie.year}</Chip>}
              {movie.lang && <Chip>{movie.lang}</Chip>}
              {movie.quality && <Chip>{movie.quality}</Chip>}
            </div>

            {/* Meta Info (one clean line) */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-[14px] text-[var(--color-text-3)] font-medium">
              {movie.duration && <span>{movie.duration}</span>}
              {movie.duration && countries.length > 0 && <span>·</span>}
              {countries.length > 0 && <span>{countries.join(', ')}</span>}
              {countries.length > 0 && genres.length > 0 && <span>·</span>}
              {genres.length > 0 && <span>{genres.join(', ')}</span>}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mt-2 text-[14px] font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[var(--color-text-2)]">Đang phát · {getEpisodeDisplay()}</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 mt-8">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleWatchNow}
                disabled={!isStreamable}
                className="px-8 flex items-center gap-2"
              >
                {isStreamable ? <><PlayIcon className="w-5 h-5" /> {lastWatchedEp ? 'Tiếp tục xem' : 'Xem Phim'}</> : 'Sắp ra mắt'}
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => setShowTrailer(true)}
                className="px-6 flex items-center gap-2"
              >
                <LinkIcon className="w-5 h-5" /> Trailer
              </Button>
              <Button 
                variant="ghost"
                size="lg"
                onClick={handleToggleFavorite}
                className="w-[48px] px-0 flex items-center justify-center rounded-full"
                title={isFavorite(movie.slug) ? "Bỏ lưu" : "Lưu phim"}
              >
                {isFavorite(movie.slug) ? <HeartSolid className="w-6 h-6 text-[var(--color-live)]" /> : <HeartOutline className="w-6 h-6" />}
              </Button>
            </div>

            {/* Ratings (Clean numbers) */}
            <div className="flex items-center gap-8 mt-8">
              <div className="flex items-baseline gap-1">
                <StarIcon className={`w-5 h-5 self-center ${movie.rating && movie.rating !== 'N/A' ? 'text-[var(--color-rating)]' : 'text-[var(--color-text-disabled)]'}`} />
                <span className={`font-sans text-[24px] font-bold ${movie.rating && movie.rating !== 'N/A' ? 'text-[var(--color-rating)]' : 'text-[var(--color-text-disabled)]'}`}>
                  {movie.rating && movie.rating !== 'N/A' ? movie.rating : 'N/A'}
                </span>
                <span className="text-[12px] font-medium text-[var(--color-text-muted)] ml-1">TMDB</span>
              </div>
              <div className="flex items-baseline gap-1">
                <StarIcon className={`w-5 h-5 self-center ${movie.imdbRating && movie.imdbRating !== 'N/A' ? 'text-[var(--color-rating)]' : 'text-[var(--color-text-disabled)]'}`} />
                <span className={`font-sans text-[24px] font-bold ${movie.imdbRating && movie.imdbRating !== 'N/A' ? 'text-[var(--color-rating)]' : 'text-[var(--color-text-disabled)]'}`}>
                  {movie.imdbRating && movie.imdbRating !== 'N/A' ? movie.imdbRating : 'Chưa có'}
                </span>
                <span className="text-[12px] font-medium text-[var(--color-text-muted)] ml-1">IMDb</span>
              </div>
            </div>

            {/* Season Selector */}
            {seriesDetail?.seasons && (
              <SeasonSelector seasons={seriesDetail.seasons} activeSlug={movie.slug} />
            )}

            {/* Cast List */}
            <CastList castString={movie.cast || ''} directorString={movie.director || ''} tmdbCast={tmdbData?.cast} />
          </div>
        </div>

        {/* Player Area (Removed) */}

        {/* Bottom Content Sections */}
        <div className="mt-16 flex flex-col gap-12 mb-12">
          
          {/* Nội dung phim */}
          <div>
            <h3 className="font-body text-[18px] font-semibold text-[var(--color-text-1)] mb-3">Nội dung phim</h3>
            <div className="relative">
              <div 
                className={`text-[15px] leading-[1.65] text-[var(--color-text-secondary)] ${descExpanded ? '' : 'line-clamp-3'}`}
                dangerouslySetInnerHTML={{ __html: movie.description || 'Chưa có thông tin nội dung.' }}
              />
              {!descExpanded && (movie.description?.length || 0) > 150 && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--color-bg-base)] to-transparent" />
              )}
            </div>
            {(movie.description?.length || 0) > 150 && (
              <button 
                onClick={() => setDescExpanded(!descExpanded)}
                className="text-[13px] font-medium text-[var(--color-primary)] mt-2 hover:underline"
              >
                {descExpanded ? 'Rút gọn' : 'Xem thêm'}
              </button>
            )}
          </div>

          {/* Từ khóa */}
          {(tmdbData?.keywords?.length || genres.length) > 0 && (
            <div>
              <h3 className="font-body text-[18px] font-semibold text-[var(--color-text-1)] mb-3">Từ khóa</h3>
              <div className="flex flex-wrap gap-2">
                {(tmdbData?.keywords?.length ? tmdbData.keywords : genres).map(g => (
                  <Chip key={g}>{g}</Chip>
                ))}
              </div>
            </div>
          )}

          {/* Hình ảnh */}
          {tmdbData?.backdrops && tmdbData.backdrops.length > 0 && (
            <div>
              <h3 className="font-body text-[18px] font-semibold text-[var(--color-text-1)] mb-3">Hình ảnh</h3>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {tmdbData.backdrops.slice(0, 4).map((img, i) => (
                  <div key={i} className="aspect-video rounded-[12px] overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:opacity-90 transition-opacity">
                    <img src={`https://image.tmdb.org/t/p/w780${img.file_path}`} alt={`Backdrop ${i + 1}`} className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
