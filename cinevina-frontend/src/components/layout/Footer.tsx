import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--color-surface-container-low)] mt-auto border-t ghost-border border-b-0 border-l-0 border-r-0">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex flex-col gap-4 max-w-sm">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display font-black text-2xl tracking-tight text-[var(--color-primary)]">
              CINEVINA
            </span>
          </Link>
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            Nền tảng xem phim và giải trí trực tuyến chất lượng cao. Trải nghiệm không gian điện ảnh Neon Auteur đích thực.
          </p>
        </div>
        
        <div className="flex gap-16 text-sm">
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-[var(--color-on-surface)]">Khám phá</h4>
            <Link to="/browse/phim-le" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Phim chiếu rạp</Link>
            <Link to="/browse/phim-bo" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Phim bộ</Link>
            <Link to="/browse/anime" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Anime</Link>
            <Link to="/live" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">TV Show & Live</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-[var(--color-on-surface)]">Tài khoản</h4>
            <Link to="/account" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Hồ sơ</Link>
            <Link to="/settings" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">Cài đặt</Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 border-t ghost-border border-b-0 border-l-0 border-r-0 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[var(--color-on-surface-variant)]">
        <p>&copy; {new Date().getFullYear()} CINEVINA. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Điều khoản</a>
          <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Bảo mật</a>
        </div>
      </div>
    </footer>
  );
};
