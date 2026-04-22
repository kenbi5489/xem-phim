import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  title: string;
  original_title: string;
  poster_url: string;
  thumb_url: string;
  description: string;
  year?: number;
  quality?: string;
  lang?: string;
  type?: string;        // 'single' | 'series' | 'hoathinh' | 'tvshows'
  is_cinema?: boolean;
  trailer_url?: string;
  rating?: string | number;
  category?: string;    // display string: 'Hành động, Tình cảm'
  country?: string;
  cast?: string;
  director?: string;
  totalEpisodes?: string | number;
  is_streamable: boolean;
  episodes: EpisodeInfo[];          // flat list for navigation
  servers: ServerData[];            // full server data with stream links
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

export const movieApi = {
  getMovies: async (params: MovieListParams): Promise<MovieInfo[]> => {
    const { category, page = 1, country, genre, year, sort, source = 'vnmedia' } = params;
    const res = await api.get<MovieInfo[]>('/movies', {
      params: { category, page, country, genre, year, sort, source },
    });
    return res.data;
  },

  searchMovies: async (keyword: string, page: number = 1, source = 'vnmedia'): Promise<MovieInfo[]> => {
    const res = await api.get<MovieInfo[]>('/movies/search', {
      params: { keyword, page, source },
    });
    return res.data;
  },

  getMovieDetail: async (slug: string, source = 'vnmedia'): Promise<MovieInfo> => {
    const res = await api.get<MovieInfo>(`/movies/${slug}`, { params: { source } });
    return res.data;
  },

  getMovieStream: async (slug: string, episodeSlug: string, source = 'vnmedia'): Promise<StreamInfo> => {
    const res = await api.get<StreamInfo>(`/movies/${slug}/stream/${episodeSlug}`, { params: { source } });
    return res.data;
  },

  getCinemaMovies: async (page: number = 1, source = 'vnmedia'): Promise<MovieInfo[]> => {
    const res = await api.get<MovieInfo[]>('/movies/cinema', { params: { page, source } });
    return res.data;
  },
};
