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
    <div className="min-h-screen bg-[var(--color-bg-base)] pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[var(--color-border)] pb-6">
          <ShieldCheckIcon className="w-10 h-10 text-[var(--color-primary)]" />
          <div>
            <h1 className="font-heading text-[32px] md:text-[40px] text-[var(--color-text-1)] uppercase tracking-wide">Admin Panel</h1>
            <p className="text-[var(--color-text-3)] text-[14px] mt-1">Quản lý hệ thống và nguồn nội dung</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="flex flex-col gap-2">
            <button className="flex items-center gap-3 p-4 rounded-[12px] bg-[var(--color-primary)]/10 border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-left transition-colors">
              <SignalIcon className="w-5 h-5" />
              Quản lý Nguồn
            </button>
            <button className="flex items-center gap-3 p-4 rounded-[12px] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors text-left border border-transparent">
              <CogIcon className="w-5 h-5" />
              Cấu hình hệ thống
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <div className="bg-[var(--color-bg-surface)] rounded-[24px] p-6 md:p-8 border border-[var(--color-border)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="font-heading text-[24px] text-[var(--color-text-1)] uppercase tracking-wide">Plugin Nguồn Nội Dung</h2>
                <button className="px-4 py-2 rounded-[8px] bg-[var(--color-bg-hover)] hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-1)] text-[13px] font-semibold border border-[var(--color-border)]">
                  Tải lại Registry
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                {SOURCES.map(source => (
                  <div key={source.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[16px] bg-[var(--color-bg-base)] border border-[var(--color-border)] hover:border-[var(--color-text-3)] transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-[16px] text-[var(--color-text-1)]">{source.name}</span>
                      <span className="text-[13px] text-[var(--color-text-3)]">{source.type} • ID: <span className="font-mono text-[var(--color-text-2)]">{source.id}</span></span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1.5 rounded-[6px] text-[11px] font-bold uppercase tracking-wider ${source.status === 'active' ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20' : 'bg-red-900/20 text-red-400 border border-red-900/30'}`}>
                        {source.status}
                      </span>
                      <button className="p-2 rounded-[8px] bg-[var(--color-bg-hover)] hover:bg-[var(--color-primary)] hover:text-white transition-colors text-[var(--color-text-2)] border border-[var(--color-border)] hover:border-[var(--color-primary)]">
                        <CogIcon className="w-5 h-5" />
                      </button>
                      
                      {/* Toggle Switch */}
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${source.status === 'active' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-bg-hover)]'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${source.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
