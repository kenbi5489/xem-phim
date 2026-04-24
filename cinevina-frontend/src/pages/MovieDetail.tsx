import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  HeartIcon, PlusIcon, StarIcon, XMarkIcon,
  PlayIcon, InformationCircleIcon, ShareIcon, CalendarIcon, ClockIcon,
  GlobeAltIcon, LanguageIcon, RectangleGroupIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolid } from '@heroicons/react/24/solid';
import { useMovieDetail, useMovieStream } from '../hooks/useMovies';
import { computeIsStreamable } from '../services/api';
import { EmbeddedPlayer } from '../components/ui/EmbeddedPlayer';

// ── YouTube embed helper ───────────────────────────────────────────────────────
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&]+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// ── Trailer Modal ─────────────────────────────────────────────────────────────
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

// ── PlayerSection — inline stream with EmbeddedPlayer ─────────────────────────
const PlayerSection: React.FC<{
  movieSlug: string;
  movieName: string;
  servers: any[];
  initialEpSlug: string;
}> = ({ movieSlug, movieName, servers, initialEpSlug }) => {
  const [activeServer, setActiveServer] = useState(0);
  const [activeEpSlug, setActiveEpSlug] = useState(initialEpSlug);

  const { data: stream, isLoading } = useMovieStream(movieSlug, activeEpSlug);

  const handleEpisodeChange = (serverIdx: number, epSlug: string) => {
    setActiveServer(serverIdx);
    setActiveEpSlug(epSlug);
    // Scroll to player smoothly
    document.getElementById('cinevina-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <div id="cinevina-player" className="w-full aspect-video bg-black rounded-[32px] flex items-center justify-center border border-white/10">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!stream) return null;

  return (
    <div id="cinevina-player" className="scroll-mt-24">
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

// ── Main component ────────────────────────────────────────────────────────────
export const MovieDetail: React.FC = () => {
  const { slug } = useParams();
  const { data: movie, isLoading, error, refetch } = useMovieDetail(slug || '');
  const [showTrailer, setShowTrailer] = useState(false);
  const [isWatching, setIsWatching]   = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
  if (error || !movie) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <p className="text-white/40 font-bold uppercase tracking-widest">Lỗi tải dữ liệu...</p>
      <button onClick={() => refetch()} className="btn-vibrant">THỬ LẠI</button>
    </div>
  );

  const isStreamable = computeIsStreamable(movie);
  const firstEp      = movie.servers?.[0]?.server_data?.[0]?.slug || movie.episodes?.[0]?.slug || '';
  const trailerYtId  = extractYouTubeId(movie.trailerUrl || '');
  const is4K         = movie.quality?.toUpperCase().includes('4K');

  const handleWatchNow = () => {
    setIsWatching(true);
    // Give React a tick to render, then scroll
    setTimeout(() => {
      document.getElementById('cinevina-player')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="flex flex-col pb-24 bg-background min-h-screen">
      {showTrailer && trailerYtId && <TrailerModal videoId={trailerYtId} onClose={() => setShowTrailer(false)} />}

      {/* ── Dynamic Hero Background ── */}
      <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <img src={movie.posterUrl || movie.thumbUrl || ""} className="w-full h-full object-cover object-top opacity-25 blur-3xl scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-12 w-full pb-10 md:pb-20 flex flex-col md:grid md:grid-cols-[auto,1fr] gap-8 md:gap-12 items-end">
            
            {/* Poster */}
            <div className="hidden md:block shrink-0 w-56 lg:w-72 aspect-[2/3] rounded-[32px] overflow-hidden border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9)] -rotate-2 hover:rotate-0 transition-all duration-700 movie-card-glow">
              <img src={movie.thumbUrl || movie.posterUrl || ""} className="w-full h-full object-cover" alt={movie.name} />
              {movie.isCinema && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse">ĐANG CHIẾU</div>
              )}
            </div>

            {/* Info Block */}
            <div className="flex flex-col gap-5 md:gap-7 max-w-4xl glass-premium p-6 md:p-10 rounded-[32px] md:rounded-[40px]">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3">
                {movie.quality && (
                  <span className={`text-[11px] font-black px-3 py-1.5 rounded-full uppercase shadow-lg ${is4K ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-black' : 'bg-primary text-white shadow-[0_0_15px_rgba(175,37,254,0.4)]'}`}>
                    {movie.quality}
                  </span>
                )}
                {movie.lang && <span className="bg-white/5 text-white/70 text-[11px] font-black px-3 py-1.5 rounded-full border border-white/10 uppercase">{movie.lang}</span>}
                <span className="flex items-center gap-1.5 text-yellow-400 font-black text-sm px-3 py-1.5 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                  <StarIcon className="w-4 h-4 fill-current" /> {movie.rating || '8.5'}
                </span>
                {movie.year && <span className="text-white/40 text-[12px] font-black tracking-[0.2em] uppercase">{movie.year}</span>}
              </div>

              <div>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1] uppercase tracking-tighter italic drop-shadow-2xl">
                  {movie.name}
                </h1>
                {movie.originalName && <p className="text-primary font-black text-base md:text-xl tracking-tight uppercase italic mt-2 opacity-90">{movie.originalName}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                {isStreamable && firstEp ? (
                  <button
                    onClick={handleWatchNow}
                    className="btn-vibrant !px-8 md:!px-12 !py-4 md:!py-5 flex items-center gap-3 group"
                  >
                    <PlaySolid className="w-6 h-6 md:w-7 md:h-7 group-hover:scale-125 transition-transform" />
                    {isWatching ? 'ĐANG PHÁT' : 'XEM NGAY'}
                  </button>
                ) : (
                  <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white/40 font-black text-xs uppercase tracking-widest italic">
                    <InformationCircleIcon className="w-5 h-5" /> Sắp ra mắt
                  </div>
                )}

                {trailerYtId && (
                  <button onClick={() => setShowTrailer(true)} className="flex items-center gap-2 px-6 py-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-black text-xs tracking-widest uppercase group">
                    <PlayIcon className="w-5 h-5 text-red-500" /> Trailer
                  </button>
                )}

                <div className="flex gap-2">
                  <button className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 border border-white/10 text-white hover:text-red-500 hover:border-red-500/40 transition-all flex items-center justify-center group">
                    <HeartIcon className="w-6 h-6 group-hover:fill-red-500 transition-all" />
                  </button>
                  <button className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/5 border border-white/10 text-white hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center group">
                    <PlusIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inline Player (renders when Watch Now is clicked) ── */}
      {isWatching && isStreamable && movie.servers && firstEp && (
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-12 w-full mt-8 md:mt-12">
          <PlayerSection
            movieSlug={movie.slug}
            movieName={movie.name}
            servers={movie.servers}
            initialEpSlug={firstEp}
          />
        </div>
      )}

      {/* ── Content Details ── */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-10 md:gap-16 mt-10 md:mt-16">
        
        {/* Left: Description */}
        <div className="flex flex-col gap-10 md:gap-16">
          {movie.description && (
            <section className="glass-premium p-6 md:p-10 rounded-[32px] md:rounded-[40px] relative overflow-hidden">
              <div className="flex flex-col gap-2 mb-6">
                <h3 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4 text-gradient-primary">
                  <InformationCircleIcon className="w-7 h-7 md:w-8 md:h-8 shrink-0" /> Nội Dung Phim
                </h3>
                <div className="h-1 w-16 bg-primary rounded-full" />
              </div>
              <div className={`text-white/70 leading-[1.8] text-base md:text-lg font-medium italic overflow-hidden transition-all duration-500 ${descExpanded ? '' : 'max-h-48 md:max-h-none'}`}
                dangerouslySetInnerHTML={{ __html: movie.description }}
              />
              {/* Mobile expand button for long descriptions */}
              <button
                className="md:hidden mt-4 flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest"
                onClick={() => setDescExpanded(v => !v)}
              >
                {descExpanded ? 'Thu gọn' : 'Đọc thêm'} <ChevronDownIcon className={`w-4 h-4 transition-transform ${descExpanded ? 'rotate-180' : ''}`} />
              </button>
            </section>
          )}
        </div>

        {/* Right: Metadata Sidebar */}
        <div className="flex flex-col gap-8 md:gap-10">
          <section className="glass-premium p-6 md:p-10 rounded-[32px] md:rounded-[40px] flex flex-col gap-6 md:gap-8">
            <h3 className="font-display text-lg font-black text-white uppercase tracking-[0.2em] italic border-b border-white/5 pb-5 text-gradient-primary">Thông tin phim</h3>
            
            <div className="flex flex-col gap-5 md:gap-8">
              {[
                { icon: CalendarIcon, label: 'Phát hành', val: movie.year },
                { icon: GlobeAltIcon, label: 'Quốc gia', val: movie.country },
                { icon: RectangleGroupIcon, label: 'Thể loại', val: movie.categories },
                { icon: LanguageIcon, label: 'Ngôn ngữ', val: movie.lang },
                { icon: ClockIcon, label: 'Số tập', val: movie.totalEpisodes ? `${movie.totalEpisodes} tập` : 'Đang cập nhật' },
              ].map(item => item.val ? (
                <div key={item.label} className="flex gap-4 group">
                  <div className="shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{item.label}</p>
                    <p className="text-sm md:text-[15px] font-extrabold text-white/90 mt-0.5">{item.val}</p>
                  </div>
                </div>
              ) : null)}

              {movie.cast && (
                <div className="pt-6 border-t border-white/5">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Diễn viên chính</p>
                  <div className="flex flex-wrap gap-2">
                    {movie.cast.split(',').slice(0, 8).map(name => (
                      <span key={name} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[12px] md:text-[13px] font-bold text-white/60 hover:text-white hover:border-primary/40 hover:bg-primary/10 transition-all cursor-default">
                        {name.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button className="w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-2xl md:rounded-[24px] bg-white/5 border border-white/10 text-white/60 font-black text-xs md:text-[13px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all group">
              <ShareIcon className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" /> Chia sẻ phim
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
