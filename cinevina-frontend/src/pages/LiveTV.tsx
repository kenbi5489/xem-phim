import React, { useState, useRef, useEffect } from 'react';
import { SignalIcon, MagnifyingGlassIcon, TvIcon } from '@heroicons/react/24/outline';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import Hls from 'hls.js';
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
    className={`flex items-center gap-4 p-4 rounded-[24px] border text-left w-full transition-all duration-500 ${
      selected
        ? 'border-primary/40 bg-primary/10 shadow-[0_0_30px_rgba(175,37,254,0.15)] ring-1 ring-primary/20 scale-[1.02]'
        : 'border-white/5 bg-surface-container hover:bg-surface-container-high hover:border-white/10 hover:scale-[1.01]'
    }`}
  >
    <div className="relative">
       <ChannelLogo ch={ch} size="w-12 h-12" />
       {selected && <div className="absolute -inset-1 bg-primary/20 blur-lg rounded-full -z-10 animate-pulse" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-display font-black text-white text-[15px] truncate uppercase tracking-tight">{ch.name}</span>
        {ch.is_hd && (
          <span className="text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase shrink-0">
            4K
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 animate-pulse">
           LIVE
        </span>
        <p className="text-[12px] font-bold text-white/40 truncate italic">{ch.program_now}</p>
      </div>
    </div>
    {selected && (
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0 bg-primary shadow-[0_0_10px_rgba(175,37,254,0.8)]"
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

  useEffect(() => {
    if (!ch || !videoRef.current) return;
    setError(false);
    setPlaying(false);

    // Destroy old instance
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const video = videoRef.current;
    const url   = ch.stream_url;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setPlaying(true);
      });
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setError(true);
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
        setPlaying(true);
      });
      video.addEventListener('error', () => setError(true));
    } else {
      setError(true);
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [ch?.id]);

  if (!ch) {
    return (
      <div className="aspect-video rounded-[40px] bg-surface-container border border-white/5 flex flex-col items-center justify-center gap-6 text-white/20 glass-premium">
        <TvIcon className="w-24 h-24 opacity-20" />
        <p className="font-display text-2xl font-black uppercase tracking-widest italic">Chọn kênh để trải nghiệm</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Video / Poster */}
      <div className="relative w-full aspect-video rounded-[40px] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-black movie-card-glow">
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
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
            style={{ background: `linear-gradient(135deg, ${ch.color}30, ${ch.color}10)` }}
          >
            <div className="relative">
              <ChannelLogo ch={ch} size="w-24 h-24" />
              <div className="absolute -inset-4 bg-white/20 blur-2xl rounded-full animate-pulse" />
            </div>
            <span className="font-display font-black text-4xl text-white uppercase italic tracking-tighter drop-shadow-2xl">{ch.name}</span>
            <div className="flex items-center gap-3 bg-red-600 text-white text-[13px] font-black px-8 py-3 rounded-full uppercase tracking-[0.2em] shadow-2xl animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white" /> ĐANG KẾT NỐI...
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 backdrop-blur-md">
            <SignalIcon className="w-20 h-20 text-white/20 animate-pulse" />
            <p className="text-white font-display text-2xl font-black uppercase italic">Mất tín hiệu</p>
            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Vui lòng thử lại sau hoặc chọn kênh khác</p>
          </div>
        )}

        {/* Controls overlay */}
        {playing && (
          <div className="absolute bottom-6 right-6 flex gap-3">
            <button
              onClick={() => {
                setMuted(m => !m);
                if (videoRef.current) videoRef.current.muted = !muted;
              }}
              className="w-12 h-12 rounded-full glass-premium border border-white/10 text-white hover:bg-primary transition-all flex items-center justify-center shadow-2xl group"
            >
              {muted
                ? <SpeakerXMarkIcon className="w-5 h-5" />
                : <SpeakerWaveIcon  className="w-5 h-5 group-hover:scale-110 transition-transform" />
              }
            </button>
          </div>
        )}

        {/* LIVE badge */}
        {playing && (
          <div className="absolute top-6 left-6 flex items-center gap-2.5 bg-red-600/90 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase backdrop-blur-md shadow-2xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
          </div>
        )}
      </div>

      {/* Now playing card */}
      <div className="glass-premium rounded-[40px] p-8 border border-white/5 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 p-12 opacity-[0.05] scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-[2000ms]">
          <TvIcon className="w-48 h-48 text-primary" />
        </div>
        <div className="flex items-start justify-between gap-6 relative">
          <div className="flex items-center gap-6">
            <ChannelLogo ch={ch} size="w-16 h-16" />
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-[11px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Đang phát trực tiếp</span>
                <span className="text-[11px] font-black text-white/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full uppercase tracking-widest">{ch.network_label}</span>
                {ch.is_hd && <span className="text-[11px] font-black text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-full uppercase tracking-widest">4K ULTRA HD</span>}
              </div>
              <h2 className="font-display text-3xl font-black text-white uppercase italic text-gradient-primary">{ch.program_now}</h2>
              <p className="text-white/40 text-sm font-bold mt-2 uppercase tracking-wider flex items-center gap-2">
                Tiếp theo: <span className="text-white/70 italic">{ch.program_next}</span>
              </p>
            </div>
          </div>
        </div>
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
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr,450px] gap-12">

          {/* Player */}
          <div className="min-w-0">
            <LivePlayer ch={selectedCh} />
          </div>

          {/* Channel list */}
          <div className="flex flex-col gap-4 lg:max-h-[calc(100vh-250px)] lg:overflow-y-auto pr-3 scrollbar-hide">

            {/* Loading skeleton */}
            {channelsQ.isLoading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-[24px] bg-surface-container-highest animate-pulse" />
            ))}

            {/* Error */}
            {channelsQ.error && (
              <div className="flex flex-col items-center gap-6 py-20 text-center glass-premium rounded-[40px]">
                <SignalIcon className="w-16 h-16 text-white/10 animate-pulse" />
                <div className="flex flex-col gap-2">
                   <p className="text-xl font-black text-white uppercase italic">Mất kết nối máy chủ</p>
                   <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">Không thể tải danh sách kênh</p>
                </div>
                <button
                  onClick={() => channelsQ.refetch()}
                  className="btn-vibrant"
                >
                  THỬ LẠI NGAY
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
                  <div className="py-20 flex flex-col items-center gap-4 glass-premium rounded-[40px] opacity-40">
                     <span className="text-4xl">📺</span>
                     <p className="text-sm font-black text-white uppercase tracking-widest italic text-center">Không tìm thấy kênh</p>
                  </div>
                )}
                <div className="flex flex-col gap-4">
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

