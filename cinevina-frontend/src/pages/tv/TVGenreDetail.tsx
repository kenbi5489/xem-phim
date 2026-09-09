import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMoviesByGenre } from '../../hooks/useMovies';
import { TVMovieCard } from '../../components/tv/TVMovieCard';

export const TVGenreDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useMoviesByGenre(slug || '', 1);

  const formattedName = slug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-12">
      <h1 className="text-4xl font-bold text-white mb-8">
        {isLoading ? 'Đang tải...' : `Thể Loại: ${formattedName}`}
      </h1>

      {isLoading && <div className="text-2xl text-gray-400">Đang tải danh sách phim...</div>}

      {!isLoading && data && data.items.length > 0 && (
        <div className="flex flex-wrap gap-6 pb-20">
          {data.items.map((movie) => (
            <TVMovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.items.length === 0) && (
        <div className="text-2xl text-gray-400 flex flex-col gap-4">
          <p>Không tìm thấy phim nào trong thể loại này.</p>
          <button 
            data-tv-focusable="true"
            onClick={() => navigate('/tv/genres')} 
            className="self-start px-6 py-3 bg-white text-black font-bold focus:scale-110 rounded-lg focus:ring-4 focus:ring-blue-500"
          >
            Quay Lại
          </button>
        </div>
      )}
    </div>
  );
};
