import React from 'react';
import { useNavigate } from 'react-router-dom';

const GENRES = [
  { slug: 'hanh-dong', name: 'Hành Động', color: 'from-red-600 to-orange-600' },
  { slug: 'tinh-cam', name: 'Tình Cảm', color: 'from-pink-500 to-rose-500' },
  { slug: 'hai-huoc', name: 'Hài Hước', color: 'from-yellow-400 to-amber-600' },
  { slug: 'kinh-di', name: 'Kinh Dị', color: 'from-gray-900 to-black' },
  { slug: 'hoat-hinh', name: 'Hoạt Hình', color: 'from-blue-400 to-cyan-500' },
  { slug: 'vien-tuong', name: 'Viễn Tưởng', color: 'from-indigo-600 to-purple-800' },
  { slug: 'phieu-luu', name: 'Phiêu Lưu', color: 'from-emerald-500 to-green-700' },
  { slug: 'tam-ly', name: 'Tâm Lý', color: 'from-violet-500 to-fuchsia-600' },
  { slug: 'the-thao', name: 'Thể Thao', color: 'from-sky-500 to-blue-700' },
  { slug: 'tai-lieu', name: 'Tài Liệu', color: 'from-stone-500 to-neutral-700' },
  { slug: 'co-trang', name: 'Cổ Trang', color: 'from-amber-700 to-yellow-900' },
  { slug: 'chien-tranh', name: 'Chiến Tranh', color: 'from-red-800 to-rose-950' },
];

export const TVGenres: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-12">
      <h1 className="text-5xl font-bold text-white mb-12">Thể Loại</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-20">
        {GENRES.map((genre) => (
          <button
            key={genre.slug}
            data-tv-focusable="true"
            onClick={() => navigate(`/tv/genres/${genre.slug}`)}
            className={`
              relative overflow-hidden rounded-2xl aspect-[4/3] flex items-center justify-center
              bg-gradient-to-br ${genre.color} shadow-lg
              transition-all duration-300 ease-out outline-none
              focus:scale-110 focus:z-10 focus:ring-8 focus:ring-white focus:shadow-[0_0_40px_rgba(255,255,255,0.4)]
              group
            `}
          >
            <div className="absolute inset-0 bg-black/20 group-focus:bg-transparent transition-colors duration-300" />
            <h2 className="relative z-10 text-4xl font-black text-white tracking-wide uppercase drop-shadow-lg text-center p-4">
              {genre.name}
            </h2>
          </button>
        ))}
      </div>
    </div>
  );
};
