import React from 'react';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Carousel } from '../components/ui/Carousel';
import { MovieCard } from '../components/ui/MovieCard';

export const Account: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-12">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-[var(--color-surface-container-low)] p-8 rounded-3xl ghost-border">
        <div className="w-32 h-32 rounded-full bg-[var(--color-surface-container-highest)] flex items-center justify-center glow-primary">
          <UserCircleIcon className="w-20 h-20 text-[var(--color-primary)]" />
        </div>
        <div className="flex flex-col items-center md:items-start gap-2 flex-1">
          <h1 className="font-display text-4xl font-bold">Người Dùng VIP</h1>
          <p className="text-[var(--color-secondary)] font-semibold">Gói Premium (Còn 120 ngày)</p>
          <p className="text-[var(--color-on-surface-variant)] text-sm mt-2">user@cinevina.com</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] transition-colors ghost-border">
            <Cog6ToothIcon className="w-5 h-5" />
            Cài đặt
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors ghost-border border-red-900/30">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Continue Watching */}
      <div>
        <Carousel title="Tiếp Tục Xem">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="relative w-[280px] group cursor-pointer">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-[var(--color-surface-container-low)]">
                <img src={`https://picsum.photos/seed/watch${i}/400/225`} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute bottom-0 w-full h-1 bg-[var(--color-surface-container-highest)]">
                  <div className="h-full bg-[var(--color-primary)]" style={{ width: `${Math.random() * 80 + 10}%` }}></div>
                </div>
              </div>
              <h3 className="mt-2 font-semibold text-sm line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">Tập {i + 5}: Phim Đang Xem</h3>
            </div>
          ))}
        </Carousel>
      </div>

      {/* Favorites */}
      <div>
        <Carousel title="Danh Sách Yêu Thích">
          {Array.from({ length: 8 }).map((_, i) => (
            <MovieCard key={i} name={`Phim Yêu Thích ${i + 1}`} posterUrl={`https://picsum.photos/seed/fav${i}/300/450`} />
          ))}
        </Carousel>
      </div>
    </div>
  );
};
