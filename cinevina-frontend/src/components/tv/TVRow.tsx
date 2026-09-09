import React from 'react';
import type { MovieInfo } from '../../services/api';
import { TVMovieCard } from './TVMovieCard';

interface TVRowProps {
  title: string;
  movies: MovieInfo[];
}

export const TVRow: React.FC<TVRowProps> = ({ title, movies }) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="mb-8 pl-4">
      <h2 className="text-2xl font-bold text-white mb-2 ml-2">{title}</h2>
      <div className="flex overflow-x-auto pb-8 pt-4 px-2 no-scrollbar scroll-smooth">
        {movies.map((movie) => (
          <TVMovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
};
