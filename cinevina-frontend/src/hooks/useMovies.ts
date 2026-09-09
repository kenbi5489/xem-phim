import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { movieApi, type MovieListParams, BASE_URL } from '../services/api';
import axios from 'axios';

const API_BASE = BASE_URL;

const STALE_30M = 1000 * 60 * 30;
const STALE_1H  = 1000 * 60 * 60;
const GC_1H     = 1000 * 60 * 60;

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
      return res;
    },
    staleTime: STALE_30M,
    gcTime: GC_1H,
    enabled: !!(params.category || params.country || params.genre || params.year || params.source)
      || (!params.country && !params.genre && !params.year),
  });

// ─── Browse By Country/Genre ──────────────────────────────────────────────────
export const useMoviesByCountry = (slug: string, page = 1, filters?: any) =>
  useQuery({
    queryKey: ['movies', 'country', slug, page, filters],
    queryFn: () => movieApi.getMoviesByCountry(slug, page, filters),
    staleTime: STALE_30M,
    gcTime: GC_1H,
    enabled: !!slug,
  });

export const useMoviesByGenre = (slug: string, page = 1, filters?: any) =>
  useQuery({
    queryKey: ['movies', 'genre', slug, page, filters],
    queryFn: () => movieApi.getMoviesByGenre(slug, page, filters),
    staleTime: STALE_30M,
    gcTime: GC_1H,
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
export const useMovieDetail = (slug: string, source?: string) =>
  useQuery({
    queryKey: ['movie-detail', slug, source],
    queryFn: () => movieApi.getMovieDetail(slug, source),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });

export const useSeriesDetail = (seriesId: string) =>
  useQuery({
    queryKey: ['series-detail', seriesId],
    queryFn: () => movieApi.getSeriesDetail(seriesId),
    enabled: !!seriesId,
    staleTime: 1000 * 60 * 10,
    retry: 1,
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
      return res;
    },
    staleTime: STALE_30M,
    gcTime: GC_1H,
  });

// ─── Latest Movies ────────────────────────────────────────────────────────────
// Đổi tên từ useTrendingMovies → useLatestMovies để phản ánh đúng nguồn dữ liệu.
// Backend /movies/trending thực chất trả phim-moi-cap-nhat (modified.time DESC),
// không phải ranking popularity thật.
export const useLatestMovies = (limit = 10) =>
  useQuery({
    queryKey: ['movies', 'latest', limit],
    queryFn: async () => {
      const res = await movieApi.getLatestMovies(limit);
      return res;
    },
    staleTime: STALE_1H,
    gcTime: GC_1H,
  });

// ─── Live TV Channels ─────────────────────────────────────────────────────────
export interface LiveChannel {
  id: string;
  name: string;
  network: string;
  network_label: string;
  group: string;
  group_label: string;
  emoji: string;
  is_hd: boolean;
  logo_url: string;
  program_now: string;
  program_next: string;
  stream_url: string;
  color: string;
}

export const useLiveChannels = (type?: string, group?: string, network?: string) =>
  useQuery({
    queryKey: ['live', 'channels', type, group, network],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (type)    params.type    = type;
      if (group)   params.group   = group;
      if (network) params.network = network;
      const res = await axios.get(`${API_BASE}/live/channels`, { params });
      return res.data as LiveChannel[];
    },
    staleTime: 10 * 1000,
    gcTime: 1 * 60 * 1000,
  });

export interface LiveNetwork {
  id: string;
  label: string;
  color: string;
  count: number;
}

export const useLiveNetworks = () =>
  useQuery({
    queryKey: ['live', 'networks'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/live/networks`);
      return res.data as LiveNetwork[];
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
