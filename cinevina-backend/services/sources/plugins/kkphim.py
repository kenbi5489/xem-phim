import asyncio
import httpx
from typing import List, Optional, Dict, Any
from ..base import BaseSourcePlugin, MovieInfo, EpisodeInfo, EpisodeData, ServerData, StreamInfo

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _build_img(path: str) -> str:
    """
    Trả về URL ảnh đã được proxy qua backend (relative path).
    """
    if not path:
        return ''
    if path.startswith('/api/proxy/image') or path.startswith('/proxy/image') or 'proxy/image' in path:
        return path
    
    # Normalize: KKPhim thường dùng phimimg.com cho ảnh
    if not path.startswith('http'):
        if path.startswith('upload/') or path.startswith('uploads/'):
            path = f"https://phimimg.com/{path}"
        else:
            path = f"https://phimimg.com/upload/{path}"
            
    from urllib.parse import quote
    # Return path starting with /api/proxy (frontend will prepend BACKEND_URL)
    return f"/api/proxy/image?url={quote(path, safe='')}"


def _map_listing_item(item: dict) -> MovieInfo:
    """
    Map một item từ listing API → MovieInfo.
    """
    status = item.get('status', '')
    
    # Handle country
    raw_countries = item.get('country', [])
    country_name = ""
    country_slug = ""
    if isinstance(raw_countries, list) and len(raw_countries) > 0:
        country_name = raw_countries[0].get('name', '')
        country_slug = raw_countries[0].get('slug', '')
    elif isinstance(raw_countries, str):
        country_name = raw_countries
        country_slug = raw_countries.lower().replace(' ', '-')

    # Handle category/genre
    raw_categories = item.get('category', [])
    genres = []
    if isinstance(raw_categories, list):
        genres = [{"name": c.get("name",""), "slug": c.get("slug","")} for c in raw_categories]
        
    # Extract rating
    tmdb_rating = item.get('tmdb', {})
    rating_val = tmdb_rating.get('vote_average') if isinstance(tmdb_rating, dict) else None
    rating_str = str(rating_val) if rating_val else ''
    
    return MovieInfo(
        id=item.get('_id', ''),
        slug=item.get('slug', ''),
        title=item.get('name', ''),
        original_title=item.get('origin_name', ''),
        poster_url=_build_img(item.get('poster_url', '')),
        thumb_url=_build_img(item.get('thumb_url', '')),
        description='',
        year=item.get('year'),
        quality=item.get('quality'),
        lang=item.get('lang'),
        type=item.get('type', ''),
        is_cinema=bool(item.get('chieurap', False)),
        country=country_name,
        country_slug=country_slug,
        genres=genres,
        trailer_url=item.get('trailer_url', ''),
        totalEpisodes=str(item.get('episode_total', '')),
        current_episode=item.get('episode_current', ''),
        rating=rating_str,
        is_streamable=status != 'trailer',
        modified=item.get('modified', {}).get('time', ''),
        episodes=[],
        servers=[],
    )


