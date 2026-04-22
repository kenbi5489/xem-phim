import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  HeartIcon, PlusIcon, StarIcon, ExclamationTriangleIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon as PlaySolid, FilmIcon } from '@heroicons/react/24/solid';
import { useMovieDetail } from '../hooks/useMovies';
import type { EpisodeData, ServerData } from '../services/api';
import { getFirstStream, computeIsStreamable } from '../services/api';

// ── YouTube embed helper ───────────────────────────────────────────────────────
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// ── Trailer Modal ─────────────────────────────────────────────────────────────
const TrailerModal: React.FC<{ videoId: string; onClose: () => void }> = ({ videoId, onClose }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="relative w-full max-w-5xl mx-4 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black transition-colors"
        aria-label="Đóng trailer"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
        title="Trailer"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  </div>
);

// ── EpisodeList ───────────────────────────────────────────────────────────────
const EpisodeList: React.FC<{
  servers: ServerData[];
  movieSlug: string;
  currentEpSlug?: string;
}> = ({ servers, movieSlug, currentEpSlug }) => {
  const [activeServer, setActiveServer] = useState(0);
  if (!servers || servers.length === 0) return null;

  const server = servers[activeServer];

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-display text-xl font-bold text-white">Danh Sách Tập</h3>
        {servers.length > 1 && (
          <div className="flex gap-2">
            {servers.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveServer(i)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeServer === i
                    ? 'bg-[#d692ff] text-[#3a005a]'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {s.server_name || `Server ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-64 overflow-y-auto pr-2">
        {server.server_data.map(ep => {
          const hasStream = !!(ep.link_m3u8 || ep.link_embed);
          const isCurrent = currentEpSlug === ep.slug;
          return (
            <Link key={ep.slug} to={`/play/${movieSlug}/${ep.slug}`}>
              <button
                className={`w-full py-2 text-center rounded-lg transition-all text-xs font-semibold truncate px-1 border ${
                  isCurrent
                    ? 'bg-[#d692ff] text-[#3a005a] border-[#d692ff]'
                    : hasStream
                    ? 'bg-[#1d1f27] hover:bg-[#d692ff] hover:text-white text-white/70 border-white/8 hover:border-[#d692ff]'
                    : 'bg-[#1d1f27] text-white/30 border-white/5 cursor-not-allowed'
                }`}
                title={!hasStream ? 'Chưa có nguồn phát' : ep.name}
              >
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col pb-12 animate-pulse">
        <div className="relative w-full h-[50vh] md:h-[70vh] bg-[#1d1f27]" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="h-8 w-1/3 bg-[#1d1f27] rounded" />
            <div className="h-40 w-full bg-[#1d1f27] rounded-xl" />
          </div>
          <div className="h-72 w-full bg-[#1d1f27] rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !movie) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-6">
        <ExclamationTriangleIcon className="w-16 h-16 text-white/30" />
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Không thể tải thông tin phim</h2>
          <p className="text-white/50 mt-2">Phim này có thể không tồn tại hoặc hệ thống đang gặp lỗi.</p>
        </div>
        <Button onClick={() => refetch()} variant="secondary">Thử lại</Button>
      </div>
    );
  }

  // ── Derive playability from servers (source of truth) ─────────────────────
  const isStreamable = computeIsStreamable(movie);
  const firstStream = getFirstStream(movie);
  const firstEpisodeSlug = movie.servers?.[0]?.server_data?.[0]?.slug || movie.episodes?.[0]?.slug || '';
  const trailerYtId = extractYouTubeId(movie.trailer_url || '');
  const isCinema = movie.is_cinema === true;

  return (
    <div className="flex flex-col pb-12">

      {/* Trailer Modal */}
      {showTrailer && trailerYtId && (
        <TrailerModal videoId={trailerYtId} onClose={() => setShowTrailer(false)} />
      )}

      {/* Backdrop Hero */}
      <div className="relative w-full h-[50vh] md:h-[70vh] bg-[#0c0e14]">
        <div className="absolute inset-0">
          <img
            src={movie.poster_url || movie.thumb_url || ""}
            alt="Backdrop"
            className="w-full h-full object-cover opacity-25 blur-sm"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.dataset.fallbackApplied === "true") return;
              if (movie.thumb_url && img.src !== movie.thumb_url) {
                img.dataset.fallbackApplied = "true";
                img.src = movie.thumb_url;
                return;
              }
              img.dataset.fallbackApplied = "true";
              img.src = "/fallback-poster.svg";
            }}
          />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, #0F1117 0%, rgba(15,17,23,0.7) 50%, transparent 100%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, #0F1117 0%, transparent 60%)' }} />
        </div>

        {/* Cinema banner */}
        {isCinema && (
          <div className="absolute top-20 left-0 right-0 flex justify-center z-10">
            <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              ĐANG CHIẾU TẠI RẠP
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>
        )}

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 w-full max-w-7xl mx-auto px-4 md:px-8 translate-y-1/4">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Poster */}
            <div className={`shrink-0 w-40 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] border ${isCinema ? 'border-yellow-500/40' : 'border-white/10'}`}>
              <img
                src={movie.thumb_url || movie.poster_url || ""}
                alt="Poster"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fallbackApplied === "true") return;
                  if (movie.poster_url && img.src !== movie.poster_url) {
                    img.dataset.fallbackApplied = "true";
                    img.src = movie.poster_url;
                    return;
                  }
                  img.dataset.fallbackApplied = "true";
                  img.src = "/fallback-poster.svg";
                }}
              />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-3 mb-4">
              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-2">
                {isCinema && (
                  <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-sm uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> ĐANG CHIẾU
                  </span>
                )}
                {movie.quality && !isCinema && (
                  <span className="bg-[#d692ff] text-[#3a005a] text-xs font-black px-2 py-0.5 rounded-sm uppercase">{movie.quality}</span>
                )}
                {movie.lang && (
                  <span className="bg-white/15 text-white text-xs font-semibold px-2 py-0.5 rounded-sm backdrop-blur-sm">{movie.lang}</span>
                )}
                {movie.year && <span className="text-white/60 text-sm">{movie.year}</span>}
                {movie.rating && (
                  <span className="flex items-center gap-1 text-yellow-400 text-sm">
                    <StarIcon className="w-4 h-4 fill-current" /> {movie.rating}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl md:text-5xl font-black text-white leading-tight">
                {movie.title}
              </h1>
              {movie.original_title && (
                <p className="text-white/50 text-sm italic">{movie.original_title}</p>
              )}

              {/* CTA row — derived from actual stream data */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {isStreamable && firstEpisodeSlug ? (
                  /* Có stream thật → Xem Ngay */
                  <Link to={`/play/${movie.slug}/${firstEpisodeSlug}`}>
                    <button
                      className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#d692ff,#af25fe)', boxShadow: '0 0 28px rgba(214,146,255,0.5)' }}
                    >
                      <PlaySolid className="w-5 h-5" />
                      Xem Ngay
                    </button>
                  </Link>
                ) : trailerYtId ? (
                  /* Không có stream nhưng có trailer → Xem Trailer */
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="flex items-center gap-2 px-7 py-3 rounded-full font-bold text-white text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#fe7e4f,#ef4444)', boxShadow: '0 0 24px rgba(239,68,68,0.4)' }}
                  >
                    <PlaySolid className="w-5 h-5" />
                    Xem Trailer
                  </button>
                ) : (
                  /* Không có gì → Chưa có nguồn phát */
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white/50 text-sm bg-white/5">
                    <FilmIcon className="w-4 h-4" />
                    Chưa có nguồn phát
                  </div>
                )}

                {/* Trailer button as secondary (if also has stream) */}
                {isStreamable && trailerYtId && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-white text-sm border border-white/25 hover:bg-white/10 transition-all backdrop-blur-sm"
                  >
                    <PlaySolid className="w-4 h-4 text-[#fe7e4f]" />
                    Trailer
                  </button>
                )}

                {/* Action buttons */}
                <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10" aria-label="Yêu thích">
                  <HeartIcon className="w-5 h-5 text-[#d692ff]" />
                </button>
                <button className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10" aria-label="Thêm vào danh sách">
                  <PlusIcon className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-32 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Left col */}
        <div className="md:col-span-2 flex flex-col gap-8">
          {/* Description */}
          {movie.description && (
            <section>
              <h3 className="font-display text-xl font-bold text-white mb-3">Nội Dung Phim</h3>
              <div
                className="text-white/65 leading-relaxed text-base"
                dangerouslySetInnerHTML={{ __html: movie.description }}
              />
            </section>
          )}

          {/* Trailer preview (if cinema or no stream) */}
          {trailerYtId && (!isStreamable || isCinema) && (
            <section>
              <h3 className="font-display text-xl font-bold text-white mb-3">Trailer Chính Thức</h3>
              <div
                className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 cursor-pointer group"
                onClick={() => setShowTrailer(true)}
              >
                <img
                  src={`https://img.youtube.com/vi/${trailerYtId}/maxresdefault.jpg`}
                  alt="Trailer thumbnail"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.9)', boxShadow: '0 0 40px rgba(239,68,68,0.5)' }}>
                    <PlaySolid className="w-10 h-10 text-white ml-1" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Episodes — only for non-cinema movies with stream */}
          {!isCinema && isStreamable && movie.servers && movie.servers.length > 0 && (
            <EpisodeList servers={movie.servers} movieSlug={movie.slug} />
          )}
        </div>

        {/* Right col — Movie metadata */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl bg-[#11131a] border border-white/8 h-fit">
          {[
            ['Tên gốc',       movie.original_title],
            ['Năm sản xuất',  movie.year?.toString()],
            ['Quốc gia',      movie.country],
            ['Đạo diễn',      movie.director],
            ['Diễn viên',     movie.cast],
            ['Chất lượng',    isCinema ? 'Đang chiếu rạp' : movie.quality],
            ['Đánh giá',      movie.rating ? `${movie.rating} / 10` : ''],
            ['Ngôn ngữ',      movie.lang],
            ['Thể loại',      movie.category],
            ['Tổng số tập',   movie.totalEpisodes],
            ['Loại phim',     isCinema ? 'Chiếu rạp' : movie.type],
          ].map(([label, value]) => value ? (
            <div key={label} className="flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0 last:pb-0">
              <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
              <span className="font-semibold text-white/90 text-sm">{value}</span>
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  );
};
