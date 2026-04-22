import asyncio
import httpx
from typing import List, Optional
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
    Listing API KHÔNG có episodes/stream links.
    is_streamable được suy ra từ status (status == 'trailer' → không xem được).
    """
    status = item.get('status', '')
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
        trailer_url=item.get('trailer_url', ''),
        # Dùng status để suy luận streamable từ listing (không gọi detail cho từng phim)
        # status != 'trailer' có nghĩa là phim này có thể xem được
        is_streamable=status != 'trailer',
        episodes=[],
        servers=[],
    )


def _map_detail_movie(data: dict) -> Optional[MovieInfo]:
    """
    Map full detail API response → MovieInfo.
    Đây là hàm duy nhất được dùng cho /api/movies/{slug}.
    Giữ nguyên link_m3u8/link_embed trong ServerData để frontend dùng.
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
    
    # Build category and country as display strings
    raw_categories = movie.get('category', [])
    category_str = ', '.join(
        c.get('name', '') for c in raw_categories if isinstance(c, dict)
    ) if isinstance(raw_categories, list) else str(raw_categories)
    
    raw_countries = movie.get('country', [])
    country_str = ', '.join(
        c.get('name', '') for c in raw_countries if isinstance(c, dict)
    ) if isinstance(raw_countries, list) else str(raw_countries)
    
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
        trailer_url=movie.get('trailer_url', ''),
        category=category_str,
        country=country_str,
        cast=cast_str,
        director=director_str,
        rating=rating_str,
        totalEpisodes=str(movie.get('episode_total', '')),
        is_streamable=is_streamable,
        episodes=all_episodes_flat,
        servers=servers,
    )


# ─── Plugin ───────────────────────────────────────────────────────────────────

