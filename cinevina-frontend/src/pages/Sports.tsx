import React, { useState, useRef, useEffect } from 'react';
import { SignalIcon, MagnifyingGlassIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import Hls from 'hls.js';
import axios from 'axios';
import { useLiveChannels, type LiveChannel } from '../hooks/useMovies';

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
        ? 'border-[#ff922b]/40 bg-[#ff922b]/10 shadow-[0_0_20px_rgba(255,146,43,0.15)]'
        : 'border-white/8 bg-[#11131a] hover:bg-[#1d1f27] hover:border-white/15'
    }`}
  >
    <ChannelLogo ch={ch} size="w-10 h-10" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-white text-sm truncate">{ch.name}</span>
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
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: '#ff922b', boxShadow: '0 0 6px rgba(255,146,43,0.8)' }}
      />
    )}
  </button>
);

// ─── HLS Player ───────────────────────────────────────────────────────────────
const LivePlayer: React.FC<{ ch: LiveChannel | null }> = ({ ch }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);
  const [muted, setMuted]       = useState(true);
  const [playing, setPlaying]   = useState(false);
  const [error, setError]       = useState(false);
  const [streamType, setStreamType] = useState<'hls' | 'embed'>('hls');
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [embedUrlBackup, setEmbedUrlBackup] = useState<string>('');

  useEffect(() => {
    if (!ch) return;
    setError(false);
    setPlaying(false);
    setStreamType('hls');
    setResolvedUrl('');
    setEmbedUrlBackup('');

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    let isMounted = true;

    const loadStream = async () => {
      let finalUrl = ch.stream_url;
      let type: 'hls' | 'embed' = 'hls';
      
      if (finalUrl.startsWith('/api/')) {
        try {
          const res = await axios.get(finalUrl);
          if (!isMounted) return;
          if (res.data && res.data.url) {
            finalUrl = res.data.url;
            type = (res.data.type === 'embed') ? 'embed' : 'hls';
            if (res.data.embed_url) {
              setEmbedUrlBackup(res.data.embed_url);
            }
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
      setStreamType(type);
      setResolvedUrl(finalUrl);

      if (type === 'embed') {
        setPlaying(true);
        return;
      }

      // HLS logic requires the video ref after re-render
      setTimeout(() => {
        if (!isMounted) return;
        const video = videoRef.current;
        if (!video) {
          setError(true);
          return;
        }

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
      }, 50);
    };

    loadStream();

    return () => {
      isMounted = false;
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [ch?.id]);

  if (!ch) {
    return (
      <div className="aspect-video rounded-2xl bg-[#11131a] border border-white/8 flex flex-col items-center justify-center gap-4 text-white/25">
        <TrophyIcon className="w-20 h-20" />
        <p className="font-display text-lg">Chọn kênh thể thao để xem trực tiếp</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-black">
        {streamType === 'embed' ? (
          <iframe
            src={resolvedUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={ch.name}
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            muted={muted}
            playsInline
            autoPlay
          />
        )}

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

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <SignalIcon className="w-16 h-16 text-white/30" />
            <p className="text-white/60 font-display text-lg">Không thể kết nối kênh này</p>
            <p className="text-white/30 text-xs">Stream URL có thể cần xác thực từ nhà mạng</p>
          </div>
        )}

        {playing && streamType === 'hls' && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={() => {
                setMuted(m => !m);
                if (videoRef.current) videoRef.current.muted = !muted;
              }}
              className="p-2 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
            >
              {muted
                ? <SpeakerXMarkIcon className="w-4 h-4" />
                : <SpeakerWaveIcon  className="w-4 h-4" />
              }
            </button>
          </div>
        )}

        {playing && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/90 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </div>
        )}
      </div>

      <div className="bg-[#11131a] rounded-2xl p-4 border border-white/8">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
          <div className="flex items-center gap-3">
            <ChannelLogo ch={ch} size="w-12 h-12" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-red-400 bg-red-900/20 px-2 py-0.5 rounded uppercase">Đang phát</span>
                <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded uppercase">{ch.network_label}</span>
                {ch.is_hd && <span className="text-[10px] text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded uppercase">HD</span>}
              </div>
              <h2 className="font-display text-lg font-bold text-white">{ch.program_now}</h2>
              <p className="text-white/40 text-sm mt-0.5">
                Tiếp theo: <span className="text-white/60">{ch.program_next}</span>
              </p>
            </div>
          </div>
          
          {(embedUrlBackup || streamType === 'embed') && (
            <div className="flex items-center gap-2 bg-white/2 p-1.5 rounded-2xl border border-white/5 w-full sm:w-auto justify-center sm:justify-start">
              <span className="text-white/30 text-xs font-bold uppercase tracking-wider px-2">Luồng:</span>
              <button
                onClick={() => {
                  setStreamType('hls');
                  setPlaying(false);
                  setError(false);
                  setTimeout(() => {
                    const video = videoRef.current;
                    if (video && Hls.isSupported()) {
                      if (hlsRef.current) hlsRef.current.destroy();
                      const hls = new Hls({ maxBufferLength: 30, lowLatencyMode: true });
                      hlsRef.current = hls;
                      hls.loadSource(resolvedUrl);
                      hls.attachMedia(video);
                      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(()=>{}); setPlaying(true); });
                      hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) setError(true); });
                    }
                  }, 100);
                }}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold uppercase transition-all ${streamType === 'hls' ? 'bg-red-600 text-white shadow' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                HLS (Nhanh)
              </button>
              <button
                onClick={() => {
                  setStreamType('embed');
                  setPlaying(true);
                  setError(false);
                  if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
                }}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold uppercase transition-all ${streamType === 'embed' ? 'bg-red-600 text-white shadow' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                Iframe (100%)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Sports: React.FC = () => {
  const [activeNetwork, setActiveNetwork] = useState<string | undefined>(undefined);
  const [activeGroup,   setActiveGroup]   = useState<string | undefined>(undefined);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [search,        setSearch]        = useState('');

  // Fetch only sports channels
  const channelsQ  = useLiveChannels('sport', activeGroup, activeNetwork);

  const allChannels  = channelsQ.data || [];
  const filtered     = search.trim().length > 0
    ? allChannels.filter(ch =>
        ch.name.toLowerCase().includes(search.toLowerCase()) ||
        ch.program_now.toLowerCase().includes(search.toLowerCase())
      )
    : allChannels;

  const selectedCh = allChannels.find(c => c.id === selectedId) ?? null;

  // Group channels by sport type
  const groupedChannels = filtered.reduce<Record<string, LiveChannel[]>>((acc, ch) => {
    const label = ch.group_label || 'Khác';
    if (!acc[label]) acc[label] = [];
    acc[label].push(ch);
    return acc;
  }, {});

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  useEffect(() => {
    if (!selectedId && allChannels.length > 0) {
      setSelectedId(allChannels[0].id);
    }
  }, [allChannels.length]);

  return (
    <div className="max-w-[1500px] mx-auto px-4 md:px-8 pt-24 pb-24 md:pb-12 flex flex-col gap-6">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <TrophyIcon className="w-10 h-10 text-[#ff922b]" />
          <h1 className="font-display text-3xl md:text-4xl font-black text-white">Thể Thao</h1>
          <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider">
            LIVE {timeStr}
          </span>
        </div>
        {channelsQ.data && (
          <span className="text-white/30 text-sm">{channelsQ.data.length} kênh</span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => { setActiveNetwork(undefined); setActiveGroup(undefined); setSelectedId(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all border ${
            !activeNetwork && !activeGroup
              ? 'text-white border-[#ff922b]/40 bg-[#ff922b]/15 shadow-[0_0_15px_rgba(255,146,43,0.2)]'
              : 'border-white/8 bg-[#11131a] text-white/50 hover:text-white hover:bg-[#1d1f27]'
          }`}
        >
          <TrophyIcon className="w-3.5 h-3.5" />
          Tất cả
        </button>

        {[
          { id: 'bong-da',   label: '⚽ Bóng đá' },
          { id: 'bong-ro',   label: '🏀 Bóng rổ' },
          { id: 'tennis',    label: '🎾 Quần vợt' },
          { id: 'golf',      label: '⛳ Golf' },
          { id: 'dua-xe',    label: '🏎️ Đua xe' },
          { id: 'vo-thuat',  label: '🥊 Võ thuật' },
          { id: 'tong-hop',  label: '🏆 Tổng hợp' },
        ].map(g => {
          const active = activeGroup === g.id;
          return (
            <button
              key={g.id}
              onClick={() => { setActiveGroup(active ? undefined : g.id); setActiveNetwork(undefined); setSelectedId(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all border ${
                active
                  ? 'bg-[#ff922b]/15 border-[#ff922b]/40 text-white'
                  : 'border-white/8 bg-[#11131a] text-white/50 hover:text-white hover:bg-[#1d1f27]'
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kênh, giải đấu..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#11131a] border border-white/8 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#ff922b]/40 transition-colors"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <LivePlayer ch={selectedCh} />
        </div>

        <div className="lg:w-80 xl:w-96 flex flex-col gap-2 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-1">
          {channelsQ.isLoading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#1d1f27] animate-pulse" />
          ))}

          {channelsQ.error && (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-white/40">
              <SignalIcon className="w-10 h-10" />
              <p>Không thể tải danh sách kênh.</p>
              <button
                onClick={() => channelsQ.refetch()}
                className="px-4 py-2 rounded-lg bg-[#ff922b]/15 text-[#ff922b] text-sm font-semibold"
              >
                Thử lại
              </button>
            </div>
          )}

          {!channelsQ.isLoading && !channelsQ.error && (
            <>
              {filtered.length === 0 && (
                <p className="text-white/30 text-sm text-center py-10">
                  Không tìm thấy sự kiện nào
                </p>
              )}
              {Object.entries(groupedChannels).map(([label, items]) => (
                <div key={label} className="flex flex-col gap-2 mb-6">
                  <h3 className="text-white font-display font-black text-sm px-1 py-1 flex items-center gap-2 border-b border-white/5 pb-2">
                    <span>{items[0]?.emoji || '🏆'}</span> {label}
                    <span className="text-white/35 text-xs font-normal">({items.length})</span>
                  </h3>
                  {items.map(ch => (
                    <ChannelCard
                      key={ch.id}
                      ch={ch}
                      selected={selectedId === ch.id}
                      onClick={() => setSelectedId(selectedId === ch.id ? null : ch.id)}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
