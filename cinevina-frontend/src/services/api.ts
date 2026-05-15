import axios from 'axios';

// ─── Environment Configuration ───────────────────────────────────────────────
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '/api'
      : 'https://cinevina-backend.vercel.app/api';
  }

  if (envUrl.startsWith('http')) {
    const sanitized = envUrl.replace(/\/$/, '');
    return sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`;
  }
  return envUrl;
};

export const BASE_URL = getBaseUrl();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EpisodeData {
  name: string;
  slug: string;
  filename?: string;
  link_m3u8?: string;
  link_embed?: string;
}

export interface ServerData {
  server_name: string;
  server_data: EpisodeData[];
}

export interface EpisodeInfo {
  id: string;
  name: string;
  slug: string;
}

export interface MovieInfo {
  id: string;
  slug: string;
  name: string;
  originalName: string;
  posterUrl: string;
  thumbUrl: string;
  description: string;
  year?: number;
  quality?: string;
  lang?: string;
  type?: string;
  isCinema?: boolean;
  trailerUrl?: string;
  rating?: string | number;
  tmdbId?: string;
  categories?: string;
  country?: string;
  cast?: string;
  director?: string;
  imdbId?: string;
  imdbRating?: string | number;
  duration?: string;
  episodeCurrent?: string;
  totalEpisodes?: string | number;
  isStreamable: boolean;
  episodes: EpisodeInfo[];
  servers: ServerData[];
}

export interface StreamInfo {
  url: string;
  type: string; // 'hls' | 'embed' | 'youtube'
  quality?: string;
  headers?: Record<string, string>;
}

export interface MovieListParams {
  category?: string;
  page?: number;
  country?: string;
  genre?: string;
  year?: string;
  sort?: string;
  source?: string;
}

export interface PaginatedMovieResponse {
  items: MovieInfo[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
import { adaptMovieDetail, adaptMovies } from '../utils/movieAdapter';

/**
 * Get the first playable stream from a MovieInfo's servers.
 * Returns m3u8 first, then embed.
 */
export const getFirstStream = (movie: MovieInfo, episodeSlug?: string): { type: 'hls' | 'embed'; url: string } | null => {
  for (const server of movie.servers || []) {
    for (const ep of server.server_data || []) {
      if (episodeSlug && ep.slug !== episodeSlug) continue;
      if (ep.link_m3u8) return { type: 'hls', url: ep.link_m3u8 };
      if (ep.link_embed) return { type: 'embed', url: ep.link_embed };
    }
  }
  return null;
};

/**
 * Determine the accurate stream status based on server data (for detail pages).
 */
export const computeIsStreamable = (movie: MovieInfo): boolean => {
  if (!movie.servers || movie.servers.length === 0) return false;
  return movie.servers.some(s =>
    (s.server_data || []).some(ep => ep.link_m3u8 || ep.link_embed)
  );
};

// ─── API Client ───────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

const normalizePaginated = (data: any): PaginatedMovieResponse => {
  const items = adaptMovies(data);

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return {
      items,
      total: data.total ?? items.length,
      page: data.page ?? 1,
      limit: data.limit ?? 24,
      total_pages: data.total_pages ?? 1,
    };
  }

  return {
    items,
    total: items.length,
    page: 1,
    limit: items.length || 24,
    total_pages: 1,
  };
};

export const movieApi = {
  getMovies: async (params: MovieListParams): Promise<PaginatedMovieResponse> => {
    try {
      const { category, page = 1, country, genre, year, sort, source = 'kkphim' } = params;
      const res = await api.get('/movies', {
        params: { category, page, country, genre, year, sort, source },
      });
      return normalizePaginated(res.data);
    } catch (err) {
      console.error(`[API] getMovies error for category ${params.category}:`, err);
      throw err;
    }
  },

  getMoviesByCountry: async (countrySlug: string, page = 1, filters?: { genre?: string; year?: string; sort?: string }, source = 'kkphim'): Promise<PaginatedMovieResponse> => {
    try {
      const res = await api.get(`/movies/by-country/${countrySlug}`, {
        params: { page, ...filters, source },
      });
      return normalizePaginated(res.data);
    } catch (err) {
      console.error(`[API] getMoviesByCountry error for ${countrySlug}:`, err);
      throw err;
    }
  },

  getMoviesByGenre: async (genreSlug: string, page = 1, filters?: { country?: string; year?: string; sort?: string }, source = 'kkphim'): Promise<PaginatedMovieResponse> => {
    try {
      const res = await api.get(`/movies/by-genre/${genreSlug}`, {
        params: { page, ...filters, source },
      });
      return normalizePaginated(res.data);
    } catch (err) {
      console.error(`[API] getMoviesByGenre error for ${genreSlug}:`, err);
      throw err;
    }
  },

  searchMovies: async (keyword: string, page: number = 1, source = 'kkphim'): Promise<MovieInfo[]> => {
    try {
      const res = await api.get('/movies/search', {
        params: { keyword, page, source },
      });
      return adaptMovies(res.data);
    } catch (err) {
      console.error(`[API] searchMovies error for keyword "${keyword}":`, err);
      return [];
    }
  },

  getMovieDetail: async (slug: string, source = 'kkphim'): Promise<MovieInfo> => {
    try {
      const res = await api.get<any>(`/movies/${slug}`, { params: { source } });
      return adaptMovieDetail(res.data);
    } catch (err) {
      console.error(`[API] getMovieDetail error for ${slug}:`, err);
      throw err;
    }
  },

  getMovieStream: async (slug: string, episodeSlug: string, source = 'kkphim'): Promise<StreamInfo> => {
    try {
      const res = await api.get<StreamInfo>(`/movies/${slug}/stream/${episodeSlug}`, { params: { source } });
      return res.data;
    } catch (err) {
      console.error(`[API] getMovieStream error for ${slug}/${episodeSlug}:`, err);
      throw err;
    }
  },

  getCinemaMovies: async (page: number = 1, source = 'kkphim'): Promise<PaginatedMovieResponse> => {
    try {
      const res = await api.get('/movies/cinema', { params: { page, source } });
      return normalizePaginated(res.data);
    } catch (err) {
      console.warn(`[API] getCinemaMovies failed, falling back to category:`, err);
      return movieApi.getMovies({ category: 'phim-chieu-rap', page, source });
    }
  },

  /**
   * Lấy phim mới cập nhật gần nhất.
   * NOTE: Backend /movies/trending thực chất trả phim-moi-cap-nhat
   * (sorted by modified.time), không phải ranking popularity thật.
   * Đặt tên getLatestMovies() để phản ánh đúng nguồn dữ liệu.
   */
  getLatestMovies: async (limit: number = 10, source = 'kkphim'): Promise<MovieInfo[]> => {
    try {
      const res = await api.get('/movies/trending', { params: { limit, source } });
      return adaptMovies(res.data);
    } catch (err) {
      console.warn(`[API] getLatestMovies failed, falling back to recent list:`, err);
      try {
        const fallback = await movieApi.getMovies({ category: 'phim-moi-cap-nhat', page: 1, source });
        return fallback.items.slice(0, limit);
      } catch (innerErr) {
        return [];
      }
    }
  },
};
