import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircleIcon } from '@heroicons/react/24/outline';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--color-bg-app)] border-t border-[var(--color-border-subtle)] mt-auto pb-[calc(env(safe-area-inset-bottom)+84px)] lg:pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Logo & Tagline */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
              <PlayCircleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-[20px] tracking-wider font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              CINE<span className="text-[var(--color-primary)]">VINA</span>
            </span>
          </Link>
          <p className="text-[var(--color-text-2)] text-[14px]">
            Nền tảng xem phim trực tuyến chất lượng cao, tối ưu mượt mà cho mọi thiết bị.
          </p>
        </div>
        
        {/* Khám phá */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-[var(--color-text-1)] text-[15px]">Khám phá</h4>
          <Link to="/browse/phim-chieu-rap" className="text-[14px] text-[var(--color-text-2)] hover:text-white transition-colors">Phim chiếu rạp</Link>
          <Link to="/browse/phim-bo" className="text-[14px] text-[var(--color-text-2)] hover:text-white transition-colors">Phim bộ mới</Link>
          <Link to="/browse/phim-le" className="text-[14px] text-[var(--color-text-2)] hover:text-white transition-colors">Phim lẻ hot</Link>
          <Link to="/browse/hoat-hinh" className="text-[14px] text-[var(--color-text-2)] hover:text-white transition-colors">Hoạt hình / Anime</Link>
        </div>
        
        {/* Thể loại */}
        <div className="flex flex-col gap-3">
          <h4 className="font-medium text-[var(--color-text-1)]">Thể loại</h4>
          <Link to="/browse/hoat-hinh" className="text-[14px] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors">Hoạt hình</Link>
          <Link to="/browse/hanh-dong" className="text-[14px] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors">Hành động</Link>
          <Link to="/browse/tinh-cam" className="text-[14px] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors">Tình cảm</Link>
        </div>

        {/* Tài khoản */}
        <div className="flex flex-col gap-3">
          <h4 className="font-medium text-[var(--color-text-1)]">Tài khoản</h4>
          <Link to="/account" className="text-[14px] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors">Hồ sơ cá nhân</Link>
          <Link to="/account" className="text-[14px] text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors">Phim yêu thích</Link>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 border-t border-[var(--color-border-subtle)] flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-[var(--color-text-muted)]">
        <p>&copy; {new Date().getFullYear()} CINEVINA. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="hover:text-[var(--color-text-2)] cursor-pointer transition-colors">Điều khoản</span>
          <span className="hover:text-[var(--color-text-2)] cursor-pointer transition-colors">Bảo mật</span>
        </div>
      </div>
    </footer>
  );
};
