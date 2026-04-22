import React from 'react';
import { ShieldCheckIcon, SignalIcon, CogIcon } from '@heroicons/react/24/outline';

const SOURCES = [
  { id: 'vnmedia', name: 'VN Media (PhimAPI)', status: 'active', type: 'Primary Movie Source' },
  { id: 'vietmediaf', name: 'VietMediaF (Fshare API)', status: 'inactive', type: 'Backup Movie Source' },
  { id: 'sport_live', name: 'Sport Live (kodi.ddns.vn)', status: 'inactive', type: 'Live TV Source' },
  { id: 'anime', name: 'Anime (AnimeHay/Viesub)', status: 'inactive', type: 'Anime Source' },
  { id: 'phim_video', name: 'Phim Video (Extended)', status: 'inactive', type: 'Extended Source' },
];

export const Admin: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-8">
      <div className="flex items-center gap-4 border-b ghost-border border-t-0 border-l-0 border-r-0 pb-6">
        <ShieldCheckIcon className="w-10 h-10 text-[var(--color-primary)]" />
        <div>
          <h1 className="font-display text-4xl font-bold">Admin Panel</h1>
          <p className="text-[var(--color-on-surface-variant)]">Quản lý hệ thống và nguồn nội dung</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-container-high)] border border-[var(--color-primary)]/30 text-[var(--color-primary)] font-semibold text-left">
            <SignalIcon className="w-5 h-5" />
            Source Manager
          </button>
          <button className="flex items-center gap-3 p-4 rounded-xl hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] transition-colors text-left ghost-border border-transparent">
            <CogIcon className="w-5 h-5" />
            Cấu hình hệ thống
          </button>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3 flex flex-col gap-6">
          <div className="bg-[var(--color-surface-container-low)] rounded-3xl p-8 ghost-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-semibold">Plugin Nguồn Nội Dung</h2>
              <button className="px-4 py-2 rounded-xl bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] transition-colors ghost-border text-sm font-semibold">
                Tải lại Registry
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {SOURCES.map(source => (
                <div key={source.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--color-surface-container-highest)] ghost-border border-transparent hover:border-[var(--color-outline-variant)]/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-lg">{source.name}</span>
                    <span className="text-sm text-[var(--color-on-surface-variant)]">{source.type} • ID: {source.id}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${source.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {source.status}
                    </span>
                    <button className="p-2 rounded-xl bg-[var(--color-surface-container-high)] hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)] transition-colors ghost-border">
                      <CogIcon className="w-5 h-5" />
                    </button>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-[var(--color-surface-container-low)] ghost-border cursor-pointer">
                      <span className={`inline-block h-4 w-4 transform rounded-full transition ${source.status === 'active' ? 'translate-x-6 bg-[var(--color-primary)]' : 'translate-x-1 bg-[var(--color-outline-variant)]'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
