import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieDetail } from '../../hooks/useMovies';

export const TVMovieDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: movie, isLoading } = useMovieDetail(slug || '');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-2xl text-white">Không tìm thấy phim</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0f0f0f]">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={movie.posterUrl || movie.thumbUrl} 
          alt={movie.name} 
          className="w-full h-[70vh] object-cover object-top opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
      </div>

      <div className="relative z-10 p-12 flex flex-col min-h-screen pt-24">
        <div className="flex gap-12">
          {/* Poster */}
          <div className="w-[300px] shrink-0">
            <img 
              src={movie.thumbUrl || movie.posterUrl} 
              alt={movie.name} 
              className="w-full rounded-xl shadow-2xl border-4 border-white/10"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-4 max-w-4xl">
            <h1 className="text-4xl font-bold">{movie.name}</h1>
            {movie.originalName && movie.originalName !== movie.name && (
              <h2 className="text-xl text-gray-400">{movie.originalName}</h2>
            )}

            <div className="flex items-center gap-4 text-lg">
              {movie.year && <span>{movie.year}</span>}
              {movie.quality && (
                <span className="px-2 py-1 bg-red-600 rounded text-xs font-bold uppercase">{movie.quality}</span>
              )}
              {movie.duration && <span>{movie.duration}</span>}
            </div>

            <div 
              data-tv-focusable="true"
              className="text-lg text-gray-300 leading-relaxed max-h-56 overflow-y-auto pr-4 focus:ring-4 focus:ring-blue-500 rounded-lg p-2 custom-scrollbar"
              dangerouslySetInnerHTML={{ __html: movie.description }}
            />

            {/* Play Button - Just plays first episode */}
            <div className="mt-2">
              <button
                data-tv-focusable="true"
                onClick={() => navigate(`/tv/play/${movie.slug}`)}
                className="px-8 py-3 bg-white text-black text-xl font-bold rounded-lg focus:scale-110 focus:ring-4 focus:ring-blue-500 transition-all origin-left flex items-center gap-3"
              >
                ▶ Xem Phim
              </button>
            </div>
          </div>
        </div>

        {/* Episodes List */}
        {movie.episodes && movie.episodes.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-4 text-white">Danh Sách Tập Phim</h3>
            <div className="flex flex-wrap gap-3">
              {movie.episodes.map((ep) => (
                <button
                  key={ep.slug}
                  data-tv-focusable="true"
                  onClick={() => navigate(`/tv/play/${movie.slug}/${ep.slug}`)}
                  className="px-5 py-3 bg-gray-800 rounded-lg text-lg font-medium focus:bg-white focus:text-black focus:scale-110 transition-all"
                >
                  {ep.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
