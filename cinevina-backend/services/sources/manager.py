from typing import List, Optional
from .registry import SourceRegistry
from .base import BaseSourcePlugin, MovieInfo, StreamInfo

class SourceManager:
    """
    Điều phối việc gọi các plugin. Hỗ trợ fallback nếu plugin chính bị lỗi.
    """
    def __init__(self):
        SourceRegistry.discover_plugins()

    def _get_plugin(self, source_id: str) -> Optional[BaseSourcePlugin]:
        plugin = SourceRegistry.get_plugin(source_id)
        if not plugin or not plugin.is_active:
            return None
        return plugin

    async def get_movies(
        self,
        category: str,
        page: int = 1,
        source_id: str = "vnmedia",
        **kwargs,
    ) -> List[MovieInfo]:
        plugin = self._get_plugin(source_id)
        if not plugin:
            raise ValueError(f"Source '{source_id}' is not available")
        # Pass extra kwargs (country, genre, year, sort) if plugin supports them
        import inspect
        sig = inspect.signature(plugin.get_movies)
        supported = set(sig.parameters.keys())
        filtered_kwargs = {k: v for k, v in kwargs.items() if k in supported and v is not None}
        return await plugin.get_movies(category, page, **filtered_kwargs)

    async def search(self, keyword: str, page: int = 1, source_id: str = "vnmedia") -> List[MovieInfo]:
        plugin = self._get_plugin(source_id)
        if plugin:
            return await plugin.search(keyword, page)
        return []

    async def get_movie_detail(self, slug: str, source_id: str = "vnmedia") -> Optional[MovieInfo]:
        plugin = self._get_plugin(source_id)
        if plugin:
            return await plugin.get_movie_detail(slug)
        return None

    async def get_stream(self, movie_slug: str, episode_slug: str, source_id: str = "vnmedia") -> Optional[StreamInfo]:
        plugin = self._get_plugin(source_id)
        if plugin:
            return await plugin.get_stream(movie_slug, episode_slug)
        return None

source_manager = SourceManager()
