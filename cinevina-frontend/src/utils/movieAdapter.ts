import type { MovieInfo } from '../services/api';

// API base — must match VITE_API_URL in .env
const PROXY_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api') as string;

/**
 * Wrap any image URL through the backend image proxy.
 * - Backend already sends proxied URLs (http://localhost:8000/...) → pass through
 * - Raw phimimg/phimapi URLs → wrap through proxy
 * - Empty → return empty
 */
export const getProxiedImageUrl = (url: string): string => {
  if (!url || url.trim() === '') return '';
  
  // Ensure PROXY_BASE doesn't end with a slash for clean concatenation
  const base = PROXY_BASE.endsWith('/') ? PROXY_BASE.slice(0, -1) : PROXY_BASE;

  // Case 1: Backend returned /proxy/image... (Prepended with /api by PROXY_BASE)
  if (url.startsWith('/proxy/')) {
    return `${base}${url}`;
  }

  // Case 2: Backend returned /api/proxy/image... (We need to strip /api from base)
  if (url.startsWith('/api/proxy/')) {
    const host = base.endsWith('/api') ? base.slice(0, -4) : base;
    return `${host}${url}`;
  }

  // Case 3: Already absolute proxied URL
  if (url.includes('localhost:8000') || url.includes('127.0.0.1:8000')) {
    return url;
  }
  
  // Case 4: Raw external URL (fallback)
  return `${base}/proxy/image?url=${encodeURIComponent(url)}`;
};

/**
 * adaptMovieCard: For listing/browse/home cards only.
 * Backend already proxied poster_url and thumb_url — pass through without double-wrapping.
 * is_streamable comes from backend flag (status != "trailer").
 */
export const adaptMovieCard = (raw: any): MovieInfo => {
  if (!raw) return _emptyMovie();
  // Backend already returns proxied URLs — getProxiedImageUrl will pass them through
  const poster = getProxiedImageUrl(raw?.poster_url || raw?.poster || '');
  const thumb  = getProxiedImageUrl(raw?.thumb_url  || raw?.thumb  || '');
  return {
    id: raw?.id || raw?._id || '',
    slug: raw?.slug || '',
    title: raw?.title || raw?.name || '',
    original_title: raw?.original_title || raw?.origin_name || '',
    poster_url: poster,
    thumb_url:  thumb,
    description: '',
    year: raw?.year,
    quality: raw?.quality,
    lang: raw?.lang,
    type: raw?.type,
    is_cinema:   !!raw?.is_cinema,
    trailer_url: raw?.trailer_url || '',
    category: raw?.category || '',
    country:  raw?.country  || '',
    cast:     '',
    director: '',
    rating:   raw?.rating || '',
    totalEpisodes: raw?.totalEpisodes || '',
    is_streamable: !!raw?.is_streamable,
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

  const poster = getProxiedImageUrl(raw?.poster_url || raw?.poster || '');
  const thumb  = getProxiedImageUrl(raw?.thumb_url  || raw?.thumb  || '');

  // Read full servers from backend response
  const servers = Array.isArray(raw?.servers) ? raw.servers : [];

  // Compute is_streamable from ACTUAL stream links (source of truth)
  const computedStreamable = servers.some((s: any) =>
    Array.isArray(s?.server_data) &&
    s.server_data.some((ep: any) => ep?.link_m3u8 || ep?.link_embed)
  );
  const is_streamable = computedStreamable || !!raw?.is_streamable;

  // Normalize category — can be string or array from backend
  const category = _toDisplayString(raw?.category, 'name');
  const country  = _toDisplayString(raw?.country,  'name');

  // Normalize cast/director — can be comma string or array
  const cast     = _toCommaSeparated(raw?.cast) || _toCommaSeparated(raw?.actor) || '';
  const director = _toCommaSeparated(raw?.director) || '';

  return {
    id: raw?.id || raw?._id || '',
    slug: raw?.slug || '',
    title: raw?.title || raw?.name || '',
    original_title: raw?.original_title || raw?.origin_name || '',
    poster_url: poster,
    thumb_url:  thumb,
    description: raw?.description || raw?.content || '',
    year: raw?.year,
    quality: raw?.quality,
    lang: raw?.lang,
    type: raw?.type,
    is_cinema:   !!raw?.is_cinema,
    trailer_url: raw?.trailer_url || '',
    category,
    country,
    cast,
    director,
    rating: raw?.rating || (raw?.tmdb?.vote_average ? String(raw.tmdb.vote_average) : '') || '',
    totalEpisodes: raw?.totalEpisodes || raw?.episode_total || '',
    is_streamable,
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
    id: '', slug: '', title: '', original_title: '',
    poster_url: '', thumb_url: '', description: '',
    is_streamable: false, episodes: [], servers: [],
  };
}

// Backward-compat exports
export const adaptMovie  = adaptMovieDetail;
export const adaptMovies = (rawList: any[]): MovieInfo[] => {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(adaptMovieCard);
};
