import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircleIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white dark:bg-[#0B0F19] border-t border-slate-200 dark:border-slate-800/80 mt-auto pb-[calc(env(safe-area-inset-bottom)+70px)] lg:pb-[env(safe-area-inset-bottom)] transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        
        {/* Logo & Tagline */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <PlayCircleIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              CINE<span className="text-indigo-600 dark:text-indigo-400">VINA</span>
            </span>
          </Link>
          <p className="text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed max-w-[360px] font-medium">
            Nền tảng xem phim trực tuyến hiện đại với nguồn phim phong phú từ cộng đồng, tích hợp hệ thống máy chủ Nguồn C & KKPhim với Vietsub, Thuyết minh và Lồng tiếng chuẩn nét.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              <CheckBadgeIcon className="w-4 h-4 text-emerald-500" /> Nguồn C (Phụ đề chuẩn)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
              <CheckBadgeIcon className="w-4 h-4 text-indigo-500" /> KKPhim (HLS Fast)
            </span>
          </div>
        </div>
        
        {/* Khám phá */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-slate-900 dark:text-white text-[15px]">Khám Phá</h4>
          <Link to="/browse/phim-moi-cap-nhat" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Phim mới cập nhật</Link>
          <Link to="/browse/phim-chieu-rap" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Phim chiếu rạp</Link>
          <Link to="/browse/phim-bo" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Phim bộ thịnh hành</Link>
          <Link to="/browse/phim-le" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Phim lẻ chọn lọc</Link>
          <Link to="/browse/hoat-hinh" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Hoạt hình / Anime</Link>
        </div>
        
        {/* Quốc gia */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-slate-900 dark:text-white text-[15px]">Quốc Gia</h4>
          <Link to="/browse/quoc-gia/han-quoc" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Phim Hàn Quốc</Link>
          <Link to="/browse/quoc-gia/trung-quoc" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Phim Trung Quốc</Link>
          <Link to="/browse/quoc-gia/au-my" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Phim Âu Mỹ</Link>
          <Link to="/browse/quoc-gia/nhat-ban" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Phim Nhật Bản</Link>
          <Link to="/browse/quoc-gia/viet-nam" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Phim Việt Nam</Link>
        </div>

        {/* Trợ giúp & Giới thiệu */}
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-slate-900 dark:text-white text-[15px]">Thông Tin</h4>
          <Link to="/search" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Tìm kiếm nâng cao</Link>
          <Link to="/account" className="text-[14px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">Danh sách yêu thích</Link>
          <span className="text-[13px] text-slate-400 dark:text-slate-500 leading-normal">
            Dữ liệu tổng hợp từ các nguồn công khai, phục vụ mục đích phi thương mại.
          </span>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-[13px] text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} CINEVINA — Thiết kế lại giao diện sáng sủa, thông minh & tiện lợi.</p>
        <div className="flex gap-4">
          <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Bảo mật</span>
          <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Điều khoản</span>
          <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">Liên hệ</span>
        </div>
      </div>
    </footer>
  );
};
