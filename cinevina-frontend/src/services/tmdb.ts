import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBImage {
  file_path: string;
  width: number;
  height: number;
  aspect_ratio: number;
}

export interface TMDBKeyword {
  id: number;
  name: string;
}

export interface TMDBCast {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
}

export interface TMDBData {
  backdrops: TMDBImage[];
  keywords: string[];
  cast: TMDBCast[];
}

export const getTMDBInfo = async (tmdbId: string | number, isSeries: boolean): Promise<TMDBData | null> => {
  if (!TMDB_API_KEY) return null;

  try {
    const type = isSeries ? 'tv' : 'movie';
    const res = await axios.get(`${BASE_URL}/${type}/${tmdbId}`, {
      params: {
        api_key: TMDB_API_KEY,
        append_to_response: 'credits,images,keywords',
      },
    });

    const data = res.data;

    let keywordsList: string[] = [];
    if (isSeries) {
        keywordsList = data.keywords?.results?.map((k: any) => k.name) || [];
    } else {
        keywordsList = data.keywords?.keywords?.map((k: any) => k.name) || [];
    }

    return {
      backdrops: data.images?.backdrops || [],
      keywords: keywordsList,
      cast: data.credits?.cast || [],
    };
  } catch (error) {
    console.error('Failed to fetch from TMDB:', error);
    // If we guessed the wrong type (movie instead of tv), try the other one as a fallback
    if (error && (error as any).response && (error as any).response.status === 404) {
      try {
        const fallbackType = isSeries ? 'movie' : 'tv';
        const res = await axios.get(`${BASE_URL}/${fallbackType}/${tmdbId}`, {
          params: {
            api_key: TMDB_API_KEY,
            append_to_response: 'credits,images,keywords',
          },
        });
        const data = res.data;
        let keywordsList: string[] = [];
        if (fallbackType === 'tv') {
            keywordsList = data.keywords?.results?.map((k: any) => k.name) || [];
        } else {
            keywordsList = data.keywords?.keywords?.map((k: any) => k.name) || [];
        }
        return {
          backdrops: data.images?.backdrops || [],
          keywords: keywordsList,
          cast: data.credits?.cast || [],
        };
      } catch (e) {
          return null;
      }
    }
    return null;
  }
};
