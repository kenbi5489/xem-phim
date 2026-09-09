import React from 'react';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Carousel } from '../components/ui/Carousel';
import { MovieCard } from '../components/ui/MovieCard';
import { useFavorites } from '../hooks/useFavorites';
import { Button } from '../components/ui/Button';

export const Account: React.FC = () => {
  const { favorites } = useFavorites();

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] pt-24 pb-16 px-4 md:px-8 flex flex-col gap-12">
      <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-12">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-elevated)] p-8 md:p-10 rounded-[24px] border border-[var(--color-border-subtle)] shadow-xl">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center border border-[var(--color-primary)]/30 shadow-[0_0_30px_rgba(139,92,246,0.15)] relative">
            <UserCircleIcon className="w-16 h-16 md:w-20 md:h-20 text-[var(--color-primary)]" />
            <div className="absolute -bottom-2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-3 py-1 rounded-full border-2 border-[var(--color-surface)]">VIP</div>
          </div>
          <div className="flex flex-col items-center md:items-start gap-2 flex-1">
            <h1 className="font-heading text-[32px] md:text-[40px] text-[var(--color-text-primary)] tracking-wide uppercase drop-shadow-md">Người Dùng VIP</h1>
            <p className="text-[var(--color-primary)] text-[16px] font-semibold bg-[var(--color-primary)]/10 px-4 py-1.5 rounded-full inline-block">Gói Premium (Còn 120 ngày)</p>
            <p className="text-[var(--color-text-muted)] text-[14px] mt-1">user@duccine.com</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" className="flex items-center justify-center gap-2 border-[var(--color-border-strong)] hover:bg-[var(--color-surface-elevated)]">
              <Cog6ToothIcon className="w-5 h-5" />
              Cài đặt
            </Button>
            <Button variant="secondary" className="flex items-center justify-center gap-2 !border-[var(--color-live)]/30 !text-[var(--color-live)] hover:!bg-[var(--color-live)]/10">
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Đăng xuất
            </Button>
          </div>
        </div>

        {/* Continue Watching */}
        <div>
          <Carousel title="Tiếp Tục Xem">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative w-[280px] group cursor-pointer">
                <div className="relative aspect-video rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border-subtle)]">
                  <img src={`https://picsum.photos/seed/watch${i}/400/225`} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" alt="Continue watching" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 w-full h-1 bg-[var(--color-surface-elevated)]">
                    <div className="h-full bg-[var(--color-primary)]" style={{ width: `${Math.random() * 80 + 10}%` }}></div>
                  </div>
                </div>
                <h3 className="mt-3 font-semibold text-[14px] text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">Tập {i + 5}: Phim Đang Xem</h3>
              </div>
            ))}
          </Carousel>
        </div>

        {/* Favorites */}
        <div>
          <Carousel title="Danh Sách Yêu Thích">
            {favorites.length > 0 ? (
              favorites.map((m) => (
                <MovieCard key={m.slug} slug={m.slug} name={m.name} posterUrl={m.posterUrl} thumbUrl={m.thumbUrl} className="w-[160px] md:w-[200px] shrink-0" />
              ))
            ) : (
              <div className="text-[var(--color-text-muted)] text-[14px] px-2 py-8 bg-[var(--color-surface)] rounded-[var(--radius-card)] border border-[var(--color-border-subtle)] text-center w-full">
                Chưa có phim yêu thích nào. Hãy khám phá và lưu phim vào danh sách nhé!
              </div>
            )}
          </Carousel>
        </div>
      </div>
    </div>
  );
};
