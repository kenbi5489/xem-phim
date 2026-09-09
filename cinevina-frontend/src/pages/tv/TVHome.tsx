import React from 'react';
import { useLatestMovies, useMovies, useCinemaMovies } from '../../hooks/useMovies';
import { TVRow } from '../../components/tv/TVRow';
import { useNavigate } from 'react-router-dom';

export const TVHome: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: latestMovies } = useLatestMovies(10);
  const { data: cinemaMovies } = useCinemaMovies(1);
  const { data: series } = useMovies({ category: 'phim-bo', page: 1 });
  const { data: anime } = useMovies({ category: 'hoat-hinh', page: 1 });

  // Use the first latest movie for the hero banner
  const heroMovie = latestMovies?.[0];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner */}
      {heroMovie && (
        <div className="relative w-full h-[60vh] flex-shrink-0">
          <div className="absolute inset-0">
            <img 
              src={heroMovie.posterUrl || heroMovie.thumbUrl} 
              alt={heroMovie.name} 
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-16 left-12 max-w-2xl">
            <h1 className="text-4xl font-bold text-white mb-4 line-clamp-2">{heroMovie.name}</h1>
            <div 
              className="text-base text-gray-300 mb-8 line-clamp-3"
              dangerouslySetInnerHTML={{ __html: heroMovie.description }}
            />
            
            <div className="flex gap-4">
              <button
                data-tv-focusable="true"
                onClick={() => navigate(`/tv/play/${heroMovie.slug}`)}
                className="px-6 py-2.5 bg-white text-black text-lg font-bold rounded-lg focus:scale-110 focus:ring-4 focus:ring-blue-500 transition-all origin-left"
              >
                ▶ Phát
              </button>
              <button
                data-tv-focusable="true"
                onClick={() => navigate(`/tv/phim/${heroMovie.slug}`)}
                className="px-6 py-2.5 bg-gray-500/50 text-white text-lg font-bold rounded-lg focus:scale-110 focus:ring-4 focus:ring-blue-500 transition-all origin-left"
              >
                ℹ Chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rows */}
      <div className="flex-1 -mt-8 relative z-10 pb-16">
        <TVRow title="Phim Mới Cập Nhật" movies={latestMovies?.slice(1) || []} />
        <TVRow title="Phim Chiếu Rạp" movies={cinemaMovies?.items || []} />
        <TVRow title="Phim Bộ Mới Nhất" movies={series?.items || []} />
        <TVRow title="Phim Hoạt Hình" movies={anime?.items || []} />
      </div>
    </div>
  );
};