class VNMediaPlugin(BaseSourcePlugin):
    BASE_URL = "https://phimapi.com"

    @property
    def id(self) -> str:
        return "vnmedia"

    @property
    def name(self) -> str:
        return "VN Media (PhimAPI)"

    # ── Internal Helpers ──────────────────────────────────────────────────────

    def _filter_trailers(self, items: List[dict]) -> List[dict]:
        """
        Loại bỏ phim trailer-only khỏi listing thông thường.
        Chỉ dùng field status để lọc — không gọi detail API cho từng phim.
        """
        return [i for i in items if i.get('status') != 'trailer']

    def _extract_items_from_v1_response(self, body: dict) -> List[dict]:
        """Extract items từ response chuẩn của /v1/api/..."""
        data = body.get('data', {})
        if isinstance(data, dict):
            return data.get('items', [])
        return []

    # ── Public Interface ──────────────────────────────────────────────────────

    async def get_movies(self, category: str, page: int = 1) -> List[MovieInfo]:
        return await self.get_catalog(category, page)

    async def get_catalog(self, category: str, page: int = 1) -> List[MovieInfo]:
        """
        GET /v1/api/danh-sach/{category}?page={n}
        
        Với phim-chieu-rap: lấy từ phim-le rồi lọc chieurap==true.
        """
        if category == 'phim-chieu-rap':
            fetch_category = 'phim-le'
        else:
            fetch_category = category

        url = f"{self.BASE_URL}/v1/api/danh-sach/{fetch_category}"
        
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"page": page})
            
            if resp.status_code != 200:
                # Fallback to old-style listing
                url_old = f"{self.BASE_URL}/danh-sach/{category}"
                resp = await client.get(url_old, params={"page": page})
                if resp.status_code != 200:
                    return []
                body = resp.json()
                raw_items = body.get('items', [])
            else:
                raw_items = self._extract_items_from_v1_response(resp.json())

        # Filter trailers
        filtered = self._filter_trailers(raw_items)
        
        # Cinema: lọc thêm chieurap == true
        if category == 'phim-chieu-rap':
            filtered = [i for i in filtered if i.get('chieurap') is True]

        return [_map_listing_item(i) for i in filtered]

    async def get_catalog_by_genre(self, slug: str, page: int = 1) -> List[MovieInfo]:
        """
        GET /v1/api/the-loai/{slug}?page={n}
        
        Special case: hoat-hinh is a category (not a genre) in KKPhim, route it accordingly.
        """
        # hoat-hinh is a listing category, not a genre tag
        if slug in ('hoat-hinh', 'hoathinh'):
            return await self.get_catalog('hoat-hinh', page)
        
        url = f"{self.BASE_URL}/v1/api/the-loai/{slug}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"page": page})
            if resp.status_code != 200:
                return []
            body = resp.json()
            # Check if API returned success
            if not body.get('status', True):
                return []
            raw_items = self._extract_items_from_v1_response(body)

        filtered = self._filter_trailers(raw_items)
        
        # Verify: item phải thực sự thuộc genre slug này
        # The /v1/api/the-loai/ endpoint already filters by genre, so items should match
        # But we do a secondary verify to weed out any mismatches
        verified = []
        for item in filtered:
            item_cats = item.get('category', [])
            if isinstance(item_cats, list) and item_cats:
                cat_slugs = [c.get('slug', '') for c in item_cats if isinstance(c, dict)]
                if not cat_slugs or slug in cat_slugs:
                    verified.append(item)
            else:
                # If no category data in listing item, include it (endpoint already filtered)
                verified.append(item)
        
        return [_map_listing_item(i) for i in verified]

    async def get_catalog_by_country(self, slug: str, page: int = 1) -> List[MovieInfo]:
        """GET /v1/api/quoc-gia/{slug}?page={n}"""
        url = f"{self.BASE_URL}/v1/api/quoc-gia/{slug}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"page": page})
            if resp.status_code != 200:
                return []
            raw_items = self._extract_items_from_v1_response(resp.json())

        filtered = self._filter_trailers(raw_items)
        return [_map_listing_item(i) for i in filtered]

    async def get_catalog_by_year(self, year: str, page: int = 1) -> List[MovieInfo]:
        """GET /v1/api/nam/{year}?page={n}"""
        url = f"{self.BASE_URL}/v1/api/nam/{year}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"page": page})
            if resp.status_code != 200:
                return []
            raw_items = self._extract_items_from_v1_response(resp.json())

        filtered = self._filter_trailers(raw_items)
        return [_map_listing_item(i) for i in filtered]

    async def search(self, keyword: str, page: int = 1) -> List[MovieInfo]:
        """GET /v1/api/tim-kiem?keyword={kw}&page={n}&limit=30"""
        url = f"{self.BASE_URL}/v1/api/tim-kiem"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, params={"keyword": keyword, "page": page, "limit": 30})
            if resp.status_code != 200:
                return []
            raw_items = self._extract_items_from_v1_response(resp.json())

        # Don't filter trailers in search — user might be searching for trailers intentionally
        # but mark is_streamable correctly via status
        return [_map_listing_item(i) for i in raw_items]

    async def get_movie_detail(self, slug: str) -> Optional[MovieInfo]:
        """
        GET /phim/{slug}
        
        Bắt buộc dùng hàm này để lấy chi tiết phim + stream links đầy đủ.
        KHÔNG dùng listing response để render detail.
        """
        url = f"{self.BASE_URL}/phim/{slug}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            return _map_detail_movie(resp.json())

    async def get_stream(self, movie_slug: str, episode_slug: str) -> Optional[StreamInfo]:
        """GET /phim/{slug} → tìm episode theo slug → trả StreamInfo"""
        url = f"{self.BASE_URL}/phim/{movie_slug}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            data = resp.json()

        movie_data = data.get('movie', {})
        
        # Special case: trailer
        if episode_slug == 'trailer':
            trailer = movie_data.get('trailer_url', '')
            if trailer:
                return StreamInfo(url=trailer, type='youtube')
            return None

        # Find episode in server_data
        for ep_group in data.get('episodes', []):
            for ep in ep_group.get('server_data', []):
                if ep.get('slug') == episode_slug:
                    link_m3u8 = ep.get('link_m3u8', '') or ''
                    link_embed = ep.get('link_embed', '') or ''
                    if link_m3u8:
                        return StreamInfo(url=link_m3u8, type='hls')
                    elif link_embed:
                        return StreamInfo(url=link_embed, type='embed')
        
        return None
