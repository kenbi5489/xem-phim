from typing import List, Optional
from ..base import BaseSourcePlugin, MovieInfo, StreamInfo

class AnimePlugin(BaseSourcePlugin):
    @property
    def id(self) -> str:
        return "anime"

    @property
    def name(self) -> str:
        return "Anime (AnimeHay/Viesub)"

    @property
    def is_active(self) -> bool:
        return False

    async def get_movies(self, category: str, page: int = 1) -> List[MovieInfo]:
        return []

    async def search(self, keyword: str, page: int = 1) -> List[MovieInfo]:
        return []

    async def get_movie_detail(self, slug: str) -> Optional[MovieInfo]:
        return None

    async def get_stream(self, movie_slug: str, episode_slug: str) -> Optional[StreamInfo]:
        return None
