import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { MovieInfo } from '../../services/api';

interface TVMovieCardProps {
  movie: MovieInfo;
}

export const TVMovieCard: React.FC<TVMovieCardProps> = ({ movie }) => {
  const navigate = useNavigate();

  return (
    <button
      data-tv-focusable="true"
      onClick={() => navigate(`/tv/phim/${movie.slug}`)}
      className="group relative flex-none w-[200px] h-[300px] rounded-xl overflow-hidden bg-gray-800 transition-transform duration-200 ease-out focus:scale-105 focus:z-10 focus:ring-4 focus:ring-white outline-none mx-2 my-4 transform-gpu will-change-transform"
    >
      <img
        src={movie.posterUrl || movie.thumbUrl}
        alt={movie.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-200 group-focus:opacity-100 will-change-[opacity]" />

      {/* Focus info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 transition-opacity duration-200 group-focus:opacity-100 flex flex-col justify-end will-change-[opacity]">
        <h3 className="text-white font-bold text-lg leading-tight truncate">{movie.name}</h3>
        {movie.year && <span className="text-gray-300 text-sm mt-1">{movie.year}</span>}
      </div>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {movie.quality && (
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider self-start shadow-md">
            {movie.quality}
          </span>
        )}
        {(movie.rating && movie.rating !== 'N/A') && (
          <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded self-start flex items-center gap-1 shadow-md">
            ★ {movie.rating}
          </span>
        )}
      </div>
    </button>
  );
};
