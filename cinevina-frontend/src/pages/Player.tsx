import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { ArrowLeftIcon, ExclamationTriangleIcon, ListBulletIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { BackwardIcon, ForwardIcon } from '@heroicons/react/24/solid';

import { useMovieStream, useMovieDetail } from '../hooks/useMovies';

export const Player: React.FC = () => {
  const { slug, episode } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  useEffect(() => {
    showControls();
    return () => clearTimeout(hideTimer.current);
  }, []);


  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = async () => {
    const el = wrapperRef.current;
    if (!el) return;

    const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    
    try {
      if (!isFull) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
        
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape');
        }
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
        
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    } catch (e) {
      console.warn('Fullscreen/Orientation error:', e);
    }
  };

  const { data: stream, isLoading: loadStream, error: errStream } = useMovieStream(slug || '', episode || '');
  const { data: movie } = useMovieDetail(slug || '');

  const skipTime = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stream?.type !== 'hls') return;
      if (e.key === 'ArrowLeft') {
        skipTime(-10);
      } else if (e.key === 'ArrowRight') {
        skipTime(10);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stream]);

  useEffect(() => {
    const handler = async () => {
      const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (isFull && screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape');
        } catch (e) {
          console.warn('Orientation lock failed', e);
        }
      } else if (!isFull && screen.orientation && screen.orientation.unlock) {
        try {
          screen.orientation.unlock();
        } catch (e) {
          console.warn('Orientation unlock failed', e);
        }
      }
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  useEffect(() => {
    if (!stream?.url || !videoRef.current) return;
    if (stream.type !== 'hls') return;

    // Destroy old HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 90 });
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
    <div ref={wrapperRef} className="fixed inset-0 z-[100] bg-black flex flex-col">
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
            <h2 className="text-white font-display font-bold text-lg">{movie?.name || slug?.replace(/-/g, ' ')}</h2>
            <p className="text-white/70 text-sm">Tập {episode}</p>
          </div>
        </div>

        {/* Actions toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Toàn màn hình"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setFitMode(f => f === 'contain' ? 'cover' : 'contain')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-medium hidden md:flex"
            title={fitMode === 'contain' ? 'Phóng to toàn màn hình (Cắt lề)' : 'Thu về mặc định (Đủ khung hình)'}
          >
            {fitMode === 'contain' ? 'Phóng to' : 'Thu nhỏ'}
          </button>

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
      </div>

      {/* Episode Sidebar */}
      {showEpisodes && allEpisodes.length > 0 && (
        <div className="absolute right-0 top-0 h-full w-64 bg-black/95 z-20 flex flex-col p-4 overflow-y-auto gap-2">
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

      {/* Video / Embed Container */}
      <div 
        className="relative flex-1 bg-black overflow-hidden"
        onMouseMove={showControls}
        onTouchStart={showControls}
        onDoubleClick={() => setFitMode(f => f === 'contain' ? 'cover' : 'contain')}
      >
        {stream.type === 'embed' ? (
          <iframe
            src={stream.url}
            className={`w-full h-full border-none transition-all duration-300 ${fitMode === 'cover' ? 'max-w-none max-h-none' : ''}`}
            allowFullScreen
            style={fitMode === 'cover' ? {
              width: '115%',
              height: '115%',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            } : {}}
          />
        ) : (
          <video
            ref={videoRef}
            className={`w-full h-full transition-all duration-300 ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
            controls
            autoPlay
            onDoubleClick={(e) => { e.stopPropagation(); setFitMode(f => f === 'contain' ? 'cover' : 'contain'); }}
          />
        )}

        {/* Netflix-like Skip Buttons Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex gap-20 md:gap-40 pointer-events-auto">
            <button
              onClick={() => {
                if (stream.type === 'embed') {
                  alert('Luồng phát nhúng không hỗ trợ tua trực tiếp. Vui lòng dùng thanh điều khiển của luồng phát!');
                } else {
                  skipTime(-10);
                }
              }}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/50 hover:bg-black/70 text-white flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 border border-white/10"
              title="Tua lùi 10s"
            >
              <BackwardIcon className="w-5 h-5 md:w-6 md:h-6 mb-0.5" />
              <span className="text-[9px] md:text-[10px] font-black tracking-tight">-10s</span>
            </button>

            <button
              onClick={() => {
                if (stream.type === 'embed') {
                  alert('Luồng phát nhúng không hỗ trợ tua trực tiếp. Vui lòng dùng thanh điều khiển của luồng phát!');
                } else {
                  skipTime(10);
                }
              }}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/50 hover:bg-black/70 text-white flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 border border-white/10"
              title="Tua tới 10s"
            >
              <ForwardIcon className="w-5 h-5 md:w-6 md:h-6 mb-0.5" />
              <span className="text-[9px] md:text-[10px] font-black tracking-tight">+10s</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
