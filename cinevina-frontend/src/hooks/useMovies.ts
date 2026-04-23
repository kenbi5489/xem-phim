import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { movieApi, type MovieListParams } from '../services/api';

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
      const res = await movieApi.getMovies(params);
      return res.items;
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!(params.category || params.country || params.genre || params.year || params.source),
  });

// ─── Browse By Country/Genre ──────────────────────────────────────────────────
export const useMoviesByCountry = (slug: string, page = 1, filters?: any) =>
  useQuery({
    queryKey: ['movies', 'country', slug, page, filters],
    queryFn: () => movieApi.getMoviesByCountry(slug, page, filters),
    staleTime: 1000 * 60 * 30,
    enabled: !!slug,
  });

export const useMoviesByGenre = (slug: string, page = 1, filters?: any) =>
  useQuery({
    queryKey: ['movies', 'genre', slug, page, filters],
    queryFn: () => movieApi.getMoviesByGenre(slug, page, filters),
    staleTime: 1000 * 60 * 30,
    enabled: !!slug,
  });

// ─── Search ───────────────────────────────────────────────────────────────────
export const useSearchMovies = (keyword: string, page = 1) =>
  useQuery({
    queryKey: ['movies', 'search', keyword, page],
    queryFn: () => movieApi.searchMovies(keyword, page),
    enabled: keyword.trim().length >= 2,
    staleTime: 1000 * 60 * 10,
  });

// ─── Movie Detail ─────────────────────────────────────────────────────────────
// Always fetches from /api/movies/{slug} — never uses cached listing data.
// Uses adaptMovieDetail which reads servers[] with full stream links.
export const useMovieDetail = (slug: string, source?: string) =>
  useQuery({
    queryKey: ['movie-detail', slug, source],  // separate cache key from listing
    queryFn: () => movieApi.getMovieDetail(slug, source),
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
      const res = await movieApi.getCinemaMovies(page);
      return res.items;
    },
    staleTime: 1000 * 60 * 30,
  });

// ─── Trending Movies ──────────────────────────────────────────────────────────
export const useTrendingMovies = (limit = 10) =>
  useQuery({
    queryKey: ['movies', 'trending', limit],
    queryFn: async () => {
      const res = await movieApi.getTrendingMovies(limit);
      return res;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