def _map_detail_movie(data: dict) -> Optional[MovieInfo]:
    """
    Map full detail API response → MovieInfo.
    """
    movie = data.get('movie', {})
    if not movie:
        return None
    
    raw_episodes = data.get('episodes', [])

    # Build servers với full stream links
    servers = []
    all_episodes_flat = []
    is_streamable = False
    
    for server in raw_episodes:
        server_name = server.get('server_name', 'Server')
        ep_data_list = []
        for ep in server.get('server_data', []):
            link_m3u8 = ep.get('link_m3u8', '') or ''
            link_embed = ep.get('link_embed', '') or ''
            ep_slug = ep.get('slug', '')
            ep_name = ep.get('name', '')
            
            ep_data_list.append(EpisodeData(
                name=ep_name,
                slug=ep_slug,
                filename=ep.get('filename', ''),
                link_m3u8=link_m3u8,
                link_embed=link_embed,
            ))
            
            if link_m3u8 or link_embed:
                is_streamable = True
            
            # Also track flat episodes list for backward compat
            if ep_slug and ep_slug not in [e.slug for e in all_episodes_flat]:
                all_episodes_flat.append(EpisodeInfo(
                    id=ep_slug,
                    name=ep_name,
                    slug=ep_slug,
                ))
        
        servers.append(ServerData(
            server_name=server_name,
            server_data=ep_data_list,
        ))
    
    # Build category and country
    raw_categories = movie.get('category', [])
    genres = []
    category_str = ""
    if isinstance(raw_categories, list):
        genres = [{"name": c.get("name",""), "slug": c.get("slug","")} for c in raw_categories]
        category_str = ', '.join(c.get('name', '') for c in raw_categories if isinstance(c, dict))
    
    raw_countries = movie.get('country', [])
    country_name = ""
    country_slug = ""
    country_str = ""
    if isinstance(raw_countries, list) and len(raw_countries) > 0:
        country_name = raw_countries[0].get('name', '')
        country_slug = raw_countries[0].get('slug', '')
        country_str = ', '.join(c.get('name', '') for c in raw_countries if isinstance(c, dict))
    
    raw_actors = movie.get('actor', [])
    cast_str = ', '.join(raw_actors) if isinstance(raw_actors, list) else str(raw_actors)
    
    raw_directors = movie.get('director', [])
    director_str = ', '.join(raw_directors) if isinstance(raw_directors, list) else str(raw_directors)
    
    # Rating: prefer tmdb vote_average
    tmdb_rating = movie.get('tmdb', {})
    rating_val = tmdb_rating.get('vote_average') if isinstance(tmdb_rating, dict) else None
    rating_str = str(rating_val) if rating_val else ''
    
    return MovieInfo(
        id=movie.get('_id', ''),
        slug=movie.get('slug', ''),
        title=movie.get('name', ''),
        original_title=movie.get('origin_name', ''),
        poster_url=_build_img(movie.get('poster_url', '')),
        thumb_url=_build_img(movie.get('thumb_url', '')),
        description=movie.get('content', '') or '',
        year=movie.get('year'),
        quality=movie.get('quality'),
        lang=movie.get('lang'),
        type=movie.get('type', ''),
        is_cinema=bool(movie.get('chieurap', False)),
        country=country_str,
        country_slug=country_slug,
        genres=genres,
        trailer_url=movie.get('trailer_url', ''),
        category=category_str,
        cast=cast_str,
        director=director_str,
        rating=rating_str,
        totalEpisodes=str(movie.get('episode_total', '')),
        current_episode=movie.get('episode_current', ''),
        is_streamable=is_streamable,
        modified=movie.get('modified', {}).get('time', ''),
        episodes=all_episodes_flat,
        servers=servers,
    )


# ─── Plugin ───────────────────────────────────────────────────────────────────

