import type { MovieInfo } from '../services/api';

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

const PROXY_BASE = getBaseUrl();

/**
 * Wrap any image URL through the backend image proxy.
 * - Backend already sends proxied URLs (http://localhost:8000/...) → pass through
 * - Raw phimimg/phimapi URLs → wrap through proxy
 * - Empty → return empty
 */
export const getProxiedImageUrl = (url: string): string => {
  if (!url || url.trim() === '') return '';
  
  // Case 0: Intercept proxy URLs and extract the raw URL directly!
  if (url.includes('proxy/image') && url.includes('url=')) {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://dummy.com${url}`);
      const rawUrl = parsedUrl.searchParams.get('url');
      if (rawUrl && rawUrl.startsWith('http')) {
        return rawUrl;
      }
    } catch (e) {
      console.warn('[getProxiedImageUrl] Failed to parse proxy URL:', url, e);
    }
  }

  // Case 1: Already a full absolute proxied URL
  if (url.startsWith('http') && (url.includes('/proxy/image') || url.includes('/api/proxy/image'))) {
    return url;
  }

  // Case 2: Relative proxied URL (e.g. from backend response)
  // We want to ensure it starts with /api if we are on Vercel and PROXY_BASE is /api
  if (url.startsWith('/api/proxy/image') || url.startsWith('/proxy/image')) {
    const sanitizedUrl = url.startsWith('/api/') ? url : `/api${url.startsWith('/') ? '' : '/'}${url}`;
    
    // If we are on local dev (localhost:8000), we might need the full domain.
    // But on Vercel, a relative path /api/... works perfectly with rewrites.
    if (PROXY_BASE.startsWith('http')) {
      return `${PROXY_BASE.replace(/\/api$/, '')}${sanitizedUrl}`;
    }
    return sanitizedUrl;
  }

  // Case 3: Absolute external URL (phimimg, etc.) -> Use raw URL directly!
  if (url.startsWith('http')) {
    return url;
  }

  // Case 4: Other relative paths
  if (url.startsWith('/')) {
    return `${PROXY_BASE.startsWith('http') ? PROXY_BASE : '/api'}${url}`;
  }

  return url;
};

/**
 * adaptMovieCard: For listing/browse/home cards only.
 * Backend already proxied poster_url and thumb_url — pass through without double-wrapping.
 * is_streamable comes from backend flag (status != "trailer").
 */
export const adaptMovieCard = (raw: any): MovieInfo => {
  if (!raw) return _emptyMovie();
  
  // Robust image field detection
  const posterUrl = getProxiedImageUrl(raw?.poster_url || raw?.poster || raw?.thumbnail || raw?.image || '');
  const thumbUrl  = getProxiedImageUrl(raw?.thumb_url  || raw?.thumb  || raw?.thumbnail || raw?.image || '');
  
  return {
    id: raw?.id || raw?._id || '',
    slug: raw?.slug || '',
    name: raw?.title || raw?.name || '',
    originalName: raw?.original_title || raw?.origin_name || '',
    posterUrl,
    thumbUrl,
    description: raw?.description || raw?.content || '',
    year: raw?.year,
    quality: raw?.quality,
    lang: raw?.lang,
    type: raw?.type,
    isCinema:   !!raw?.is_cinema,
    trailerUrl: raw?.trailer_url || '',
    categories: raw?.category || '',
    country:  raw?.country  || '',
    cast:     '',
    director: '',
    rating:   raw?.rating || (raw?.tmdb?.vote_average ? String(raw.tmdb.vote_average) : '') || '',
    tmdbId:   raw?.tmdb?.id ? String(raw.tmdb.id) : undefined,
    totalEpisodes: raw?.totalEpisodes || '',
    isStreamable: !!raw?.is_streamable,
    episodes: [],
    servers: [],
  };
};

/**
 * adaptMovieDetail: For detail pages — reads full servers[] with stream links.
 * Recomputes is_streamable from actual link_m3u8/link_embed data.
 * Handles both string and array formats for category/country.
 */
