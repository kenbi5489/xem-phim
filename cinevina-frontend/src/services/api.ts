import axios from 'axios';

// ─── Environment Configuration ───────────────────────────────────────────────
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api'; // Default to local proxy
  
  if (envUrl.startsWith('http')) {
    const sanitized = envUrl.replace(/\/$/, '');
    return sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`;
  }
  return envUrl;
};

const BASE_URL = getBaseUrl();

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
  categories?: string;
  country?: string;
  cast?: string;
  director?: string;
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
      // If episodeSlug is specified, match it; otherwise take the first available
      if (episodeSlug && ep.slug !== episodeSlug) continue;
      if (ep.link_m3u8) return { type: 'hls', url: ep.link_m3u8 };
      if (ep.link_embed) return { type: 'embed', url: ep.link_embed };
    }
  }
  return null;
};

/**
 * Determine the accurate stream status based on server data (for detail pages).
 * More accurate than is_streamable flag from listing.
 */
export const computeIsStreamable = (movie: MovieInfo): boolean => {
  if (!movie.servers || movie.servers.length === 0) return false;
  return movie.servers.some(s =>
    (s.server_data || []).some(ep => ep.link_m3u8 || ep.link_embed)
  );
};

// ─── API Client ───────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Robust normalization for paginated response
const normalizePaginated = (data: any): PaginatedMovieResponse => {
  const items = adaptMovies(data);
  
  // If it was already a paginated object, preserve the metadata
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return {
      items,
      total: data.total ?? items.length,
      page: data.page ?? 1,
      limit: data.limit ?? 24,
      total_pages: data.total_pages ?? 1,
    };
  }

  // Otherwise default metadata
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
      console.debug(`[API] getMovies(${category}) response type:`, Array.isArray(res.data) ? 'Array' : typeof res.data);
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
      console.error(`[API] getCinemaMovies error:`, err);
      throw err;
    }
  },
  
  getTrendingMovies: async (limit: number = 10, source = 'kkphim'): Promise<MovieInfo[]> => {
    try {
      const res = await api.get('/movies/trending', { params: { limit, source } });
      return adaptMovies(res.data);
    } catch (err) {
      console.error(`[API] getTrendingMovies error:`, err);
      return [];
    }
  },
};
