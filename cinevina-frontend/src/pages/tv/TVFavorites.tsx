import React from 'react';
import { useFavorites } from '../../hooks/useFavorites';
import { TVMovieCard } from '../../components/tv/TVMovieCard';
import type { MovieInfo } from '../../services/api';

export const TVFavorites: React.FC = () => {
  const { favorites } = useFavorites();

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-12">
      <h1 className="text-4xl font-bold text-white mb-8">Phim Yêu Thích</h1>
      
      {favorites.length > 0 ? (
        <div className="flex flex-wrap gap-6">
          {favorites.map((fav) => (
            <TVMovieCard 
              key={fav.slug} 
              movie={fav as unknown as MovieInfo} // casting since we only need slug, name, posterUrl
            />
          ))}
        </div>
      ) : (
        <div className="text-2xl text-gray-400">Bạn chưa lưu phim nào.</div>
      )}
    </div>
  );
};
