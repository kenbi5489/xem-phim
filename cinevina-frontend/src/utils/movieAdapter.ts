import type { MovieInfo } from '../services/api';

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

const PROXY_BASE = getBaseUrl();

export const getProxiedImageUrl = (url: string): string => {
  if (!url || url.trim() === '') return '';
  
  // Clean up any double proxying first
  let targetUrl = url;
  if (url.includes('proxy/image') && url.includes('url=')) {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://dummy.com${url}`);
      const rawUrl = parsedUrl.searchParams.get('url');
      if (rawUrl && rawUrl.startsWith('http')) {
        targetUrl = rawUrl;
      }
    } catch (e) {
      console.warn('[getProxiedImageUrl] Failed to parse proxy URL:', url, e);
    }
  }

  // If it's already a local relative proxy URL, format it properly
  if (!targetUrl.startsWith('http') && targetUrl.startsWith('/')) {
    if (targetUrl.includes('proxy/image')) {
      return `${PROXY_BASE.startsWith('http') ? PROXY_BASE : '/api'}${targetUrl.replace('/api', '')}`;
    }
  }

  // DO NOT proxy Ophim images because Cloudflare blocks Vercel IPs.
  // Ophim images work directly in the browser.
  if (targetUrl.includes('ophim.live') || targetUrl.includes('ophim1.com')) {
    return targetUrl;
  }

  // Force other external URLs through our proxy to bypass hotlink/ISP blocks!
  if (targetUrl.startsWith('http')) {
    return `${PROXY_BASE.startsWith('http') ? PROXY_BASE : '/api'}/proxy/image?url=${encodeURIComponent(targetUrl)}`;
  }

  return targetUrl;
};

export const parseSeriesInfo = (name: string) => {
  if (!name) return { baseTitle: name, seriesId: undefined, seasonNumber: 1 };
  
  const match = name.match(/\s*(?:\(|-)?\s*(?:Phần|Season)\s*(\d+)\s*(?:\))?$/i);
  if (match) {
    const seasonNumber = parseInt(match[1], 10);
    const baseTitle = name.substring(0, match.index).trim();
    const seriesId = baseTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, '');
    return { baseTitle, seriesId, seasonNumber };
  }
  return { baseTitle: name, seriesId: undefined, seasonNumber: 1 };
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
  
  const rawTitle = raw?.title || raw?.name || '';
  const { baseTitle, seriesId, seasonNumber } = parseSeriesInfo(rawTitle);
  
  return {
    id: raw?.id || raw?._id || '',
    slug: raw?.slug || '',
    name: raw?.base_title || baseTitle,
    baseTitle: raw?.base_title || baseTitle,
    seriesId: raw?.series_id || seriesId,
    seasonNumber: raw?.season_number || seasonNumber,
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

  const rawTitle = raw?.title || raw?.name || '';
  const { baseTitle, seriesId, seasonNumber } = parseSeriesInfo(rawTitle);

  let episodes = Array.isArray(raw?.episodes) ? raw.episodes : [];
  if (episodes.length === 0 && servers.length > 0) {
    // If root episodes is empty, fallback to the first server's data
    episodes = servers[0].server_data || [];
  }

  return {
    id: raw?.id || raw?._id || '',
    slug: raw?.slug || '',
    name: raw?.base_title || baseTitle,
    baseTitle: raw?.base_title || baseTitle,
    seriesId: raw?.series_id || seriesId,
    seasonNumber: raw?.season_number || seasonNumber,
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
    episodes,
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

export const cleanTextFingerprint = (text?: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\(\[]?\b(19\d\d|20\d\d)\b[\)\]]?/g, ' ')
    .replace(/\b(phan|season|ss)\s*\d+\b/gi, ' ')
    .replace(/\b(thuyet minh|vietsub|long tieng|ban cam|cam|hd|fhd|4k|raw)\b/gi, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

export const cleanSlugFingerprint = (slug?: string): string => {
  if (!slug) return '';
  return slug
    .toLowerCase()
    .trim()
    .replace(/-(19\d\d|20\d\d)$/, '')
    .replace(/-(vietsub|thuyet-minh|long-tieng|ban-cam|cam|full|tap-full)$/, '')
    .replace(/^-+|-+$/g, '');
};

const getQualityRank = (quality?: string): number => {
  const q = (quality || '').toUpperCase();
  if (q.includes('4K') || q.includes('UHD') || q.includes('2160')) return 5;
  if (q.includes('FHD') || q.includes('1080')) return 4;
  if (q.includes('HD') || q.includes('720')) return 3;
  if (q.includes('SD') || q.includes('480')) return 2;
  if (q.includes('CAM')) return 1;
  return 3;
};

/**
 * Normalize any response into a flat array of MovieInfo objects.
 * Deduplicates entries across KKPhim and Ophim sources using fingerprinting.
 */
export const adaptMovies = (input: any, grouped: boolean = false): MovieInfo[] => {
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

  const mapped = rawList.map(adaptMovieCard);
  
  // Multi-tier deduplication
  const deduped: MovieInfo[] = [];
  const fpToIndex = new Map<string, number>();

  for (const item of mapped) {
    const slug = item.slug.trim();
    const normSlug = cleanSlugFingerprint(slug);
    const titleFp = cleanTextFingerprint(item.baseTitle || item.name);
    const origFp = cleanTextFingerprint(item.originalName);
    const origWithYear = origFp && item.year ? `${origFp}_${item.year}` : '';

    let matchIdx: number | undefined = undefined;
    for (const fp of [slug, normSlug, titleFp, origWithYear]) {
      if (fp && fpToIndex.has(fp)) {
        matchIdx = fpToIndex.get(fp);
        break;
      }
    }

    if (matchIdx === undefined) {
      const idx = deduped.length;
      deduped.push(item);
      if (slug) fpToIndex.set(slug, idx);
      if (normSlug) fpToIndex.set(normSlug, idx);
      if (titleFp && titleFp.length >= 3) fpToIndex.set(titleFp, idx);
      if (origWithYear && origFp.length >= 3) fpToIndex.set(origWithYear, idx);
    } else {
      const existing = deduped[matchIdx];
      const currIsStream = item.isStreamable;
      const existIsStream = existing.isStreamable;
      const currScore = getQualityRank(item.quality);
      const existScore = getQualityRank(existing.quality);

      let replace = false;
      if (currIsStream && !existIsStream) {
        replace = true;
      } else if (!currIsStream && existIsStream) {
        replace = false;
      } else if (grouped && (item.seasonNumber || 1) > (existing.seasonNumber || 1)) {
        replace = true;
      } else if (currScore > existScore) {
        replace = true;
      } else if (!existing.posterUrl && item.posterUrl) {
        replace = true;
      }

      if (replace) {
        deduped[matchIdx] = item;
        if (slug) fpToIndex.set(slug, matchIdx);
        if (normSlug) fpToIndex.set(normSlug, matchIdx);
      }
    }
  }

  return deduped;
};
