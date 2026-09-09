import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ListBulletIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ShareIcon,
  FilmIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  PauseIcon,
  BackwardIcon,
  ForwardIcon,
} from '@heroicons/react/24/solid';
import type { ServerData } from '../../services/api';

interface EmbeddedPlayerProps {
  streamUrl: string;
  streamType: 'hls' | 'embed';
  movieSlug: string;
  movieName?: string;
  currentEpisode: string;
  servers: ServerData[];
  onEpisodeChange: (serverIdx: number, episodeSlug: string) => void;
  className?: string;
  onBack?: () => void;
}

export const EmbeddedPlayer: React.FC<EmbeddedPlayerProps> = ({
  streamUrl,
  streamType,
  movieSlug,
  movieName,
  currentEpisode,
  servers,
  onEpisodeChange,
  className = '',
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Playback States
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showList] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [activeServer, setActiveServer] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [isBuffering, setIsBuffering] = useState(false);

  // Menus
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<any[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Scrubber Hover
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPos, setHoverPos] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Non-intrusive feedback (Volume / Share only - NEVER for play/pause to avoid icon overlap)
  const [feedbackMsg, setFeedbackMsg] = useState<{ icon: React.ReactNode; text: string } | null>(null);
  const [resumeToast, setResumeToast] = useState<{ time: number } | null>(null);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [skipEndingVisible, setSkipEndingVisible] = useState(false);

  // Side double-tap ripple animation (Only -10s left / +10s right, no center icon)
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);

  // Mini-player and View modes
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [watchedEps, setWatchedEps] = useState<string[]>([]);
  const [embedKey, setEmbedKey] = useState(0);

  // Refs for timers and touch discrimination
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const skipTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touchStartRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isTouchRef = useRef(false);
  const touchResetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentServer = servers[activeServer];
  const episodes = currentServer?.server_data ?? [];
  const currentIdx = episodes.findIndex((e) => e.slug === currentEpisode);
  const nextEp = currentIdx < episodes.length - 1 ? episodes[currentIdx + 1] : null;

  const showFeedback = (icon: React.ReactNode, text: string) => {
    setFeedbackMsg({ icon, text });
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedbackMsg(null), 800);
  };

  // Load watched history
  useEffect(() => {
    const w = localStorage.getItem(`watched_episodes_${movieSlug}`);
    if (w) {
      try {
        setWatchedEps(JSON.parse(w));
      } catch (e) {}
    }
    localStorage.setItem(`last_watched_ep_${movieSlug}`, currentEpisode);

    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('t');
    if (t && videoRef.current && !isNaN(Number(t))) {
      videoRef.current.currentTime = Number(t);
    }
  }, [movieSlug, currentEpisode]);

  // HLS Stream Initializer
  useEffect(() => {
    if (streamType !== 'hls' || !videoRef.current) return;
    setIsLoading(true);
    setHasError(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setResumeToast(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    const checkResume = () => {
      const savedTime = localStorage.getItem(`resume_${movieSlug}_${currentEpisode}`);
      if (savedTime && Number(savedTime) > 30) {
        setResumeToast({ time: Number(savedTime) });
        setTimeout(() => setResumeToast(null), 8000);
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 60,
        maxMaxBufferLength: 90,
        lowLatencyMode: false,
        enableWorker: true,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        setQualityLevels(data.levels || []);
        setCurrentQuality(hls.currentLevel);
        checkResume();
        video.play().catch(() => {});
        setPlaying(true);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              setIsLoading(false);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        setDuration(video.duration);
        checkResume();
        video.play().catch(() => {});
        setPlaying(true);
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
      });
    } else {
      setHasError(true);
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, streamType, movieSlug, currentEpisode]);

  // Periodic watch progress save
  useEffect(() => {
    const int = setInterval(() => {
      if (playing && currentTime > 0) {
        localStorage.setItem(`resume_${movieSlug}_${currentEpisode}`, currentTime.toString());
      }
    }, 5000);
    return () => clearInterval(int);
  }, [playing, currentTime, movieSlug, currentEpisode]);

  // Watched threshold
  useEffect(() => {
    if (duration > 0 && currentTime > duration * 0.9) {
      if (!watchedEps.includes(currentEpisode)) {
        const n = [...watchedEps, currentEpisode];
        setWatchedEps(n);
        localStorage.setItem(`watched_episodes_${movieSlug}`, JSON.stringify(n));
      }
    }
  }, [currentTime, duration, watchedEps, movieSlug, currentEpisode]);

  // Video listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!isScrubbing) setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }

      if (video.duration > 0 && video.duration - video.currentTime <= 20 && nextEp) {
        setShowNextOverlay(true);
      } else {
        setShowNextOverlay(false);
      }

      if (
        video.duration > 120 &&
        video.currentTime > video.duration - 120 &&
        video.currentTime < video.duration - 20
      ) {
        if (!skipEndingVisible) {
          setSkipEndingVisible(true);
          clearTimeout(skipTimer.current);
          skipTimer.current = setTimeout(() => setSkipEndingVisible(false), 5000);
        }
      } else {
        setSkipEndingVisible(false);
      }
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
    };
  }, [isScrubbing, nextEp, skipEndingVisible]);

  // Auto scroll episode
  useEffect(() => {
    const el = document.getElementById(`ep-${currentEpisode}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentEpisode]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!fullscreen) {
      if (el.requestFullscreen) {
        el.requestFullscreen()
          .then(() => {
            setFullscreen(true);
            try {
              if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
              }
            } catch (e) {}
          })
          .catch(() => setFullscreen(true));
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
        setFullscreen(true);
      } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
        (videoRef.current as any).webkitEnterFullscreen();
      } else {
        setFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setFullscreen(false)).catch(() => setFullscreen(false));
      } else if ((document as any).webkitExitFullscreen) {
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

  // Controls auto-hide: only hides when playing; never auto-hide when paused or scrubbing
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    if (playing && !isScrubbing && !showSpeedMenu && !showQualityMenu) {
      hideTimer.current = setTimeout(() => {
        setControlsVisible(false);
      }, 4000);
    }
  }, [playing, isScrubbing, showSpeedMenu, showQualityMenu]);

  useEffect(() => {
    if (playing) {
      resetHideTimer();
    } else {
      setControlsVisible(true);
      clearTimeout(hideTimer.current);
    }
    return () => clearTimeout(hideTimer.current);
  }, [playing, resetHideTimer]);

  // Clean Play/Pause toggle: updates state directly without generating duplicate overlapping popup icons
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const skipTime = useCallback((amount: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + amount));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  // Set side double tap ripple feedback
  const triggerSideFeedback = useCallback((side: 'left' | 'right') => {
    setDoubleTapSide(side);
    setTimeout(() => {
      setDoubleTapSide((prev) => (prev === side ? null : prev));
    }, 550);
  }, []);

  // ── TOUCH GESTURE SYSTEM (Mobile / Tablet) ──
  // Fully prevents synthetic click double-firing
  const handleTouchStart = (e: React.TouchEvent) => {
    isTouchRef.current = true;
    clearTimeout(touchResetTimer.current);

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        time: Date.now(),
        x: touch.clientX,
        y: touch.clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Keep touch flag active for 400ms to ignore simulated mouse click
    clearTimeout(touchResetTimer.current);
    touchResetTimer.current = setTimeout(() => {
      isTouchRef.current = false;
    }, 400);

    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const duration = Date.now() - touchStartRef.current.time;
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // If movement was small, it is a deliberate tap
    if (deltaX < 12 && deltaY < 12 && duration < 300) {
      const now = Date.now();
      const rect = containerRef.current?.getBoundingClientRect();
      const clickX = touch.clientX - (rect?.left || 0);
      const totalWidth = rect?.width || window.innerWidth;
      const posRatio = clickX / totalWidth;

      // Check double-tap: within 280ms on left (<35%) or right (>65%)
      if (
        lastTapRef.current &&
        now - lastTapRef.current.time < 280 &&
        Math.abs(clickX - lastTapRef.current.x) < 50
      ) {
        // Double Tap confirmed!
        clearTimeout(singleTapTimer.current);
        lastTapRef.current = null;

        if (streamType === 'hls') {
          if (posRatio < 0.35) {
            skipTime(-10);
            triggerSideFeedback('left');
          } else if (posRatio > 0.65) {
            skipTime(10);
            triggerSideFeedback('right');
          } else {
            // Tapping center twice gently toggles play once
            togglePlay();
          }
        }
      } else {
        // First tap: debounce single tap so double-tap can cancel it
        lastTapRef.current = { time: now, x: clickX };
        singleTapTimer.current = setTimeout(() => {
          // Toggle controls once cleanly
          setControlsVisible((prev) => {
            const next = !prev;
            if (next && playing) {
              clearTimeout(hideTimer.current);
              hideTimer.current = setTimeout(() => setControlsVisible(false), 4000);
            }
            return next;
          });
          lastTapRef.current = null;
        }, 220);
      }
    }
    touchStartRef.current = null;
  };

  // ── DESKTOP MOUSE CLICKS ──
  const handleContainerClick = (e: React.MouseEvent) => {
    // If originated from touch, IGNORE to prevent double toggling ("bật tắt")!
    if (isTouchRef.current) return;

    // Check if clicked an interactive button or slider
    if ((e.target as HTMLElement).closest('button, input, select, a, [data-interactive="true"]')) {
      return;
    }

    if (streamType === 'hls' && !isMiniPlayer) {
      setControlsVisible((prev) => {
        const next = !prev;
        if (next && playing) {
          clearTimeout(hideTimer.current);
          hideTimer.current = setTimeout(() => setControlsVisible(false), 4000);
        }
        return next;
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isTouchRef.current) return;
    if (streamType === 'embed') {
      setFitMode((f) => (f === 'contain' ? 'cover' : 'contain'));
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    if (ratio < 0.32) {
      skipTime(-10);
      triggerSideFeedback('left');
    } else if (ratio > 0.68) {
      skipTime(10);
      triggerSideFeedback('right');
    } else {
      toggleFullscreen();
    }
  };

  const handleMouseMove = () => {
    // Ignore synthetic mousemove on mobile devices
    if (isTouchRef.current) return;
    resetHideTimer();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
  };
  const handleSeekStart = () => {
    setIsScrubbing(true);
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
  };
  const handleSeekEnd = () => {
    setIsScrubbing(false);
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
    if (playing) {
      resetHideTimer();
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    if (videoRef.current) videoRef.current.volume = val;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          skipTime(-10);
          triggerSideFeedback('left');
          break;
        case 'arrowright':
          e.preventDefault();
          skipTime(10);
          triggerSideFeedback('right');
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = nv;
            setMuted(nv === 0);
            showFeedback(<SpeakerWaveIcon className="w-8 h-8" />, `${Math.round(nv * 100)}%`);
            return nv;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => {
            const nv = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = nv;
            setMuted(nv === 0);
            showFeedback(<SpeakerWaveIcon className="w-8 h-8" />, `${Math.round(nv * 100)}%`);
            return nv;
          });
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setMuted((m) => {
            const nm = !m;
            if (videoRef.current) videoRef.current.muted = nm;
            showFeedback(
              nm ? <SpeakerXMarkIcon className="w-8 h-8" /> : <SpeakerWaveIcon className="w-8 h-8" />,
              nm ? 'Đã tắt tiếng' : 'Đã bật tiếng'
            );
            return nm;
          });
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, togglePlay, skipTime, triggerSideFeedback]);

  // Mini player on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && playing && !fullscreen) setIsMiniPlayer(true);
        else setIsMiniPlayer(false);
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [playing, fullscreen]);

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('t', Math.floor(currentTime).toString());
    navigator.clipboard.writeText(url.toString());
    showFeedback(<ShareIcon className="w-8 h-8" />, 'Đã sao chép liên kết');
  };

  return (
    <>
      <div
        className={`transition-all duration-500 ease-in-out ${
          cinemaMode
            ? 'fixed inset-0 z-[90] bg-[var(--color-bg-base)]/95 p-2 sm:p-4 lg:p-10 flex justify-center items-center'
            : ''
        }`}
      >
        <div
          className={`flex flex-col lg:flex-row gap-0 rounded-[16px] overflow-hidden shadow-2xl border border-[var(--color-border)] ${
            cinemaMode ? 'w-full max-w-[1600px] h-full max-h-[92vh]' : className
          }`}
        >
          {/* ── Video Area ── */}
          <div
            ref={containerRef}
            className={`relative flex-1 bg-black aspect-video min-w-0 select-none touch-manipulation group/video ${
              fullscreen ? 'fixed !inset-0 !z-[99999] !w-screen !h-[100dvh] !rounded-none' : ''
            } ${
              isMiniPlayer
                ? 'fixed !bottom-6 !right-6 !w-[300px] sm:!w-[340px] !h-[170px] sm:!h-[190px] !z-[9999] shadow-2xl !rounded-[12px] border-2 border-[var(--color-primary)]'
                : ''
            }`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => playing && !isScrubbing && setControlsVisible(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleContainerClick}
            onDoubleClick={handleDoubleClick}
          >
            {/* HLS Video Element */}
            {streamType === 'hls' && (
              <video
                ref={videoRef}
                className={`w-full h-full transition-all duration-300 pointer-events-none ${
                  fitMode === 'contain' ? 'object-contain' : 'object-cover'
                }`}
                muted={muted}
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
              />
            )}

            {/* Embed Iframe Stream */}
            {streamType === 'embed' && (
              <div className="relative w-full h-full">
                <iframe
                  key={embedKey}
                  src={streamUrl}
                  className={`w-full h-full border-none transition-all duration-300 ${
                    fitMode === 'cover' ? 'scale-105' : ''
                  }`}
                  allowFullScreen
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  title={movieName || 'CINEVINA Player'}
                />

                {/* Embed Floating Helper Toolbar (Placed cleanly at top right) */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-[8px] border border-white/10 shadow-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEmbedKey((k) => k + 1);
                    }}
                    className="p-1.5 text-white/80 hover:text-white rounded-[6px] hover:bg-white/10 transition-colors"
                    title="Tải lại player"
                    aria-label="Tải lại player"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFitMode((f) => (f === 'contain' ? 'cover' : 'contain'));
                    }}
                    className="px-2 py-0.5 text-white/90 text-[11px] font-semibold rounded-[6px] bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {fitMode === 'contain' ? 'Phóng to' : 'Vừa khung'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="p-1.5 text-white/80 hover:text-white rounded-[6px] hover:bg-white/10 transition-colors"
                    title="Toàn màn hình"
                    aria-label="Toàn màn hình"
                  >
                    {fullscreen ? <ArrowsPointingInIcon className="w-4 h-4" /> : <ArrowsPointingOutIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Side Double-Tap Ripples (-10s left / +10s right only, NO overlapping center icon) */}
            {doubleTapSide && streamType === 'hls' && (
              <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
                {doubleTapSide === 'left' && (
                  <div className="absolute inset-y-0 left-0 w-1/3 flex items-center justify-center bg-white/10 rounded-r-full animate-pulse transition-opacity">
                    <div className="flex flex-col items-center gap-1 text-white drop-shadow-md">
                      <BackwardIcon className="w-7 h-7 animate-bounce" />
                      <span className="text-[13px] font-bold tracking-wide">-10s</span>
                    </div>
                  </div>
                )}
                {doubleTapSide === 'right' && (
                  <div className="absolute inset-y-0 right-0 w-1/3 flex items-center justify-center bg-white/10 rounded-l-full animate-pulse transition-opacity">
                    <div className="flex flex-col items-center gap-1 text-white drop-shadow-md">
                      <ForwardIcon className="w-7 h-7 animate-bounce" />
                      <span className="text-[13px] font-bold tracking-wide">+10s</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resume Toast */}
            {resumeToast && !isMiniPlayer && (
              <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-bg-surface)]/95 backdrop-blur-md border border-[var(--color-border)] px-4 py-3 sm:px-6 sm:py-4 rounded-[12px] shadow-2xl flex flex-col items-center gap-2.5 max-w-[90%] sm:max-w-md">
                <p className="text-[var(--color-text-1)] text-[12px] sm:text-[14px] font-medium text-center">
                  Bạn đã xem đến <strong className="text-[var(--color-primary)]">{formatTime(resumeToast.time)}</strong>. Tiếp tục chứ?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) videoRef.current.currentTime = resumeToast.time;
                      setResumeToast(null);
                      videoRef.current?.play();
                      setPlaying(true);
                    }}
                    className="px-3.5 py-1.5 bg-[var(--color-primary)] text-white text-[12px] font-bold rounded-[6px] hover:bg-[var(--color-primary-hover)] transition-colors active:scale-95"
                  >
                    Tiếp tục xem
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setResumeToast(null);
                      if (videoRef.current) videoRef.current.currentTime = 0;
                    }}
                    className="px-3.5 py-1.5 bg-[var(--color-bg-hover)] text-[var(--color-text-1)] text-[12px] font-bold rounded-[6px] hover:bg-[var(--color-border)] transition-colors active:scale-95"
                  >
                    Xem từ đầu
                  </button>
                </div>
              </div>
            )}

            {/* Buffering Spinner (Clean, standalone spinner) */}
            {(isBuffering || isLoading) && streamType === 'hls' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-30">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 border-3 border-white/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
                  <span className="text-white/80 text-[12px] font-medium tracking-wide">Đang tải...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#141414] text-white z-40 p-6 text-center">
                <ExclamationTriangleIcon className="w-12 h-12 text-[var(--color-primary)]" />
                <div>
                  <p className="text-[16px] font-bold tracking-wide mb-0.5">Không thể tải luồng phát</p>
                  <p className="text-white/60 text-[12px]">Vui lòng thử chọn server dự phòng hoặc tải lại trang</p>
                </div>
                {servers.length > 1 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {servers.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveServer(idx);
                          setHasError(false);
                          setIsLoading(true);
                        }}
                        className={`px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition-colors ${
                          activeServer === idx
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        Server {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lightweight Feedback Toast (Volume & Share only, never for Play/Pause) */}
            {feedbackMsg && !isMiniPlayer && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-in fade-in duration-150">
                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-[12px] flex items-center text-white gap-2 border border-white/10 shadow-xl">
                  {feedbackMsg.icon}
                  <span className="font-bold text-[13px] tracking-wide">{feedbackMsg.text}</span>
                </div>
              </div>
            )}

            {/* Auto Next Episode Overlay */}
            {showNextOverlay && !isMiniPlayer && nextEp && (
              <div className="absolute bottom-20 right-4 sm:bottom-24 sm:right-8 z-40 bg-[var(--color-bg-surface)]/95 backdrop-blur-md border border-[var(--color-border)] p-4 rounded-[12px] shadow-2xl flex flex-col gap-2.5 max-w-[260px]">
                <p className="text-[var(--color-text-1)] text-[12px] font-medium">
                  Tập tiếp theo sau <strong className="text-[var(--color-primary)]">{Math.max(0, Math.ceil(duration - currentTime))}s</strong>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEpisodeChange(activeServer, nextEp.slug);
                    }}
                    className="flex-1 py-1.5 bg-[var(--color-primary)] text-white text-[12px] font-bold rounded-[6px] hover:bg-[var(--color-primary-hover)] transition-colors active:scale-95"
                  >
                    Xem ngay
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNextOverlay(false);
                    }}
                    className="flex-1 py-1.5 bg-[var(--color-bg-hover)] text-[var(--color-text-1)] text-[12px] font-bold rounded-[6px] hover:bg-[var(--color-border)] transition-colors active:scale-95"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Skip Ending Button */}
            {skipEndingVisible && !showNextOverlay && !isMiniPlayer && nextEp && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEpisodeChange(activeServer, nextEp.slug);
                }}
                className="absolute bottom-20 right-4 sm:bottom-24 sm:right-8 z-40 bg-[var(--color-bg-surface)]/95 hover:bg-[var(--color-bg-hover)] backdrop-blur-md border border-[var(--color-border)] px-4 py-2 rounded-[8px] text-[var(--color-text-1)] text-[12px] font-bold shadow-2xl transition-all active:scale-95"
              >
                Bỏ qua Ending
              </button>
            )}

            {/* Mini Player Close Button */}
            {isMiniPlayer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMiniPlayer(false);
                  const el = document.getElementById('cinevina-player');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center text-white hover:bg-[var(--color-primary)] z-50 transition-colors"
                aria-label="Đóng mini player"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}

            {/* ── Native Controls Overlay (HLS) ── */}
            {streamType === 'hls' && !isMiniPlayer && (
              <div
                className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-200 z-30 pointer-events-none ${
                  controlsVisible ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Top Bar (Single clean bar, no overlapping elements) */}
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/35 to-transparent pointer-events-auto">
                  {onBack && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBack();
                      }}
                      className="p-1.5 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white/90 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Quay lại"
                    >
                      <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )}
                  <div className="flex-1 min-w-0 pr-2">
                    <h2 className="text-white font-heading text-[15px] sm:text-[18px] md:text-[20px] uppercase tracking-wide truncate drop-shadow">
                      {movieName}
                    </h2>
                    {currentEpisode && episodes.length > 1 && (
                      <p className="text-white/70 text-[11px] sm:text-[12px] font-medium truncate">
                        {episodes[currentIdx]?.name || `Tập ${currentIdx + 1}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                      className="p-1.5 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      title="Chia sẻ phim"
                      aria-label="Chia sẻ"
                    >
                      <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFitMode((f) => (f === 'contain' ? 'cover' : 'contain'));
                      }}
                      className="p-1.5 w-8 h-8 sm:w-9 sm:h-9 hidden sm:flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      title="Khung hình"
                      aria-label="Khung hình"
                    >
                      <FilmIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${fitMode === 'cover' ? 'text-[var(--color-primary)]' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Center Play/Pause Cluster (ONLY visible when not loading/buffering to avoid icon collisions) */}
                {controlsVisible && !isLoading && !isBuffering && (
                  <div className="flex items-center justify-center gap-6 sm:gap-8 pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        skipTime(-10);
                        triggerSideFeedback('left');
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/90 hover:text-white border border-white/15 transition-all active:scale-90"
                      aria-label="Lùi 10 giây"
                    >
                      <BackwardIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay();
                      }}
                      className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-[var(--color-primary)]/90 hover:bg-[var(--color-primary)] shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95"
                      aria-label={playing ? 'Tạm dừng' : 'Phát'}
                    >
                      {playing ? (
                        <PauseIcon className="w-7 h-7 sm:w-9 sm:h-9" />
                      ) : (
                        <PlayIcon className="w-7 h-7 sm:w-9 sm:h-9 ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        skipTime(10);
                        triggerSideFeedback('right');
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/90 hover:text-white border border-white/15 transition-all active:scale-90"
                      aria-label="Tới 10 giây"
                    >
                      <ForwardIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                )}

                {/* Bottom Bar Container */}
                <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10 pb-3 px-3 sm:px-5 pointer-events-auto">
                  {/* Progress Scrubber */}
                  <div
                    className="relative mb-2 sm:mb-3 cursor-pointer flex items-center h-7 group/progress touch-none"
                    onClick={(e) => e.stopPropagation()}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                      setHoverPos(pos);
                      setHoverTime(pos * duration);
                      setShowTooltip(true);
                    }}
                    onMouseLeave={() => setShowTooltip(false)}
                  >
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
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      aria-label="Thanh tiến trình"
                    />

                    {/* Background Track */}
                    <div className="relative w-full h-1 sm:h-1.5 rounded-full bg-white/25 overflow-hidden transition-all group-hover/progress:h-2">
                      <div
                        className="absolute inset-y-0 left-0 bg-white/40 transition-all duration-200"
                        style={{ width: `${duration > 0 ? (buffered / duration) * 100 : 0}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--color-primary)] transition-all duration-75"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Dragger Thumb */}
                    <div
                      className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[var(--color-primary)] rounded-full shadow-md pointer-events-none z-10 transition-transform scale-90 group-hover/progress:scale-125 border-2 border-white"
                      style={{
                        left: `calc(${duration > 0 ? (currentTime / duration) * 100 : 0}% - 7px)`,
                      }}
                    />

                    {/* Tooltip */}
                    {showTooltip && controlsVisible && (
                      <div
                        className="absolute bottom-8 -translate-x-1/2 bg-[var(--color-bg-surface)] px-2 py-0.5 rounded-[6px] text-white text-[11px] font-bold pointer-events-none border border-[var(--color-border)] shadow-xl whitespace-nowrap"
                        style={{ left: `${hoverPos * 100}%` }}
                      >
                        {formatTime(hoverTime)}
                      </div>
                    )}
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between gap-1 sm:gap-3">
                    {/* Left Controls */}
                    <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-white hover:text-[var(--color-primary)] rounded-full hover:bg-white/10 transition-colors"
                        aria-label={playing ? 'Tạm dừng' : 'Phát'}
                      >
                        {playing ? <PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          skipTime(-10);
                          triggerSideFeedback('left');
                        }}
                        className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-white/90 hover:text-[var(--color-primary)] rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Lùi 10 giây"
                      >
                        <BackwardIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          skipTime(10);
                          triggerSideFeedback('right');
                        }}
                        className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-white/90 hover:text-[var(--color-primary)] rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Tới 10 giây"
                      >
                        <ForwardIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      {/* Desktop Volume */}
                      <div className="hidden sm:flex items-center group/volume relative ml-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMuted((m) => {
                              const nm = !m;
                              if (videoRef.current) videoRef.current.muted = nm;
                              return nm;
                            });
                          }}
                          className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-white hover:text-[var(--color-primary)] rounded-full hover:bg-white/10 transition-colors"
                          aria-label={muted || volume === 0 ? 'Bật tiếng' : 'Tắt tiếng'}
                        >
                          {muted || volume === 0 ? (
                            <SpeakerXMarkIcon className="w-5 h-5" />
                          ) : (
                            <SpeakerWaveIcon className="w-5 h-5" />
                          )}
                        </button>
                        <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 flex items-center">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={muted ? 0 : volume}
                            onChange={handleVolume}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-1.5 accent-[var(--color-primary)] bg-white/25 rounded-full cursor-pointer ml-1"
                            aria-label="Âm lượng"
                          />
                        </div>
                      </div>

                      {/* Time Readout */}
                      <div className="text-[11px] sm:text-[12px] font-bold text-white/90 whitespace-nowrap ml-1 sm:ml-2">
                        <span className="text-white">{formatTime(currentTime)}</span>
                        <span className="mx-1 text-white/40">/</span>
                        <span className="text-white/70">{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {/* Speed Menu */}
                      <div className="relative" onMouseLeave={() => setShowSpeedMenu(false)}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSpeedMenu((v) => !v);
                            setShowQualityMenu(false);
                          }}
                          className="px-2 py-1 min-w-[34px] h-8 flex items-center justify-center text-white text-[11px] sm:text-[12px] font-bold hover:bg-white/10 rounded-[6px] transition-colors"
                          aria-label="Tốc độ phát"
                        >
                          {playbackSpeed}x
                        </button>
                        {showSpeedMenu && (
                          <div className="absolute bottom-full right-0 mb-2 bg-[#141414]/95 backdrop-blur-md border border-white/10 rounded-[8px] overflow-hidden py-1 min-w-[100px] shadow-2xl z-50">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                              <div
                                key={speed}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPlaybackSpeed(speed);
                                  if (videoRef.current) videoRef.current.playbackRate = speed;
                                  setShowSpeedMenu(false);
                                }}
                                className={`px-3.5 py-1.5 text-[12px] font-medium cursor-pointer transition-colors flex items-center justify-between ${
                                  playbackSpeed === speed
                                    ? 'text-[var(--color-primary)] font-bold'
                                    : 'text-white hover:bg-white/10'
                                }`}
                              >
                                {speed}x {playbackSpeed === speed && <CheckCircleIcon className="w-3.5 h-3.5" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quality Menu */}
                      {qualityLevels.length > 1 && (
                        <div className="relative" onMouseLeave={() => setShowQualityMenu(false)}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowQualityMenu((v) => !v);
                              setShowSpeedMenu(false);
                            }}
                            className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-white hover:text-[var(--color-primary)] rounded-full hover:bg-white/10 transition-colors"
                            aria-label="Chất lượng"
                          >
                            <Cog6ToothIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                          </button>
                          {showQualityMenu && (
                            <div className="absolute bottom-full right-0 mb-2 bg-[#141414]/95 backdrop-blur-md border border-white/10 rounded-[8px] overflow-hidden py-1 min-w-[120px] shadow-2xl z-50">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (hlsRef.current) hlsRef.current.currentLevel = -1;
                                  setCurrentQuality(-1);
                                  setShowQualityMenu(false);
                                }}
                                className={`px-3.5 py-1.5 text-[12px] font-medium cursor-pointer transition-colors flex items-center justify-between ${
                                  currentQuality === -1
                                    ? 'text-[var(--color-primary)] font-bold'
                                    : 'text-white hover:bg-white/10'
                                }`}
                              >
                                Tự động {currentQuality === -1 && <CheckCircleIcon className="w-3.5 h-3.5" />}
                              </div>
                              {qualityLevels.map((lvl, idx) => (
                                <div
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (hlsRef.current) hlsRef.current.currentLevel = idx;
                                    setCurrentQuality(idx);
                                    setShowQualityMenu(false);
                                  }}
                                  className={`px-3.5 py-1.5 text-[12px] font-medium cursor-pointer transition-colors flex items-center justify-between ${
                                    currentQuality === idx
                                      ? 'text-[var(--color-primary)] font-bold'
                                      : 'text-white hover:bg-white/10'
                                  }`}
                                >
                                  {lvl.height}p {currentQuality === idx && <CheckCircleIcon className="w-3.5 h-3.5" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mobile Episode List Button */}
                      {episodes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowOverlay((v) => !v);
                          }}
                          className="p-1.5 min-w-[34px] min-h-[34px] lg:hidden flex items-center justify-center text-white hover:text-[var(--color-primary)] rounded-full hover:bg-white/10 transition-colors"
                          aria-label="Danh sách tập"
                        >
                          <ListBulletIcon className="w-5 h-5" />
                        </button>
                      )}

                      {/* Cinema Mode (Desktop) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCinemaMode((v) => !v);
                        }}
                        className="p-1.5 min-w-[34px] min-h-[34px] hidden lg:flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        title="Chế độ rạp phim"
                        aria-label="Chế độ rạp phim"
                      >
                        <FilmIcon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${cinemaMode ? 'text-[var(--color-primary)]' : ''}`} />
                      </button>

                      {/* Fullscreen Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFullscreen();
                        }}
                        className="p-1.5 min-w-[34px] min-h-[34px] flex items-center justify-center text-white hover:text-[var(--color-primary)] rounded-full hover:bg-white/10 transition-colors"
                        aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
                      >
                        {fullscreen ? (
                          <ArrowsPointingInIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        ) : (
                          <ArrowsPointingOutIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Episode Overlay Drawer (Mobile/Tablet) */}
            {showOverlay && episodes.length > 0 && (
              <div
                className="absolute inset-0 z-50 bg-[var(--color-bg-base)]/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200 pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOverlay(false);
                }}
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--color-border)]">
                  <div>
                    <h3 className="text-[var(--color-text-1)] font-heading text-[18px] sm:text-[20px] uppercase tracking-wide">
                      Danh sách tập
                    </h3>
                    <p className="text-[var(--color-text-3)] text-[12px]">{episodes.length} tập có sẵn</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOverlay(false);
                    }}
                    className="p-2 rounded-full bg-[var(--color-bg-surface)] text-[var(--color-text-1)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)]"
                    aria-label="Đóng danh sách tập"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Server Selector */}
                {servers.length > 1 && (
                  <div
                    className="flex flex-wrap gap-2 mb-4 bg-[var(--color-bg-surface)] p-1.5 rounded-[8px] border border-[var(--color-border)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {servers.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveServer(i)}
                        className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors ${
                          activeServer === i
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        {s.server_name?.replace(/vietsub|thuyết minh|server/gi, '').trim() || `Server ${i + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Episode Grid */}
                <div
                  className="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 content-start pb-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  {episodes.map((ep, idx) => {
                    const isCurrent = ep.slug === currentEpisode;
                    const isWatched = watchedEps.includes(ep.slug);
                    return (
                      <button
                        key={ep.slug}
                        onClick={() => {
                          onEpisodeChange(activeServer, ep.slug);
                          setShowOverlay(false);
                        }}
                        className={`relative py-3 rounded-[8px] text-[13px] font-semibold transition-all border flex justify-center items-center active:scale-95 ${
                          isCurrent
                            ? 'bg-[var(--color-primary)] text-white border-transparent shadow-md'
                            : isWatched
                            ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-3)] border-[var(--color-border)]'
                            : 'bg-[var(--color-bg-surface)] text-[var(--color-text-1)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        <span className="z-10">{ep.name || `${idx + 1}`}</span>
                        {isWatched && !isCurrent && (
                          <CheckCircleIcon className="absolute top-1 right-1 w-3.5 h-3.5 text-[#22c55e]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Episode Sidebar (Desktop) ── */}
          {showList && episodes.length > 0 && (
            <div
              className={`bg-[var(--color-bg-surface)] border-t lg:border-t-0 lg:border-l border-[var(--color-border)] flex flex-col shrink-0 transition-all duration-300 ${
                cinemaMode
                  ? 'w-full lg:w-72 xl:w-80'
                  : 'w-full lg:w-72 xl:w-84 max-h-[260px] sm:max-h-[320px] lg:max-h-none'
              }`}
            >
              <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[var(--color-border)] shrink-0">
                <div className="flex flex-col">
                  <h3 className="text-[var(--color-text-1)] font-heading text-[18px] sm:text-[20px] uppercase">
                    Danh sách tập
                  </h3>
                  <p className="text-[var(--color-text-3)] text-[12px] font-medium">{episodes.length} tập</p>
                </div>

                {servers.length > 1 && (
                  <select
                    className="bg-[var(--color-bg-hover)] text-[var(--color-text-1)] text-[12px] font-medium rounded-[6px] px-2.5 py-1.5 border border-[var(--color-border)] outline-none focus:border-[var(--color-primary)]"
                    value={activeServer}
                    onChange={(e) => setActiveServer(Number(e.target.value))}
                  >
                    {servers.map((s, i) => (
                      <option key={i} value={i} className="bg-[var(--color-bg-surface)]">
                        {s.server_name?.replace(/vietsub|thuyết minh|server/gi, '').trim() || `Server ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-2 sm:gap-2.5">
                  {episodes.map((ep, idx) => {
                    const isCurrent = ep.slug === currentEpisode;
                    const isWatched = watchedEps.includes(ep.slug);
                    return (
                      <button
                        key={ep.slug}
                        id={`ep-${ep.slug}`}
                        onClick={() => onEpisodeChange(activeServer, ep.slug)}
                        className={`relative py-2.5 sm:py-3 rounded-[8px] text-[12px] sm:text-[13px] font-semibold transition-all border flex justify-center items-center active:scale-95 ${
                          isCurrent
                            ? 'bg-[var(--color-primary)] text-white border-transparent shadow-md'
                            : isWatched
                            ? 'bg-[var(--color-bg-base)] text-[var(--color-text-3)] border-[var(--color-border)]'
                            : 'bg-[var(--color-bg-base)] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        <span className="z-10">{ep.name || `${idx + 1}`}</span>
                        {isWatched && !isCurrent && (
                          <CheckCircleIcon className="absolute top-1 right-1 w-3.5 h-3.5 text-[#22c55e]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
