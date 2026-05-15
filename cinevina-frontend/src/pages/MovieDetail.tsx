import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PlayIcon, LinkIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useMovieDetail, useMovieStream } from '../hooks/useMovies';
import { computeIsStreamable } from '../services/api';
import { EmbeddedPlayer } from '../components/ui/EmbeddedPlayer';
import { getTMDBInfo } from '../services/tmdb';
import type { TMDBData, TMDBCast } from '../services/tmdb';

// ── Trailer Modal ─────────────────────────────────────────────────────────────
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const TrailerModal: React.FC<{ videoId: string; onClose: () => void }> = ({ videoId, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4" onClick={onClose}>
    <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/20" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-3 rounded-full bg-black/60 text-white hover:bg-red-600 transition-all shadow-xl">
        <XMarkIcon className="w-6 h-6" />
      </button>
      <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} title="Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
    </div>
  </div>
);

// ── PlayerSection ─────────────────────────────────────────────────────────────
const PlayerSection: React.FC<{
  movieSlug: string;
  movieName: string;
  servers: any[];
  initialEpSlug: string;
}> = ({ movieSlug, movieName, servers, initialEpSlug }) => {
  const [activeEpSlug, setActiveEpSlug] = useState(initialEpSlug);

  const { data: stream, isLoading } = useMovieStream(movieSlug, activeEpSlug);

  const handleEpisodeChange = (_serverIdx: number, epSlug: string) => {
    setActiveEpSlug(epSlug);
    document.getElementById('cinevina-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <div id="cinevina-player" className="w-full aspect-video bg-black rounded-2xl flex items-center justify-center border border-white/5 mt-10">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!stream) return null;

  return (
    <div id="cinevina-player" className="scroll-mt-24 mt-10 max-w-[1200px] mx-auto px-4 sm:px-6">
      <EmbeddedPlayer
        streamUrl={stream.url}
        streamType={stream.type as 'hls' | 'embed'}
        movieSlug={movieSlug}
        movieName={movieName}
        currentEpisode={activeEpSlug}
        servers={servers}
        onEpisodeChange={handleEpisodeChange}
        className="w-full"
      />
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

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
    <div className="relative mt-6 group">
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
        {allCrew.map((c, i) => (
          <div key={i} className="w-[84px] md:w-[90px] shrink-0 flex flex-col items-center gap-2 snap-start">
            {c.photo ? (
              <img src={c.photo} alt={c.name} className="w-16 h-16 md:w-[76px] md:h-[76px] rounded-full object-cover shadow-inner" />
            ) : (
              <div className="w-16 h-16 md:w-[76px] md:h-[76px] rounded-full bg-[#2a2a2a] flex items-center justify-center text-lg md:text-xl font-black text-white/60 border border-white/5 shadow-inner">
                {getInitials(c.name)}
              </div>
            )}
            <div className="w-full text-center">
              <p className="text-[13px] font-bold text-white/90 line-clamp-1">{c.name}</p>
              <p className="text-[11px] text-white/40 line-clamp-1">{c.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const MovieDetail: React.FC = () => {
  const { slug } = useParams();
  const { data: movie, isLoading, error, refetch } = useMovieDetail(slug || '');
  const [showTrailer, setShowTrailer] = useState(false);
  const [isWatching, setIsWatching]   = useState(false);
  const [tmdbData, setTmdbData]       = useState<TMDBData | null>(null);

  React.useEffect(() => {
    if (movie?.tmdbId) {
      const isSeries = movie.type?.toLowerCase().includes('series') || movie.type?.toLowerCase().includes('tv') || movie.type?.toLowerCase().includes('hoathinh');
      getTMDBInfo(movie.tmdbId, !!isSeries).then(setTmdbData);
    }
  }, [movie?.tmdbId, movie?.type]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
  if (error || !movie) return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center gap-6">
      <p className="text-white/40 font-bold uppercase tracking-widest">Không tìm thấy phim</p>
      <button onClick={() => refetch()} className="btn-vibrant">THỬ LẠI</button>
    </div>
  );

  const isStreamable = computeIsStreamable(movie);
  const firstEp      = movie.servers?.[0]?.server_data?.[0]?.slug || movie.episodes?.[0]?.slug || '';
  const trailerYtId  = extractYouTubeId(movie.trailerUrl || '');
  const is4K         = movie.quality?.toUpperCase().includes('4K');

  const handleWatchNow = () => {
    setIsWatching(true);
    setTimeout(() => {
      document.getElementById('cinevina-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const genres = movie.categories ? movie.categories.split(',').map(s => s.trim()) : [];
  const countries = movie.country ? movie.country.split(',').map(s => s.trim()) : [];

  const getEpisodeDisplay = () => {
    const curr = (movie.episodeCurrent || '').trim();
    const tot = String(movie.totalEpisodes || '').trim();
    if (curr.toLowerCase() === 'full' || curr.toLowerCase() === 'hoàn tất') {
      return tot && tot !== '?' && tot !== '1' ? `Hoàn tất (${tot} tập)` : 'Full';
    }
    if (curr && tot && tot !== '?' && curr !== tot) return `${curr} / ${tot} tập`;
    if (curr) return curr;
    if (tot && tot !== '?') return `${tot} tập`;
    return 'Đang cập nhật';
  };

  return (
    <div className="min-h-screen bg-[#121212] pb-24 font-sans text-white">
      {showTrailer && trailerYtId && <TrailerModal videoId={trailerYtId} onClose={() => setShowTrailer(false)} />}

      <div className="max-w-[1200px] mx-auto pt-[100px] px-4 md:px-6">
        
        {/* TOP SECTION: Poster & Info */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
          
          {/* Left: Poster & Buttons */}
          <div className="w-[200px] sm:w-[240px] md:w-[280px] shrink-0 mx-auto md:mx-0">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
              <img src={movie.posterUrl || movie.thumbUrl || ''} className="w-full h-full object-cover" alt={movie.name} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button 
                onClick={handleWatchNow}
                className="flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2.5 rounded-lg font-bold text-[13px] transition-colors"
              >
                <PlayIcon className="w-4 h-4" /> Xem Phim
              </button>
              <button 
                onClick={() => setShowTrailer(true)}
                className="flex items-center justify-center gap-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white py-2.5 rounded-lg font-bold text-[13px] transition-colors"
              >
                <LinkIcon className="w-4 h-4" /> Trailer
              </button>
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                  {movie.name}
                </h1>
                {movie.originalName && (
                  <p className="text-white/60 text-lg md:text-xl font-medium mt-2">{movie.originalName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex items-center gap-1 bg-[#2a2a2a] hover:bg-[#333] cursor-pointer text-white/70 px-3 py-1.5 rounded-md text-xs font-bold transition-colors">
                  <LinkIcon className="w-3 h-3" /> API
                </span>
                <span className="flex items-center gap-1 bg-[#1a2533] text-[#3b82f6] border border-[#3b82f6]/20 px-3 py-1.5 rounded-md text-xs font-bold">
                  TMDB
                </span>
                <span className="flex items-center gap-1 bg-[#332a13] text-[#eab308] border border-[#eab308]/20 px-3 py-1.5 rounded-md text-xs font-bold">
                  IMDB
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="bg-[#2a2a2a] border border-white/5 text-white/80 px-3 py-1 rounded-full text-xs font-bold uppercase">{movie.type || 'single'}</span>
              {movie.year && <span className="bg-[#2a2a2a] border border-white/5 text-white/80 px-3 py-1 rounded-full text-xs font-bold">{movie.year}</span>}
              {movie.lang && <span className="bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/20 px-3 py-1 rounded-full text-xs font-bold uppercase">{movie.lang}</span>}
              {movie.quality && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${is4K ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' : 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/20'} uppercase`}>
                  {movie.quality}
                </span>
              )}
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mt-8">
              
              <div className="bg-[#1c1c1c] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
                    <span className="text-[13px] text-white/70 font-semibold">Thể loại</span>
                  </div>
                  <span className="w-5 h-5 flex items-center justify-center font-bold bg-[#2a2a2a] text-white/50 rounded-full text-[10px]">{genres.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {genres.length > 0 ? genres.slice(0,3).map(g => (
                    <span key={g} className="px-2 py-1 rounded-full border border-white/20 text-[11px] text-white/70 whitespace-nowrap">{g}</span>
                  )) : <span className="text-[11px] text-white/30">N/A</span>}
                </div>
              </div>

              <div className="bg-[#1c1c1c] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>
                    <span className="text-[13px] text-white/70 font-semibold">Quốc gia</span>
                  </div>
                  <span className="w-5 h-5 flex items-center justify-center font-bold bg-[#2a2a2a] text-white/50 rounded-full text-[10px]">{countries.length}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {countries.length > 0 ? countries.slice(0,3).map(c => (
                    <span key={c} className="px-2 py-1 rounded-full border border-[#a855f7]/30 text-[#a855f7] text-[11px] whitespace-nowrap">{c}</span>
                  )) : <span className="text-[11px] text-white/30">N/A</span>}
                </div>
              </div>

              <div className="bg-[#1c1c1c] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
                    <span className="text-[13px] text-white/70 font-semibold">Thông tin</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#22c55e]/10 text-[#22c55e] px-2 py-0.5 rounded-md uppercase">ongoing</span>
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/40">Thời lượng:</span>
                    <span className="text-white/90 font-medium truncate ml-2 text-right">{movie.duration || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/40">Tập hiện tại:</span>
                    <span className="text-[#22c55e] font-bold truncate ml-2 text-right">{getEpisodeDisplay()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1c1c1c] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span>
                    <span className="text-[13px] text-white/70 font-semibold">TMDB</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-0.5 rounded-full">movie</span>
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/40">ID:</span>
                    <span className="text-white/70">{movie.tmdbId || 'N/A'}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#3b82f6] font-bold text-lg">{movie.rating || 'N/A'}</span>
                    <span className="text-white/40 text-[11px]">/10</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1c1c1c] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#eab308]"></span>
                    <span className="text-[13px] text-white/70 font-semibold">IMDB</span>
                  </div>
                  <span className="text-[10px] font-bold bg-[#eab308]/20 text-[#eab308] px-2 py-0.5 rounded-full">Rating</span>
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-white/40">ID:</span>
                    <span className="text-white/70">{movie.imdbId || 'N/A'}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#eab308] font-bold text-lg">{movie.imdbRating || 'N/A'}</span>
                    <span className="text-white/40 text-[11px]">/10</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Cast List */}
            <CastList castString={movie.cast || ''} directorString={movie.director || ''} tmdbCast={tmdbData?.cast} />

          </div>
        </div>
      </div>

      {/* Inline Player Section */}
      {isWatching && isStreamable && movie.servers && firstEp && (
        <PlayerSection
          movieSlug={movie.slug}
          movieName={movie.name}
          servers={movie.servers}
          initialEpSlug={firstEp}
        />
      )}

      {/* Bottom Content Section */}
      <div className="max-w-[1200px] mx-auto mt-16 px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 border-l-4 border-[#a855f7] pl-4">Nội dung phim</h2>
        <div className="text-white/50 text-[15px] mb-4">
          Tên khác: <span className="text-white/80">{movie.originalName || 'Đang cập nhật'}</span>
        </div>
        <div className="text-white/70 leading-[1.8] text-[15px] md:text-[16px] font-medium"
          dangerouslySetInnerHTML={{ __html: movie.description || 'Đang cập nhật nội dung...' }}
        />

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-l-4 border-[#a855f7] pl-4">
            Từ khóa <span className="text-white/40 text-sm font-normal">({tmdbData?.keywords?.length || genres.length} từ khóa)</span>
          </h2>
          {(tmdbData?.keywords?.length ? tmdbData.keywords : genres).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(tmdbData?.keywords?.length ? tmdbData.keywords : genres).map(g => (
                <span key={g} className="px-3 py-1.5 bg-transparent text-white/60 text-[13px] rounded-full border border-white/10 hover:text-white transition-colors cursor-pointer">{g}</span>
              ))}
            </div>
          ) : (
            <p className="text-white/40 text-[14px]">Không có từ khóa nào được tìm thấy</p>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-l-4 border-[#a855f7] pl-4">
            Hình ảnh <span className="text-white/40 text-sm font-normal">({tmdbData?.backdrops?.length || 2} ảnh)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tmdbData?.backdrops && tmdbData.backdrops.length > 0 ? (
              tmdbData.backdrops.slice(0, 6).map((img, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden border border-white/5 shadow-lg relative group">
                  <img src={`https://image.tmdb.org/t/p/w780${img.file_path}`} alt={`Backdrop ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
              ))
            ) : (
              <>
                <div className="aspect-video rounded-xl overflow-hidden border border-white/5 shadow-lg relative group">
                  <img src={movie.thumbUrl} alt="Backdrop 1" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="aspect-video rounded-xl overflow-hidden border border-white/5 shadow-lg relative group">
                  <img src={movie.posterUrl} alt="Backdrop 2" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 object-top" />
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
