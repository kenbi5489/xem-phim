import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, MagnifyingGlassIcon, FilmIcon, TvIcon, HeartIcon, Cog6ToothIcon, RectangleGroupIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const NAV_ITEMS = [
  { path: '/tv', name: 'Trang chủ', icon: HomeIcon },
  { path: '/tv/search', name: 'Tìm kiếm', icon: MagnifyingGlassIcon },
  { path: '/tv/genres', name: 'Thể loại', icon: RectangleGroupIcon },
  { path: '/tv/countries', name: 'Quốc gia', icon: GlobeAltIcon },
  { path: '/tv/movies', name: 'Phim lẻ', icon: FilmIcon },
  { path: '/tv/series', name: 'Phim bộ', icon: TvIcon },
  { path: '/tv/favorites', name: 'Yêu thích', icon: HeartIcon },
  { path: '/tv/settings', name: 'Cài đặt', icon: Cog6ToothIcon },
];

export const TVSidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className={clsx(
        "fixed left-0 top-0 bottom-0 z-50 flex flex-col justify-center bg-[#0f0f0f] border-r border-white/5 shadow-2xl transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-20"
      )}
      onFocus={() => setIsExpanded(true)}
      onBlur={(e) => {
        // Only collapse if focus actually leaves the sidebar
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsExpanded(false);
        }
      }}
    >
      <div className="flex flex-col gap-6 p-4">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            data-tv-focusable="true"
            onClick={() => navigate(item.path)}
            className="group relative flex items-center gap-4 rounded-xl p-3 text-white/70 outline-none transition-all focus:bg-white/10 focus:text-white focus:ring-4 focus:ring-white focus:scale-110 origin-left"
          >
            <item.icon className="h-8 w-8 shrink-0 transition-transform group-focus:scale-110" />
            <span
              className={clsx(
                "whitespace-nowrap text-xl font-medium transition-all duration-300",
                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none absolute left-14"
              )}
            >
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
