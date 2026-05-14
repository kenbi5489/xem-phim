import { useState, useEffect } from 'react';

export interface FavoriteMovie {
  slug: string;
  name: string;
  posterUrl?: string;
  thumbUrl?: string;
  addedAt: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);

  // Load on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cinevina_favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read favorites from localStorage', e);
    }
  }, []);

  // Check if a movie is favorite
  const isFavorite = (slug: string) => favorites.some(m => m.slug === slug);

  // Toggle favorite status
  const toggleFavorite = (movie: Omit<FavoriteMovie, 'addedAt'>) => {
    setFavorites(prev => {
      const exists = prev.some(m => m.slug === movie.slug);
      let nextFavorites;
      if (exists) {
        nextFavorites = prev.filter(m => m.slug !== movie.slug);
      } else {
        nextFavorites = [{ ...movie, addedAt: Date.now() }, ...prev];
      }
      
      try {
        localStorage.setItem('cinevina_favorites', JSON.stringify(nextFavorites));
      } catch (e) {
        console.warn('Could not save favorites to localStorage', e);
      }
      
      return nextFavorites;
    });
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite
  };
}