export const adaptMovieDetail = (raw: any): MovieInfo => {
  if (!raw) return _emptyMovie();

  const posterUrl = getProxiedImageUrl(raw?.poster_url || raw?.poster || raw?.thumbnail || raw?.image || '');
  const thumbUrl  = getProxiedImageUrl(raw?.thumb_url  || raw?.thumb  || raw?.thumbnail || raw?.image || '');

  // Read full servers from backend response
  const servers = Array.isArray(raw?.servers) ? raw.servers : [];

  // Compute is_streamable from ACTUAL stream links (source of truth)
  const computedStreamable = servers.some((s: any) =>
    Array.isArray(s?.server_data) &&
    s.server_data.some((ep: any) => ep?.link_m3u8 || ep?.link_embed)
  );
  const isStreamable = computedStreamable || !!raw?.is_streamable;

  // Normalize category — can be string or array from backend
  const categories = _toDisplayString(raw?.category, 'name');
  const country  = _toDisplayString(raw?.country,  'name');

  // Normalize cast/director — can be comma string or array
  const cast     = _toCommaSeparated(raw?.cast) || _toCommaSeparated(raw?.actor) || '';
  const director = _toCommaSeparated(raw?.director) || '';

  return {
    id: raw?.id || raw?._id || '',
    slug: raw?.slug || '',
    name: raw?.title || raw?.name || '',
    originalName: raw?.original_title || raw?.origin_name || '',
    posterUrl,
    thumbUrl,
    description: raw?.description || raw?.content || '',
    year: raw?.year,
    quality: raw?.quality,
    lang: raw?.lang,
    type: raw?.type,
    isCinema:   !!raw?.is_cinema,
    trailerUrl: raw?.trailer_url || '',
    categories,
    country,
    cast,
    director,
    rating: raw?.rating || (raw?.tmdb?.vote_average ? String(raw.tmdb.vote_average) : '') || '',
    tmdbId: raw?.tmdb_id || (raw?.tmdb?.id ? String(raw.tmdb.id) : undefined),
    imdbRating: raw?.imdb_rating || '',
    imdbId: raw?.imdb_id || '',
    duration: raw?.duration || raw?.time || '',
    episodeCurrent: raw?.episode_current || '',
    totalEpisodes: raw?.totalEpisodes || raw?.total_episodes || raw?.episode_total || '',
    isStreamable,
    episodes: Array.isArray(raw?.episodes) ? raw.episodes : [],
    servers,
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function _toDisplayString(val: any, key: string): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map((v: any) => (typeof v === 'object' ? v?.[key] : v) || '').filter(Boolean).join(', ');
  return '';
}

function _toCommaSeparated(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join(', ');
  return '';
}

function _emptyMovie(): MovieInfo {
  return {
    id: '', slug: '', name: '', originalName: '',
    posterUrl: '', thumbUrl: '', description: '',
    isStreamable: false, episodes: [], servers: [],
  };
}

// Backward-compat exports
export const adaptMovie  = adaptMovieDetail;

/**
 * Normalize any response into a flat array of MovieInfo objects.
 * Handles:
 * - Array directly: [...]
 * - Object with items: { items: [...] }
 * - Object with data.items: { data: { items: [...] } }
 * - Object with data (as array): { data: [...] }
 * - Object with results: { results: [...] }
 */
export const adaptMovies = (input: any): MovieInfo[] => {
  if (!input) return [];
  
  let rawList: any[] = [];
  
  if (Array.isArray(input)) {
    rawList = input;
  } else if (input.items && Array.isArray(input.items)) {
    rawList = input.items;
  } else if (input.data && Array.isArray(input.data)) {
    rawList = input.data;
  } else if (input.data?.items && Array.isArray(input.data.items)) {
    rawList = input.data.items;
  } else if (input.results && Array.isArray(input.results)) {
    rawList = input.results;
  }

  if (rawList.length === 0) {
    console.warn('[adaptMovies] No valid movie list found in input:', input);
  }

  return rawList.map(adaptMovieCard);
};
