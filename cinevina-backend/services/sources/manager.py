from typing import List, Optional, Dict, Any
from .registry import SourceRegistry
from .base import BaseSourcePlugin, MovieInfo, StreamInfo

class SourceManager:
    """
    Điều phối việc gọi các plugin. Hỗ trợ đa nguồn và tự động chọn nguồn ưu tiên.
    """
    def __init__(self):
        SourceRegistry.discover_plugins()

    def _get_plugin(self, source_id: Optional[str] = None) -> Optional[BaseSourcePlugin]:
        if source_id:
            plugin = SourceRegistry.get_plugin(source_id)
            if plugin and plugin.enabled:
                return plugin
        return SourceRegistry.get_primary()

    async def get_movies(
        self,
        category: str,
        page: int = 1,
        source_id: Optional[str] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        plugin = self._get_plugin(source_id)
        if not plugin:
            return {"items": [], "total": 0, "page": page, "limit": 24, "total_pages": 0}
        
        # Determine which method to call based on filters
        if 'genre' in kwargs and kwargs['genre']:
            # Slug is the genre slug
            return await plugin.get_by_category(kwargs['genre'], page, **kwargs)
        if 'country' in kwargs and kwargs['country']:
            # Slug is the country slug
            return await plugin.get_by_country(kwargs['country'], page, **kwargs)
            
        return await plugin.get_movies(category, page, **kwargs)

    async def search(self, keyword: str, page: int = 1, source_id: Optional[str] = None) -> List[MovieInfo]:
        plugin = self._get_plugin(source_id)
        if plugin:
            return await plugin.search(keyword, page)
        return []

    async def get_movie_detail(self, slug: str, source_id: Optional[str] = None) -> Optional[MovieInfo]:
        plugin = self._get_plugin(source_id)
        if plugin:
            return await plugin.get_movie_detail(slug)
        return None

    async def get_stream(self, movie_slug: str, episode_slug: str, source_id: Optional[str] = None) -> Optional[StreamInfo]:
        plugin = self._get_plugin(source_id)
        if plugin:
            return await plugin.get_stream(movie_slug, episode_slug)
        return None

source_manager = SourceManager()
