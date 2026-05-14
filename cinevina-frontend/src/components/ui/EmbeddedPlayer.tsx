import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ListBulletIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { SpeakerWaveIcon, SpeakerXMarkIcon, PlayIcon, PauseIcon, BackwardIcon, ForwardIcon } from '@heroicons/react/24/solid';
import type { ServerData } from '../../services/api';

interface EmbeddedPlayerProps {
  /** HLS stream URL or embed iframe URL */
  streamUrl: string;
  streamType: 'hls' | 'embed';
  movieSlug: string;
  movieName?: string;
  /** Current episode slug */
  currentEpisode: string;
  /** All servers for episode switching */
  servers: ServerData[];
  /** Called when user picks a different episode */
  onEpisodeChange: (serverIdx: number, episodeSlug: string) => void;
  className?: string;
}

export const EmbeddedPlayer: React.FC<EmbeddedPlayerProps> = ({
  streamUrl,
  streamType,
  movieName,
  currentEpisode,
  servers,
  onEpisodeChange,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const hlsRef       = useRef<Hls | null>(null);

  const [muted,      setMuted]      = useState(false);
  const [playing,    setPlaying]    = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showList,   setShowList]   = useState(true);   // Episode list open by default
  const [showOverlay, setShowOverlay] = useState(false);
  const [activeServer, setActiveServer] = useState(0);
  const [isLoading,  setIsLoading]  = useState(true);
  const [hasError,   setHasError]   = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── HLS initialisation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (streamType !== 'hls' || !videoRef.current) return;
    setIsLoading(true);
    setHasError(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const video = videoRef.current;
    if (Hls.isSupported()) {
      const hls = new Hls({ maxBufferLength: 60, maxMaxBufferLength: 90, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
        setPlaying(true);
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) { setHasError(true); setIsLoading(false); }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        setDuration(video.duration);
        video.play().catch(() => {});
        setPlaying(true);
      });
      video.addEventListener('error', () => { setHasError(true); setIsLoading(false); });
    } else {
      setHasError(true);
      setIsLoading(false);
    }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [streamUrl, streamType]);

  // ── Fullscreen API ──────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    const videoEl = videoRef.current;
    if (!el) return;

    if (!fullscreen) {
      if (el.requestFullscreen) {
        el.requestFullscreen().then(() => setFullscreen(true)).catch(() => setFullscreen(true));
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
        setFullscreen(true);
      } else if (videoEl && (videoEl as any).webkitEnterFullscreen) {
        (videoEl as any).webkitEnterFullscreen();
      } else {
        setFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().then(() => setFullscreen(false)).catch(() => setFullscreen(false));
      } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        setFullscreen(false);
      } else {
        setFullscreen(false);
      }
    }
  }, [fullscreen]);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ── Auto-hide controls ──────────────────────────────────────────────────────
  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    showControls();
    return () => clearTimeout(hideTimer.current);
  }, []);

  // ── Play/Pause toggle ───────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
  };

  const handleSeekStart = () => {
    setIsScrubbing(true);
  };

  const handleSeekEnd = () => {
    setIsScrubbing(false);
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  };

  const skipTime = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // ── Episode navigation helpers ──────────────────────────────────────────────
  const currentServer = servers[activeServer];
  const episodes      = currentServer?.server_data ?? [];
  const currentIdx    = episodes.findIndex(e => e.slug === currentEpisode);
  const prevEp        = currentIdx > 0 ? episodes[currentIdx - 1] : null;
  const nextEp        = currentIdx < episodes.length - 1 ? episodes[currentIdx + 1] : null;

  return (
    <div className={`flex flex-col lg:flex-row gap-0 rounded-[32px] overflow-hidden shadow-2xl border border-white/10 ${className}`}>
      
      {/* ── Video Area ────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`relative flex-1 bg-black aspect-video cursor-pointer min-w-0 group/video ${fullscreen ? 'fixed !inset-0 !z-[99999] !w-screen !h-[100dvh] !rounded-none' : ''}`}
        onMouseMove={showControls}
        onTouchStart={showControls}
        onClick={() => {
          if (streamType === 'hls') {
            if (!controlsVisible) {
              showControls();
            } else {
              togglePlay();
            }
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setFitMode(f => f === 'contain' ? 'cover' : 'contain');
        }}
      >
        {/* HLS Video */}
        {streamType === 'hls' && (
          <video
            ref={videoRef}
            className={`w-full h-full transition-all duration-300 ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
            muted={muted}
            playsInline
            onTimeUpdate={() => { if (!isScrubbing) setCurrentTime(videoRef.current?.currentTime || 0); }}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onClick={e => { e.stopPropagation(); togglePlay(); }}
            onDoubleClick={(e) => { e.stopPropagation(); setFitMode(f => f === 'contain' ? 'cover' : 'contain'); }}
          />
        )}

        {/* Embed iFrame */}
        {streamType === 'embed' && (
          <iframe
            src={streamUrl}
            className={`w-full h-full border-none transition-all duration-300 ${fitMode === 'cover' ? 'scale-110' : ''}`}
            allowFullScreen
            allow="autoplay; fullscreen"
            title={movieName}
          />
        )}

        {/* Loading Spinner */}
        {isLoading && streamType === 'hls' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 text-white">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500" />
            <p className="text-xl font-black uppercase italic">Không thể tải luồng phát</p>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest text-center max-w-xs">
              Thử chọn tập khác hoặc nguồn phát khác
            </p>
          </div>
        )}

        {/* Controls Overlay */}
        {streamType === 'hls' && (
          <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-500 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Top Bar */}
            <div className="flex items-center justify-between p-5 bg-gradient-to-b from-black/80 to-transparent">
              <div>
                <h2 className="text-white font-black text-base md:text-lg uppercase italic tracking-tight drop-shadow">{movieName}</h2>
                {currentEpisode && episodes.length > 1 && (
                  <p className="text-white/60 text-xs font-bold mt-0.5 uppercase tracking-widest">
                    {episodes[currentIdx]?.name || `Tập ${currentIdx + 1}`}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-primary transition-colors border border-white/10"
              >
                {fullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
              </button>
            </div>

            {/* Center Controls */}
            <div className="flex items-center justify-center gap-12 md:gap-24 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); skipTime(-10); }}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/60 hover:bg-black/80 flex flex-col items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 border border-white/10"
              >
                <BackwardIcon className="w-5 h-5 md:w-6 md:h-6 mb-0.5" />
                <span className="text-[9px] md:text-[10px] font-black tracking-tight">-10s</span>
              </button>

              <div 
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/80 hover:bg-black flex items-center justify-center transition-all duration-300 cursor-pointer border border-white/10 hover:scale-110 active:scale-95 ${playing ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              >
                {playing ? <PauseIcon className="w-8 h-8 md:w-10 md:h-10 text-white" /> : <PlayIcon className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" />}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); skipTime(10); }}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/60 hover:bg-black/80 flex flex-col items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 border border-white/10"
              >
                <ForwardIcon className="w-5 h-5 md:w-6 md:h-6 mb-0.5" />
                <span className="text-[9px] md:text-[10px] font-black tracking-tight">+10s</span>
              </button>
            </div>

            {/* Bottom Bar Container */}
            <div className="bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-10 pb-4 px-5">
              {/* Progress Bar */}
              <div className="relative group/progress mb-4" onClick={e => e.stopPropagation()}>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  onMouseDown={handleSeekStart}
                  onMouseUp={handleSeekEnd}
                  onTouchStart={handleSeekStart}
                  onTouchEnd={handleSeekEnd}
                  className="absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer z-10"
                />
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary" 
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                {/* Time Tooltip on Hover could go here */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform pointer-events-none"
                  style={{ left: `calc(${(currentTime / duration) * 100}% - 7px)` }}
                />
              </div>

              {/* Bottom Controls */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Play/Pause */}
                  <button
                    onClick={e => { e.stopPropagation(); togglePlay(); }}
                    className="text-white hover:text-primary transition-colors"
                  >
                    {playing ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                  </button>

                  {/* Mute */}
                  <button
                    onClick={e => { e.stopPropagation(); setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }}
                    className="text-white/70 hover:text-white transition-all"
                  >
                    {muted ? <SpeakerXMarkIcon className="w-5 h-5" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                  </button>

                  {/* Time Display */}
                  <div className="text-[11px] font-black text-white/60 tracking-widest uppercase">
                    <span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}
                  </div>

                  {/* Prev Episode */}
                  {prevEp && (
                    <button
                      onClick={e => { e.stopPropagation(); onEpisodeChange(activeServer, prevEp.slug); }}
                      className="hidden sm:flex items-center gap-1 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors ml-2"
                    >
                      <ChevronLeftIcon className="w-3.5 h-3.5" /> Tập trước
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Next Episode */}
                  {nextEp && (
                    <button
                      onClick={e => { e.stopPropagation(); onEpisodeChange(activeServer, nextEp.slug); }}
                      className="hidden sm:flex items-center gap-1 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors mr-2"
                    >
                      Tập tiếp <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Toggle Episode List */}
                  {episodes.length > 1 && (
                    <button
                      onClick={e => { 
                        e.stopPropagation(); 
                        setShowOverlay(v => !v);
                      }}
                      className="flex items-center gap-1.5 p-2 -m-2 text-white/70 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      <ListBulletIcon className="w-5 h-5" />
                      <span className="hidden md:inline">Danh sách tập</span>
                    </button>
                  )}

                  {/* Fullscreen */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setFitMode(f => f === 'contain' ? 'cover' : 'contain'); }}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary transition-all hidden md:flex"
                      title={fitMode === 'contain' ? 'Phóng to' : 'Thu nhỏ'}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{fitMode === 'contain' ? 'Zoom' : 'Fit'}</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleFullscreen(); }}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary transition-all"
                    >
                      {fullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Episode Overlay (For Fullscreen/Mobile) ── */}
        {showOverlay && episodes.length > 0 && (
          <div 
            className="absolute inset-0 z-50 bg-black/95 flex flex-col p-6 md:p-12 animate-in fade-in duration-300 pointer-events-auto"
            onClick={(e) => { e.stopPropagation(); setShowOverlay(false); }}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-white font-black text-xl md:text-2xl uppercase tracking-widest drop-shadow-lg">Danh sách tập</h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowOverlay(false); }} 
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all border border-white/20"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {servers.length > 1 && (
              <div className="flex gap-2 mb-6 bg-white/5 p-1.5 rounded-2xl w-max border border-white/10" onClick={e => e.stopPropagation()}>
                {servers.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveServer(i)}
                    className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-widest transition-colors ${activeServer === i ? 'bg-primary text-white shadow-md' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                  >
                    {s.server_name?.replace(/vietsub|thuyết minh|server/gi, '').trim() || `S${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-hide grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 content-start pb-20">
              {episodes.map((ep, idx) => {
                const isCurrent = ep.slug === currentEpisode;
                return (
                  <button
                    key={ep.slug}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onEpisodeChange(activeServer, ep.slug); 
                      setShowOverlay(false); 
                    }}
                    className={`py-3 px-2 rounded-xl text-sm font-black transition-transform duration-300 border ${
                      isCurrent
                        ? 'bg-primary text-white border-primary shadow-md scale-105 z-10'
                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/15 hover:text-white hover:border-white/30 hover:scale-105'
                    }`}
                  >
                    {ep.name || `${idx + 1}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── Episode Sidebar ────────────────────────────────────────────────── */}
      {showList && episodes.length > 0 && (
        <div className="w-full lg:w-72 xl:w-80 bg-[#0e0f14] border-l border-white/5 flex flex-col shrink-0 max-h-[56.25vw] lg:max-h-none">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
            <div className="flex flex-col gap-1">
              <h3 className="text-white font-black text-sm uppercase tracking-widest">Danh sách tập</h3>
              <p className="text-white/30 text-[11px] font-bold uppercase">{episodes.length} tập</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Server switcher */}
              {servers.length > 1 && (
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                  {servers.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveServer(i)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${activeServer === i ? 'bg-primary text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                    >
                      {s.server_name?.replace(/vietsub|thuyết minh|server/gi, '').trim() || `S${i + 1}`}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setShowList(false)} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Episode Grid */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2">
              {episodes.map((ep, idx) => {
                const isCurrent = ep.slug === currentEpisode;
                return (
                  <button
                    key={ep.slug}
                    onClick={() => onEpisodeChange(activeServer, ep.slug)}
                    className={`py-2.5 px-1 rounded-xl text-xs font-black transition-colors duration-300 border ${
                      isCurrent
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {ep.name || `${idx + 1}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fullscreen Button (Local) */}
          <div className="p-4 border-t border-white/5 shrink-0">
            <button
              onClick={toggleFullscreen}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 font-black text-[11px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
            >
              <ArrowsPointingOutIcon className="w-4 h-4" />
              Xem toàn màn hình
            </button>
          </div>
        </div>
      )}
    </div>
  );

};
