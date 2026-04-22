import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { ArrowLeftIcon, ExclamationTriangleIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useMovieStream, useMovieDetail } from '../hooks/useMovies';

export const Player: React.FC = () => {
  const { slug, episode } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showEpisodes, setShowEpisodes] = useState(false);

  const { data: stream, isLoading: loadStream, error: errStream } = useMovieStream(slug || '', episode || '');
  const { data: movie } = useMovieDetail(slug || '');

  useEffect(() => {
    if (!stream?.url || !videoRef.current) return;
    if (stream.type !== 'hls') return;

    // Destroy old HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 600 });
      hlsRef.current = hls;
      hls.loadSource(stream.url);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {});
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = stream.url;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(() => {});
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [stream]);

  if (loadStream) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-white mt-4 font-display">Đang tải luồng phát...</p>
      </div>
    );
  }

  if (errStream || !stream) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white gap-6">
        <ExclamationTriangleIcon className="w-20 h-20 text-[var(--color-secondary)]" />
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold">Lỗi tải luồng phát</h2>
          <p className="text-white/70 mt-2">Không tìm thấy link phát hoặc nguồn phim đang bảo trì.</p>
        </div>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
          Quay lại
        </button>
      </div>
    );
  }

  // Get episodes from servers for switching
  const allEpisodes = movie?.servers?.flatMap(s => s.server_data) ?? movie?.episodes ?? [];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-white font-display font-bold text-lg">{movie?.title || slug?.replace(/-/g, ' ')}</h2>
            <p className="text-white/70 text-sm">Tập {episode}</p>
          </div>
        </div>

        {/* Episode list toggle */}
        {allEpisodes.length > 1 && (
          <button
            onClick={() => setShowEpisodes(v => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
          >
            <ListBulletIcon className="w-5 h-5" />
            Danh sách tập
          </button>
        )}
      </div>

      {/* Episode Sidebar */}
      {showEpisodes && allEpisodes.length > 0 && (
        <div className="absolute right-0 top-0 h-full w-64 bg-black/90 backdrop-blur-md z-20 flex flex-col p-4 overflow-y-auto gap-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold text-sm">Chọn tập</h3>
            <button onClick={() => setShowEpisodes(false)} className="text-white/60 hover:text-white text-xs">✕</button>
          </div>
          {allEpisodes.map((ep: any) => {
            const epSlug = ep.slug || ep.id;
            const isCurrent = epSlug === episode;
            return (
              <Link key={epSlug} to={`/play/${slug}/${epSlug}`} onClick={() => setShowEpisodes(false)}>
                <div className={`px-3 py-2 rounded-lg text-sm transition-all ${
                  isCurrent
                    ? 'bg-[#d692ff] text-[#3a005a] font-bold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}>
                  {ep.name || epSlug}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Video / Embed */}
      {stream.type === 'embed' ? (
        <iframe
          src={stream.url}
          className="w-full h-full border-none"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          autoPlay
        />
      )}
    </div>
  );
};
