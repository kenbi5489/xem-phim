import React from 'react';
import { useNavigate } from 'react-router-dom';

const COUNTRIES = [
  { slug: 'au-my', name: 'Âu Mỹ', color: 'from-blue-600 to-indigo-800' },
  { slug: 'han-quoc', name: 'Hàn Quốc', color: 'from-pink-500 to-rose-600' },
  { slug: 'trung-quoc', name: 'Trung Quốc', color: 'from-red-600 to-orange-700' },
  { slug: 'nhat-ban', name: 'Nhật Bản', color: 'from-fuchsia-500 to-purple-700' },
  { slug: 'thai-lan', name: 'Thái Lan', color: 'from-yellow-500 to-amber-700' },
  { slug: 'viet-nam', name: 'Việt Nam', color: 'from-red-500 to-yellow-600' },
  { slug: 'dai-loan', name: 'Đài Loan', color: 'from-emerald-500 to-teal-700' },
  { slug: 'hong-kong', name: 'Hồng Kông', color: 'from-orange-500 to-red-600' },
  { slug: 'an-do', name: 'Ấn Độ', color: 'from-amber-600 to-orange-800' },
];

export const TVCountries: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-12">
      <h1 className="text-5xl font-bold text-white mb-12">Quốc Gia</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-20">
        {COUNTRIES.map((country) => (
          <button
            key={country.slug}
            data-tv-focusable="true"
            onClick={() => navigate(`/tv/countries/${country.slug}`)}
            className={`
              relative overflow-hidden rounded-2xl aspect-[4/3] flex items-center justify-center
              bg-gradient-to-br ${country.color} shadow-lg
              transition-all duration-300 ease-out outline-none
              focus:scale-110 focus:z-10 focus:ring-8 focus:ring-white focus:shadow-[0_0_40px_rgba(255,255,255,0.4)]
              group
            `}
          >
            <div className="absolute inset-0 bg-black/20 group-focus:bg-transparent transition-colors duration-300" />
            <h2 className="relative z-10 text-4xl font-black text-white tracking-wide uppercase drop-shadow-lg text-center p-4">
              {country.name}
            </h2>
          </button>
        ))}
      </div>
    </div>
  );
};