class KKPhimSource(BaseSourcePlugin):
    BASE_URL = "https://phimapi.com"

    @property
    def id(self) -> str:
        return "kkphim"

    @property
    def name(self) -> str:
        return "KKPhim"
        
    @property
    def priority(self) -> int:
        return 1

    # ── Internal Helpers ──────────────────────────────────────────────────────

    def _filter_trailers(self, items: List[dict]) -> List[dict]:
        return [i for i in items if i.get('status') != 'trailer']

    def _extract_items_from_v1_response(self, body: dict) -> List[dict]:
        data = body.get('data', {})
        if isinstance(data, dict):
            return data.get('items', [])
        return []

    def _wrap_paginated_response(self, body: dict, items: List[MovieInfo]) -> Dict[str, Any]:
        params = body.get('data', {}).get('params', {})
        pagination = params.get('pagination', {})
        return {
            "items": items,
            "total": pagination.get('totalItems', 0),
            "page": pagination.get('currentPage', 1),
            "limit": pagination.get('totalItemsPerPage', 24),
            "total_pages": pagination.get('totalPages', 1)
        }

    # ── Public Interface ──────────────────────────────────────────────────────

    async def get_movies(self, category: str, page: int = 1, **filters) -> Dict[str, Any]:
        """
        Lấy danh mục phim (phim-moi, phim-le, phim-bo, hoat-hinh)
        """
        # Handle custom filters if provided
        genre = filters.get('genre')
        country = filters.get('country')
        if genre:
            return await self.get_by_category(genre, page, **filters)
        if country:
            return await self.get_by_country(country, page, **filters)

        fetch_category = category
        url = f"{self.BASE_URL}/v1/api/danh-sach/{fetch_category}"
        
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"page": page})
            
            if resp.status_code != 200:
                # Fallback to old-style listing
                url_old = f"{self.BASE_URL}/danh-sach/{category}"
                resp = await client.get(url_old, params={"page": page})
                if resp.status_code != 200:
                    return {"items": [], "total": 0, "page": page, "limit": 24, "total_pages": 0}
                body = resp.json()
                raw_items = body.get('items', [])
                filtered = self._filter_trailers(raw_items)
                items = [_map_listing_item(i) for i in filtered]
                return {
                    "items": items,
                    "total": len(items),
                    "page": page,
                    "limit": 24,
                    "total_pages": 1
                }
            else:
                body = resp.json()
                raw_items = self._extract_items_from_v1_response(body)
                filtered = self._filter_trailers(raw_items)
                items = [_map_listing_item(i) for i in filtered]
                return self._wrap_paginated_response(body, items)

    async def search(self, keyword: str, page: int = 1) -> List[MovieInfo]:
        url = f"{self.BASE_URL}/v1/api/tim-kiem"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"keyword": keyword, "page": page, "limit": 30})
            if resp.status_code != 200:
                return []
            raw_items = self._extract_items_from_v1_response(resp.json())
        return [_map_listing_item(i) for i in raw_items]

    async def get_movie_detail(self, slug: str) -> Optional[MovieInfo]:
        url = f"{self.BASE_URL}/phim/{slug}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            return _map_detail_movie(resp.json())

    async def get_by_category(self, slug: str, page: int = 1, **filters) -> Dict[str, Any]:
        """Lấy phim theo thể loại thuần (hanh-dong, kinh-di, etc)"""
        # hoat-hinh is a listing category, not a genre tag in KKPhim
        if slug in ('hoat-hinh', 'hoathinh'):
            return await self.get_movies('hoat-hinh', page, **filters)
        
        url = f"{self.BASE_URL}/v1/api/the-loai/{slug}"
        params = {"page": page}
        if filters.get('country'): params["country"] = filters['country']
        if filters.get('year'): params["year"] = filters['year']
        if filters.get('sort'): params["sort_field"] = filters['sort']

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return {"items": [], "total": 0, "page": page, "limit": 24, "total_pages": 0}
            body = resp.json()
            raw_items = self._extract_items_from_v1_response(body)
            filtered = self._filter_trailers(raw_items)
            items = [_map_listing_item(i) for i in filtered]
            return self._wrap_paginated_response(body, items)

    async def get_by_country(self, slug: str, page: int = 1, **filters) -> Dict[str, Any]:
        """Lấy phim theo quốc gia (viet-nam, han-quoc, etc)"""
        url = f"{self.BASE_URL}/v1/api/quoc-gia/{slug}"
        params = {"page": page}
        if filters.get('genre'): params["category"] = filters['genre']
        if filters.get('year'): params["year"] = filters['year']
        if filters.get('sort'): params["sort_field"] = filters['sort']

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params=params)
            if resp.status_code != 200:
                return {"items": [], "total": 0, "page": page, "limit": 24, "total_pages": 0}
            body = resp.json()
            raw_items = self._extract_items_from_v1_response(body)
            filtered = self._filter_trailers(raw_items)
            items = [_map_listing_item(i) for i in filtered]
            return self._wrap_paginated_response(body, items)

    async def get_stream(self, movie_slug: str, episode_slug: str) -> Optional[StreamInfo]:
        url = f"{self.BASE_URL}/phim/{movie_slug}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            data = resp.json()

        movie_data = data.get('movie', {})
        if episode_slug == 'trailer':
            trailer = movie_data.get('trailer_url', '')
            if trailer:
                return StreamInfo(url=trailer, type='youtube')
            return None

        for ep_group in data.get('episodes', []):
            for ep in ep_group.get('server_data', []):
                if ep.get('slug') == episode_slug:
                    link_m3u8 = ep.get('link_m3u8', '')
                    link_embed = ep.get('link_embed', '')
                    if link_m3u8:
                        return StreamInfo(url=link_m3u8, type='hls')
                    elif link_embed:
                        return StreamInfo(url=link_embed, type='embed')
        return None
