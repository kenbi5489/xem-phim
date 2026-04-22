import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { movieApi, type MovieListParams } from '../services/api';
import { adaptMovies, adaptMovieCard, adaptMovieDetail } from '../utils/movieAdapter';

// ─── Debounce Hook ────────────────────────────────────────────────────────────
export const useDebounce = <T>(value: T, delay = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

// ─── Movie List (listings, browse, home) ─────────────────────────────────────
export const useMovies = (params: MovieListParams) =>
  useQuery({
    queryKey: ['movies', params],
    queryFn: async () => {
      const raw = await movieApi.getMovies(params);
      // Use card adapter for listing (lighter, no stream links)
      return Array.isArray(raw) ? raw.map(adaptMovieCard) : [];
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!(params.category || params.country || params.genre || params.year || params.source),
  });

// ─── Search ───────────────────────────────────────────────────────────────────
export const useSearchMovies = (keyword: string, page = 1) =>
  useQuery({
    queryKey: ['movies', 'search', keyword, page],
    queryFn: async () => {
      const raw = await movieApi.searchMovies(keyword, page);
      return Array.isArray(raw) ? raw.map(adaptMovieCard) : [];
    },
    enabled: keyword.trim().length >= 2,
    staleTime: 1000 * 60 * 10,
  });

// ─── Movie Detail ─────────────────────────────────────────────────────────────
// Always fetches from /api/movies/{slug} — never uses cached listing data.
// Uses adaptMovieDetail which reads servers[] with full stream links.
export const useMovieDetail = (slug: string, source?: string) =>
  useQuery({
    queryKey: ['movie-detail', slug, source],  // separate cache key from listing
    queryFn: async () => {
      const raw = await movieApi.getMovieDetail(slug, source);
      return adaptMovieDetail(raw);
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,  // 10 min — shorter to get fresh stream links
    retry: 2,
  });

// ─── Stream URL ───────────────────────────────────────────────────────────────
export const useMovieStream = (slug: string, episodeSlug: string, source?: string) =>
  useQuery({
    queryKey: ['stream', slug, episodeSlug, source],
    queryFn: () => movieApi.getMovieStream(slug, episodeSlug, source),
    enabled: !!slug && !!episodeSlug,
    staleTime: 1000 * 60 * 60 * 4,
    retry: 1,
  });

// ─── Cinema Movies ────────────────────────────────────────────────────────────
export const useCinemaMovies = (page = 1) =>
  useQuery({
    queryKey: ['movies', 'cinema', page],
    queryFn: async () => {
      const raw = await movieApi.getCinemaMovies(page);
      return Array.isArray(raw) ? raw.map(adaptMovieCard) : [];
    },
    staleTime: 1000 * 60 * 30,
  });
