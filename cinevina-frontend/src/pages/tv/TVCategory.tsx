import React from 'react';
import { useMovies } from '../../hooks/useMovies';
import { TVMovieCard } from '../../components/tv/TVMovieCard';
import { useLocation } from 'react-router-dom';

export const TVCategory: React.FC = () => {
  const location = useLocation();
  const isSeries = location.pathname.includes('series');
  const title = isSeries ? 'Phim Bộ' : 'Phim Lẻ';
  const categoryStr = isSeries ? 'phim-bo' : 'phim-le';

  const { data, isLoading } = useMovies({ category: categoryStr, page: 1, source: 'kkphim' });

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-12">
      <h1 className="text-4xl font-bold text-white mb-8">{title}</h1>
      
      {isLoading && <div className="text-2xl text-gray-400">Đang tải danh sách phim...</div>}

      {!isLoading && data && data.items.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {data.items.map((movie) => (
            <TVMovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.items.length === 0) && (
        <div className="text-2xl text-gray-400">Không có dữ liệu.</div>
      )}
    </div>
  );
};
