import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  HeartIcon, PlusIcon, StarIcon, XMarkIcon,
  PlayIcon, InformationCircleIcon, ShareIcon, CalendarIcon, ClockIcon,
  GlobeAltIcon, LanguageIcon, RectangleGroupIcon
} from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolid } from '@heroicons/react/24/solid';
import { useMovieDetail } from '../hooks/useMovies';
import type { ServerData } from '../services/api';
import { computeIsStreamable } from '../services/api';

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

// ── EpisodeList ───────────────────────────────────────────────────────────────
const EpisodeList: React.FC<{ servers: ServerData[]; movieSlug: string; currentEpSlug?: string; }> = ({ servers, movieSlug, currentEpSlug }) => {
  const [activeServer, setActiveServer] = useState(0);
  if (!servers || servers.length === 0) return null;
  const server = servers[activeServer];

  return (
    <section className="bg-white/5 rounded-3xl border border-white/5 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-purple-600 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
          <h3 className="font-display text-2xl font-black text-white uppercase tracking-tighter">Danh Sách Tập</h3>
        </div>
        {servers.length > 1 && (
          <div className="flex gap-2 bg-black/20 p-1 rounded-full">
            {servers.map((s, i) => (
              <button key={i} onClick={() => setActiveServer(i)}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeServer === i ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                {s.server_name || `Nguồn ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-12 gap-3">
        {server.server_data.map(ep => {
          const isCurrent = currentEpSlug === ep.slug;
          return (
            <Link key={ep.slug} to={`/play/${movieSlug}/${ep.slug}`}>
              <button className={`w-full py-3.5 rounded-xl transition-all text-sm font-black border ${isCurrent ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20'}`}>
                {ep.name}
              </button>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const MovieDetail: React.FC = () => {
  const { slug } = useParams();
  const { data: movie, isLoading, error, refetch } = useMovieDetail(slug || '');
  const [showTrailer, setShowTrailer] = useState(false);

  if (isLoading) return <div className="min-h-screen bg-black animate-pulse" />;
  if (error || !movie) return <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6"><p className="text-white/40">Lỗi tải dữ liệu...</p><Button onClick={() => refetch()}>Thử lại</Button></div>;

  const isStreamable = computeIsStreamable(movie);
  const firstEp = movie.servers?.[0]?.server_data?.[0]?.slug || movie.episodes?.[0]?.slug || '';
  const trailerYtId = extractYouTubeId(movie.trailerUrl || '');

  return (
    <div className="flex flex-col pb-20 bg-[#0c0e14] min-h-screen">
      {showTrailer && trailerYtId && <TrailerModal videoId={trailerYtId} onClose={() => setShowTrailer(false)} />}

      {/* ── Dynamic Hero Background ── */}
      <div className="relative w-full h-[65vh] md:h-[85vh] overflow-hidden">
        <div className="absolute inset-0">
          <img src={movie.posterUrl || movie.thumbUrl || ""} className="w-full h-full object-cover object-top opacity-30 blur-2xl scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0e14] via-transparent to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1440px] mx-auto px-4 md:px-8 w-full pb-10 md:pb-20 grid grid-cols-1 md:grid-cols-[auto,1fr] gap-10 items-end">
            
            {/* Poster - 2:3 ratio, premium shadow */}
            <div className="hidden md:block shrink-0 w-64 lg:w-72 aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] transform -rotate-2 hover:rotate-0 transition-all duration-700">
              <img src={movie.thumbUrl || movie.posterUrl || ""} className="w-full h-full object-cover" alt={movie.name} />
              {movie.isCinema && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest animate-pulse">ĐANG CHIẾU</div>
              )}
            </div>

            {/* Info Block */}
            <div className="flex flex-col gap-6 mb-4 max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                {movie.quality && <span className="bg-purple-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase shadow-[0_0_20px_rgba(168,85,247,0.4)]">{movie.quality}</span>}
                {movie.lang && <span className="bg-white/10 text-white/80 text-xs font-bold px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm uppercase">{movie.lang}</span>}
                <span className="flex items-center gap-1.5 text-yellow-400 font-black text-sm px-3 py-1 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                  <StarIcon className="w-4 h-4 fill-current" /> {movie.rating || '8.5'}
                </span>
                {movie.year && <span className="text-white/40 text-sm font-bold tracking-widest uppercase">{movie.year}</span>}
              </div>

              <h1 className="font-display text-4xl md:text-7xl font-black text-white leading-[0.9] uppercase tracking-tighter italic drop-shadow-2xl">
                {movie.name}
              </h1>
              {movie.originalName && <p className="text-purple-400 font-bold text-lg md:text-xl tracking-tight opacity-80">{movie.originalName}</p>}

              {/* Action row */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {isStreamable && firstEp ? (
                  <Link to={`/play/${movie.slug}/${firstEp}`}>
                    <button className="flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-black text-sm tracking-widest shadow-[0_20px_40px_rgba(168,85,247,0.3)] hover:scale-105 transition-all">
                      <PlaySolid className="w-6 h-6" /> XEM NGAY
                    </button>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white/40 font-bold text-xs uppercase tracking-widest italic">
                    <InformationCircleIcon className="w-5 h-5" /> Sắp ra mắt
                  </div>
                )}

                {trailerYtId && (
                  <button onClick={() => setShowTrailer(true)} className="flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-black text-xs tracking-widest uppercase">
                    <PlayIcon className="w-5 h-5 text-red-500" /> Trailer
                  </button>
                )}

                <div className="flex gap-2">
                  <button className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:text-red-500 hover:bg-white/10 transition-all shadow-lg group">
                    <HeartIcon className="w-6 h-6 group-hover:fill-red-500" />
                  </button>
                  <button className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all shadow-lg">
                    <PlusIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Details ── */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-12 mt-12">
        
        {/* Left Side: Summary & Episodes */}
        <div className="flex flex-col gap-14">
          {movie.description && (
            <section className="bg-white/5 rounded-3xl border border-white/5 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <InformationCircleIcon className="w-32 h-32" />
              </div>
              <h3 className="font-display text-2xl font-black text-white mb-6 uppercase tracking-tighter flex items-center gap-3">
                <InformationCircleIcon className="w-7 h-7 text-purple-500" /> Nội Dung Phim
              </h3>
              <div className="text-white/60 leading-loose text-lg font-medium italic" dangerouslySetInnerHTML={{ __html: movie.description }} />
            </section>
          )}

          {!movie.isCinema && isStreamable && movie.servers && (
            <EpisodeList servers={movie.servers} movieSlug={movie.slug} />
          )}
        </div>

        {/* Right Side: Metadata Sidebar */}
        <div className="flex flex-col gap-8">
          <section className="bg-[#11131a] rounded-3xl border border-white/5 p-8 shadow-2xl flex flex-col gap-6">
            <h3 className="font-display text-lg font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">Thông tin chi tiết</h3>
            
            <div className="flex flex-col gap-6">
              {[
                { icon: CalendarIcon, label: 'Phát hành', val: movie.year },
                { icon: GlobeAltIcon, label: 'Quốc gia', val: movie.country },
                { icon: RectangleGroupIcon, label: 'Thể loại', val: movie.categories },
                { icon: LanguageIcon, label: 'Ngôn ngữ', val: movie.lang },
                { icon: ClockIcon, label: 'Thời lượng', val: movie.totalEpisodes ? `${movie.totalEpisodes} tập` : 'Đang cập nhật' },
              ].map(item => item.val ? (
                <div key={item.label} className="flex gap-4 group">
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-600/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-bold text-white/80 mt-0.5">{item.val}</p>
                  </div>
                </div>
              ) : null)}

              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Diễn viên chính</p>
                <div className="flex flex-wrap gap-2">
                  {movie.cast?.split(',').map(name => (
                    <span key={name} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[12px] font-bold text-white/60 hover:text-white hover:border-purple-600/40 transition-all cursor-default">
                      {name.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <button className="w-full flex items-center justify-center gap-3 py-4 mt-4 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all group">
              <ShareIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Chia sẻ phim
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
