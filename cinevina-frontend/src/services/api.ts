import axios from 'axios';

// ─── Environment Configuration ───────────────────────────────────────────────
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    if (envUrl.startsWith('http')) {
      const sanitized = envUrl.replace(/\/$/, '');
      return sanitized.endsWith('/api') ? sanitized : `${sanitized}/api`;
    }
    return envUrl;
  }
  
  if (typeof window === 'undefined') return '/api';
  
  // Local Vite dev server runs on 5173 or 4173
  const isViteDev = window.location.port === '5173' || window.location.port === '4173';
  if (isViteDev) {
    return '/api';
  }
  
  // Production Vercel or Capacitor Android App
  return 'https://cinevina-backend.vercel.app/api';
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
  source?: 'nguonc' | 'kkphim' | string;
  sub_type?: 'vietsub' | 'thuyet-minh' | 'long-tieng' | string;
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
  baseTitle?: string;
  seriesId?: string;
  seasonNumber?: number;
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
  countrySlug?: string;
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

const normalizePaginated = (data: any, grouped: boolean = false): PaginatedMovieResponse => {
  const items = adaptMovies(data, grouped);

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

export interface MovieSource {
  id: string;
  name: string;
  description: string;
  status: string;
  badge: string;
}

export interface CuratedGenre {
  slug: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
}

export const movieApi = {
  getSources: async (): Promise<MovieSource[]> => {
    try {
      const res = await api.get('/movies/sources/list');
      return res.data;
    } catch (err) {
      console.warn('[API] getSources error, using static fallback:', err);
      return [
        { id: 'all', name: 'Tất cả nguồn', description: 'Gộp tự động Nguồn C + KKPhim', status: 'online', badge: 'Tối ưu nhất' },
        { id: 'nguonc', name: 'Nguồn C (VIP Sub)', description: 'Vietsub chuẩn, Thuyết minh & Lồng tiếng', status: 'online', badge: 'Khuyên dùng' },
        { id: 'kkphim', name: 'KKPhim (HLS Fast)', description: 'Tốc độ cao HLS m3u8', status: 'online', badge: 'Tốc độ' },
      ];
    }
  },

  getGenres: async (): Promise<CuratedGenre[]> => {
    try {
      const res = await api.get('/movies/genres');
      return res.data;
    } catch {
      return [
        { slug: "hanh-dong", name: "Hành động", tagline: "Mãn nhãn, kỹ xảo bom tấn", icon: "💥", color: "from-red-500 to-orange-600" },
        { slug: "tinh-cam", name: "Tình cảm", tagline: "Ngọt ngào, sâu lắng chạm trái tim", icon: "💖", color: "from-pink-500 to-rose-600" },
        { slug: "hai-huoc", name: "Hài hước", tagline: "Cười thả ga, xua tan căng thẳng", icon: "🤣", color: "from-yellow-400 to-amber-600" },
        { slug: "co-trang", name: "Cổ trang", tagline: "Cung đình, kiếm hiệp kỳ ảo", icon: "🏮", color: "from-rose-400 to-amber-600" },
        { slug: "tam-ly", name: "Tâm lý", tagline: "Góc nhìn sâu sắc về con người", icon: "🧠", color: "from-indigo-500 to-sky-600" },
        { slug: "hinh-su", name: "Hình sự", tagline: "Phá án ly kỳ, đối đầu ngầm nghẹt thở", icon: "🔍", color: "from-blue-600 to-slate-800" },
        { slug: "kinh-di", name: "Kinh dị", tagline: "Thách thức lòng dũng cảm", icon: "👻", color: "from-emerald-700 to-slate-900" },
        { slug: "vien-tuong", name: "Viễn tưởng", tagline: "Khám phá vũ trụ & tương lai kỳ vĩ", icon: "🚀", color: "from-cyan-500 to-blue-600" },
        { slug: "phieu-luu", name: "Phiêu lưu", tagline: "Chinh phục những vùng đất bí ẩn", icon: "🗺️", color: "from-emerald-500 to-teal-700" },
        { slug: "vo-thuat", name: "Võ thuật", tagline: "Kiếm hiệp giang hồ, quyền cước chân thực", icon: "⚔️", color: "from-amber-600 to-yellow-700" },
        { slug: "hoat-hinh", name: "Hoạt hình", tagline: "Thế giới sắc màu của mọi lứa tuổi", icon: "🎨", color: "from-violet-500 to-fuchsia-600" },
        { slug: "chien-tranh", name: "Chiến tranh", tagline: "Tái hiện những trang sử khốc liệt", icon: "🎖️", color: "from-slate-600 to-zinc-800" },
      ];
    }
  },

  getMovies: async (params: MovieListParams): Promise<PaginatedMovieResponse> => {
    try {
      const { category, page = 1, country, genre, year, sort, source = 'all' } = params;
      const res = await api.get('/movies', {
        params: { category, page, country, genre, year, sort, source },
      });
      return normalizePaginated(res.data, true);
    } catch (err) {
      console.error(`[API] getMovies error for category ${params.category}:`, err);
      throw err;
    }
  },

  getMoviesByCountry: async (countrySlug: string, page = 1, filters?: { genre?: string; year?: string; sort?: string }, source = 'all'): Promise<PaginatedMovieResponse> => {
    try {
      const res = await api.get(`/movies/by-country/${countrySlug}`, {
        params: { page, ...filters, source },
      });
      return normalizePaginated(res.data, true);
    } catch (err) {
      console.error(`[API] getMoviesByCountry error for ${countrySlug}:`, err);
      throw err;
    }
  },

  getMoviesByGenre: async (genreSlug: string, page = 1, filters?: { country?: string; year?: string; sort?: string }, source = 'all'): Promise<PaginatedMovieResponse> => {
    try {
      const res = await api.get(`/movies/by-genre/${genreSlug}`, {
        params: { page, ...filters, source },
      });
      return normalizePaginated(res.data, true);
    } catch (err) {
      console.error(`[API] getMoviesByGenre error for ${genreSlug}:`, err);
      try {
        const fallbackRes = await api.get('/movies', {
          params: { genre: genreSlug, page, ...filters, source },
        });
        return normalizePaginated(fallbackRes.data, true);
      } catch (fErr) {
        console.error(`[API] Fallback /movies error for ${genreSlug}:`, fErr);
        throw err;
      }
    }
  },

  searchMovies: async (keyword: string, page: number = 1, source = 'all'): Promise<MovieInfo[]> => {
    try {
      const res = await api.get('/movies/search', {
        params: { keyword, page, source },
      });
      return adaptMovies(res.data, true);
    } catch (err) {
      console.error(`[API] searchMovies error for keyword "${keyword}":`, err);
      return [];
    }
  },

  getMovieDetail: async (slug: string, source = 'all'): Promise<MovieInfo> => {
    try {
      const res = await api.get<any>(`/movies/${slug}`, { params: { source } });
      return adaptMovieDetail(res.data);
    } catch (err) {
      console.error(`[API] getMovieDetail error for ${slug}:`, err);
      throw err;
    }
  },

  getSeriesDetail: async (seriesId: string): Promise<any> => {
    try {
      const keyword = seriesId.replace(/-/g, ' ');
      const res = await api.get('/movies/search', { params: { keyword, limit: 100 } });
      const items = adaptMovies(res.data, false);
      
      const seasons = items.filter(m => m.seriesId === seriesId).sort((a, b) => (a.seasonNumber || 1) - (b.seasonNumber || 1));
      
      if (!seasons.length) throw new Error('Series not found');
      const baseMovie = seasons[seasons.length - 1];
      
      return {
        series_id: seriesId,
        name: baseMovie.baseTitle || baseMovie.name,
        description: baseMovie.description,
        poster_url: baseMovie.posterUrl,
        seasons: seasons.map(s => ({ ...s, season_number: s.seasonNumber }))
      };
    } catch (err) {
      console.error(`[API] getSeriesDetail error for ${seriesId}:`, err);
      throw err;
    }
  },

  getMovieStream: async (slug: string, episodeSlug: string, source = 'all'): Promise<StreamInfo> => {
    try {
      const res = await api.get<StreamInfo>(`/movies/${slug}/stream/${episodeSlug}`, { params: { source } });
      return res.data;
    } catch (err) {
      console.error(`[API] getMovieStream error for ${slug}/${episodeSlug}:`, err);
      throw err;
    }
  },

  getCinemaMovies: async (page: number = 1, source = 'all'): Promise<PaginatedMovieResponse> => {
    try {
      const res = await api.get('/movies/cinema', { params: { page, source } });
      return normalizePaginated(res.data, true);
    } catch (err) {
      console.warn(`[API] getCinemaMovies failed, falling back to category:`, err);
      return movieApi.getMovies({ category: 'phim-chieu-rap', page, source });
    }
  },

  getLatestMovies: async (limit: number = 10, source = 'all'): Promise<MovieInfo[]> => {
    try {
      const res = await api.get('/movies/trending', { params: { limit, source } });
      return adaptMovies(res.data, true);
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
