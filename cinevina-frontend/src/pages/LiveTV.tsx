import React, { useState, useRef, useEffect } from 'react';
import { SignalIcon, MagnifyingGlassIcon, TvIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import Hls from 'hls.js';
import axios from 'axios';
import { useLiveChannels, useLiveNetworks, type LiveChannel } from '../hooks/useMovies';


// ─── Channel Logo ─────────────────────────────────────────────────────────────
const ChannelLogo: React.FC<{ ch: LiveChannel; size?: string }> = ({ ch, size = 'w-12 h-12' }) => {
  const [imgFailed, setImgFailed] = useState(false);
  if (ch.logo_url && !imgFailed) {
    return (
      <img
        src={ch.logo_url}
        alt={ch.name}
        className={`${size} object-contain drop-shadow`}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-xl flex items-center justify-center text-2xl shrink-0`}
      style={{ background: `${ch.color}25` }}
    >
      {ch.emoji}
    </div>
  );
};

// ─── Channel Card ─────────────────────────────────────────────────────────────
const ChannelCard: React.FC<{
  ch: LiveChannel;
  selected: boolean;
  onClick: () => void;
}> = ({ ch, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-2xl border text-left w-full transition-all duration-200 ${
      selected
        ? 'border-primary/40 bg-primary/10 shadow-[0_0_20px_rgba(175,37,254,0.15)] ring-1 ring-primary/20'
        : 'border-white/8 bg-[#11131a] hover:bg-[#1d1f27] hover:border-white/15'
    }`}
  >
    <ChannelLogo ch={ch} size="w-10 h-10" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-white text-sm truncate uppercase">{ch.name}</span>
        {ch.is_hd && (
          <span className="text-[8px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 py-0.5 rounded uppercase shrink-0">
            HD
          </span>
        )}
        <span className="flex items-center gap-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase shrink-0">
          <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> LIVE
        </span>
      </div>
      <p className="text-xs text-white/45 truncate mt-0.5">{ch.program_now}</p>
    </div>
    {selected && (
      <div
        className="w-2 h-2 rounded-full shrink-0 bg-primary shadow-[0_0_6px_rgba(175,37,254,0.8)]"
      />
    )}
  </button>
);

// ─── HLS Player ───────────────────────────────────────────────────────────────
const LivePlayer: React.FC<{ ch: LiveChannel | null }> = ({ ch }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);
  const [muted, setMuted]       = useState(true);  // Start muted to allow autoplay
  const [playing, setPlaying]   = useState(false);
  const [error, setError]       = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const playerWrapperRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
    const el = playerWrapperRef.current;
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
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    if (!ch || !videoRef.current) return;
    setError(false);
    setPlaying(false);

    // Destroy old instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const video = videoRef.current;
    let isMounted = true;

    const loadStream = async () => {
      let finalUrl = ch.stream_url;
      if (finalUrl.startsWith('/api/')) {
        try {
          const res = await axios.get(finalUrl);
          if (!isMounted) return;
          if (res.data && res.data.url) {
            finalUrl = res.data.url;
          } else {
            setError(true);
            return;
          }
        } catch (err) {
          if (isMounted) setError(true);
          return;
        }
      }

      if (!isMounted) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(finalUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isMounted) {
            video.play().catch(() => {});
            setPlaying(true);
          }
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal && isMounted) setError(true);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = finalUrl;
        const onLoaded = () => {
          if (isMounted) {
            video.play().catch(() => {});
            setPlaying(true);
          }
        };
        const onErr = () => { if (isMounted) setError(true); };

        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('error', onErr);
      } else {
        if (isMounted) setError(true);
      }
    };

    loadStream();

    return () => {
      isMounted = false;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [ch?.id]);

  if (!ch) {
    return (
      <div className="aspect-video rounded-[24px] bg-[#11131a] border border-white/8 flex flex-col items-center justify-center gap-4 text-white/25">
        <TvIcon className="w-20 h-20" />
        <p className="font-display text-lg uppercase tracking-widest italic">Chọn kênh để trải nghiệm</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Video / Poster */}
      <div ref={playerWrapperRef} className={`relative w-full aspect-video rounded-[24px] overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-black ${fullscreen ? 'fixed !inset-0 !z-[99999] !w-screen !h-[100dvh] !rounded-none' : ''}`}>

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          muted={muted}
          playsInline
          autoPlay
        />

        {/* Placeholder overlay before play */}
        {!playing && !error && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: `linear-gradient(135deg, ${ch.color}20, ${ch.color}05)` }}
          >
            <ChannelLogo ch={ch} size="w-20 h-20" />
            <span className="font-display font-black text-3xl text-white">{ch.name}</span>
            <div className="flex items-center gap-2 bg-red-600/90 text-white text-sm font-black px-5 py-2 rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> ĐANG KẾT NỐI...
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <SignalIcon className="w-16 h-16 text-white/30" />
            <p className="text-white/60 font-display text-lg">Không thể kết nối kênh này</p>
            <p className="text-white/30 text-xs">Vui lòng thử lại sau hoặc chọn kênh khác</p>
          </div>
        )}

        {/* Controls overlay */}
        {playing && (
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => {
                setMuted(m => !m);
                if (videoRef.current) videoRef.current.muted = !muted;
              }}
              className="w-10 h-10 rounded-full bg-black/50 border border-white/10 text-white hover:bg-primary transition-all flex items-center justify-center shadow-lg group backdrop-blur-sm"
            >
              {muted
                ? <SpeakerXMarkIcon className="w-4 h-4" />
                : <SpeakerWaveIcon  className="w-4 h-4 group-hover:scale-110 transition-transform" />
              }
            </button>
            <button
              onClick={toggleFullScreen}
              className="w-10 h-10 rounded-full bg-black/50 border border-white/10 text-white hover:bg-primary transition-all flex items-center justify-center shadow-lg group backdrop-blur-sm"
              title="Toàn màn hình"
            >
              <ArrowsPointingOutIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const LiveTV: React.FC = () => {
  const [activeNetwork, setActiveNetwork] = useState<string | undefined>(undefined);
  const [activeGroup,   setActiveGroup]   = useState<string | undefined>(undefined);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [search,        setSearch]        = useState('');

  const networksQ  = useLiveNetworks();
  const channelsQ  = useLiveChannels('live', activeGroup, activeNetwork);

  const allChannels  = channelsQ.data || [];
  const filtered     = search.trim().length > 0
    ? allChannels.filter(ch =>
        ch.name.toLowerCase().includes(search.toLowerCase()) ||
        ch.program_now.toLowerCase().includes(search.toLowerCase())
      )
    : allChannels;

  const selectedCh = allChannels.find(c => c.id === selectedId) ?? null;

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Auto-select first channel when data loads
  useEffect(() => {
    if (!selectedId && allChannels.length > 0) {
      setSelectedId(allChannels[0].id);
    }
  }, [allChannels.length]);

  const networks = networksQ.data || [];

  return (
    <div className="min-h-screen bg-background pt-32 pb-24 px-6 md:px-12 flex flex-col gap-8">
      <div className="max-w-[1500px] mx-auto w-full flex flex-col gap-10">

        {/* ── Header */}
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-5">
            <div className="w-4 h-4 rounded-full bg-red-600 animate-ping shadow-[0_0_20px_rgba(220,38,38,0.8)]" />
            <h1 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic text-gradient-primary">Truyền Hình</h1>
            <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-red-600 text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl border border-white/10">
              <span className="w-2 h-2 rounded-full bg-white" /> LIVE {timeStr}
            </div>
          </div>
          {channelsQ.data && (
            <span className="text-white/40 text-sm font-black uppercase tracking-[0.3em]">{channelsQ.data.length} Kênh Đang Phát</span>
          )}
        </div>

        {/* ── Network filter tabs */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {/* Tất cả */}
          <button
            onClick={() => { setActiveNetwork(undefined); setActiveGroup(undefined); setSelectedId(null); }}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shrink-0 transition-all border duration-500 ${
              !activeNetwork && !activeGroup
                ? 'text-white border-primary/40 bg-primary/20 shadow-[0_0_20px_rgba(175,37,254,0.3)] ring-1 ring-primary/20'
                : 'border-white/5 bg-surface-container text-white/40 hover:text-white hover:bg-surface-container-high'
            }`}
          >
            <TvIcon className="w-5 h-5" />
            Tất cả
          </button>

          {/* Networks from API */}
          {networks.map(net => {
            const active = activeNetwork === net.id;
            return (
              <button
                key={net.id}
                onClick={() => { setActiveNetwork(active ? undefined : net.id); setActiveGroup(undefined); setSelectedId(null); }}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shrink-0 transition-all border duration-500 ${
                  active
                    ? 'text-white border-white/20 shadow-2xl ring-1 ring-white/10'
                    : 'border-white/5 bg-surface-container text-white/40 hover:text-white hover:bg-surface-container-high'
                }`}
                style={active ? { background: `${net.color}40`, borderColor: `${net.color}60` } : {}}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0 shadow-lg"
                  style={{ background: net.color }}
                />
                {net.label}
                <span className="text-[10px] text-white/30 ml-1">({net.count})</span>
              </button>
            );
          })}

          {/* Group tabs */}
          {[
            { id: 'phim-truyen', label: '🎬 Phim truyện' },
            { id: 'bong-da',    label: '⚽ Bóng đá' },
            { id: 'tin-tuc',    label: '📰 Tin tức' },
            { id: 'thieu-nhi',  label: '🧒 Thiếu nhi' },
            { id: 'quoc-te',    label: '🌍 Quốc tế' },
          ].map(g => {
            const active = activeGroup === g.id;
            return (
              <button
                key={g.id}
                onClick={() => { setActiveGroup(active ? undefined : g.id); setActiveNetwork(undefined); setSelectedId(null); }}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shrink-0 transition-all border duration-500 ${
                  active
                    ? 'bg-primary/20 border-primary/40 text-white shadow-[0_0_20px_rgba(175,37,254,0.3)] ring-1 ring-primary/20'
                    : 'border-white/5 bg-surface-container text-white/40 hover:text-white hover:bg-surface-container-high'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* ── Search bar */}
        <div className="relative max-w-md group">
          <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm kênh truyền hình..."
            className="w-full pl-14 pr-6 py-4 bg-surface-container border border-white/5 rounded-[24px] text-sm font-bold text-white placeholder-white/20 focus:outline-none focus:border-primary/40 focus:bg-surface-container-high transition-all"
          />
        </div>

        {/* ── Main layout */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Player */}
          <div className="flex-1 min-w-0">
            <LivePlayer ch={selectedCh} />
          </div>

          {/* Channel list */}
          <div className="lg:w-80 xl:w-96 flex flex-col gap-2 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-1">

            {/* Loading skeleton */}
            {channelsQ.isLoading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#1d1f27] animate-pulse" />
            ))}

            {/* Error */}
            {channelsQ.error && (
              <div className="flex flex-col items-center gap-3 py-10 text-center text-white/40">
                <SignalIcon className="w-10 h-10" />
                <p>Không thể tải danh sách kênh.</p>
                <button
                  onClick={() => channelsQ.refetch()}
                  className="px-4 py-2 rounded-lg bg-primary/15 text-primary text-sm font-semibold"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Channel list */}
            {!channelsQ.isLoading && !channelsQ.error && (
              <>
                <div className="flex items-center justify-between px-2 mb-2">
                   <p className="text-white/30 text-[11px] font-black uppercase tracking-[0.2em]">
                    {filtered.length} KÊNH PHÙ HỢP
                  </p>
                </div>
                {filtered.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-10">
                    Không tìm thấy kênh
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  {filtered.map(ch => (
                    <ChannelCard
                      key={ch.id}
                      ch={ch}
                      selected={selectedId === ch.id}
                      onClick={() => setSelectedId(selectedId === ch.id ? null : ch.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

