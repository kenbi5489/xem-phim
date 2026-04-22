import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SignalIcon, TvIcon, NewspaperIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LiveChannel {
  id: string;
  name: string;
  group: string;
  group_label: string;
  emoji: string;
  program_now: string;
  program_next: string;
  stream_url: string;
  color: string;
}

// ─── API hook ─────────────────────────────────────────────────────────────────
const useLiveChannels = (group?: string) =>
  useQuery<LiveChannel[]>({
    queryKey: ['live', 'channels', group],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/live/channels`, {
        params: group ? { group } : {},
      });
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: undefined,     label: 'Tất cả',      Icon: TvIcon },
  { id: 'the-thao',   label: 'Thể thao',    Icon: SignalIcon },
  { id: 'bong-da',    label: 'Bóng đá',     Icon: SignalIcon },
  { id: 'truyen-hinh',label: 'Truyền hình', Icon: NewspaperIcon },
] as const;

// ─── Channel Card ─────────────────────────────────────────────────────────────
const ChannelCard: React.FC<{
  ch: LiveChannel;
  selected: boolean;
  onClick: () => void;
}> = ({ ch, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 p-4 rounded-2xl border text-left w-full transition-all ${
      selected
        ? 'border-[#d692ff]/40 bg-[#d692ff]/10'
        : 'border-white/8 bg-[#11131a] hover:bg-[#1d1f27] hover:border-white/15'
    }`}
  >
    {/* Channel icon */}
    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
      style={{ background: `${ch.color}18` }}>
      {ch.emoji}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-white truncate">{ch.name}</span>
        <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
        </span>
      </div>
      <p className="text-sm text-white/50 truncate mt-0.5">{ch.program_now}</p>
    </div>
    {selected && (
      <div className="w-2 h-2 rounded-full shrink-0"
        style={{ background: '#d692ff', boxShadow: '0 0 6px rgba(214,146,255,0.8)' }} />
    )}
  </button>
);

// ─── Player Area ──────────────────────────────────────────────────────────────
const PlayerArea: React.FC<{ ch: LiveChannel | null; onPlay: () => void }> = ({ ch, onPlay }) => {
  if (!ch) {
    return (
      <div className="aspect-video rounded-2xl bg-[#11131a] border border-white/8 flex flex-col items-center justify-center gap-4 text-white/25">
        <SignalIcon className="w-16 h-16" />
        <p className="font-display text-lg">Chọn kênh để xem trực tiếp</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {/* Video placeholder — click to play */}
      <div
        onClick={onPlay}
        className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 cursor-pointer group shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        style={{ background: `linear-gradient(135deg, ${ch.color}20, ${ch.color}05)` }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="text-6xl">{ch.emoji}</span>
          <span className="font-display font-black text-3xl text-white">{ch.name}</span>
          <div className="flex items-center gap-2 bg-red-600/90 text-white text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> ĐANG PHÁT TRỰC TIẾP
          </div>
        </div>
        {/* Hover play button */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/30">
          <div className="w-18 h-18 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: 'rgba(214,146,255,0.9)', boxShadow: '0 0 40px rgba(214,146,255,0.4)' }}>
            <PlayIcon className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      </div>

      {/* Now playing info */}
      <div className="bg-[#11131a] rounded-2xl p-5 border border-white/8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black text-red-400 bg-red-900/20 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                Đang phát
              </span>
              <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-sm uppercase">
                {ch.group_label}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-white">{ch.program_now}</h2>
            <p className="text-white/45 text-sm mt-1">Tiếp theo: <span className="text-white/65">{ch.program_next}</span></p>
          </div>
          <span className="text-3xl shrink-0">{ch.emoji}</span>
        </div>
      </div>

      {/* Stream URL info (dev) */}
      <div className="bg-[#0c0e14] rounded-xl p-3 border border-white/5">
        <p className="text-xs text-white/25 font-mono truncate">
          HLS: {ch.stream_url}
        </p>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const LiveTV: React.FC = () => {
  const [activeGroup, setActiveGroup] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId]   = useState<string | null>(null);

  const { data: channels, isLoading, error, refetch } = useLiveChannels(activeGroup);
  const selectedCh = channels?.find(c => c.id === selectedId) ?? null;

  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-24 md:pb-12 flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <h1 className="font-display text-3xl md:text-4xl font-black text-white">Trực Tiếp</h1>
        </div>
        <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider">
          LIVE {timeStr}
        </span>
      </div>

      {/* Group Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => {
          const active = activeGroup === tab.id;
          return (
            <button key={tab.label} onClick={() => { setActiveGroup(tab.id); setSelectedId(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold shrink-0 transition-all ${
                active ? 'text-[#3a005a] shadow-[0_0_20px_rgba(214,146,255,0.35)]' : 'bg-[#1d1f27] text-white/60 hover:text-white hover:bg-[#23262e]'
              }`}
              style={active ? { background: 'linear-gradient(135deg, #d692ff, #af25fe)' } : {}}>
              <tab.Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Player */}
        <div className="flex-1">
          <PlayerArea ch={selectedCh} onPlay={() => {
            // In production: launch HLS player here
            if (selectedCh) window.open(selectedCh.stream_url, '_blank');
          }} />
        </div>

        {/* Channel List */}
        <div className="lg:w-80 flex flex-col gap-3 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-1">
          {isLoading && (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-[#1d1f27] animate-pulse" />
            ))
          )}
          {error && (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-white/40">
              <p>Không thể tải danh sách kênh.</p>
              <button onClick={() => refetch()}
                className="px-4 py-2 rounded-lg bg-[#d692ff]/15 text-[#d692ff] text-sm font-semibold">
                Thử lại
              </button>
            </div>
          )}
          {!isLoading && !error && channels && (
            <>
              <p className="text-white/30 text-xs font-bold uppercase tracking-wider px-1">
                {channels.length} kênh đang phát
              </p>
              {channels.map(ch => (
                <ChannelCard key={ch.id} ch={ch}
                  selected={selectedId === ch.id}
                  onClick={() => setSelectedId(selectedId === ch.id ? null : ch.id)} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
