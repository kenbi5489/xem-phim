from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class StreamInfo(BaseModel):
    url: str
    type: str # 'hls', 'mp4', 'embed'
    quality: Optional[str] = None
    headers: Optional[Dict[str, str]] = None

# ─── Episode models ──────────────────────────────────────────────────────────
# EpisodeData: Full episode with stream links (used in Detail API response)
class EpisodeData(BaseModel):
    name: str = ""
    slug: str = ""
    filename: Optional[str] = ""
    link_m3u8: Optional[str] = ""
    link_embed: Optional[str] = ""

class ServerData(BaseModel):
    server_name: str = ""
    server_data: List[EpisodeData] = []

# EpisodeInfo: Lightweight episode (for listing only, no stream links)
class EpisodeInfo(BaseModel):
    id: str
    name: str
    slug: str

class MovieInfo(BaseModel):
    id: str
    slug: str
    title: str
    original_title: str
    poster_url: str
    thumb_url: str
    description: str = ""
    year: Optional[int] = None
    quality: Optional[str] = None
    lang: Optional[str] = None
    type: Optional[str] = None        # 'single', 'series', etc.
    is_cinema: bool = False            # True khi chieurap==true
    trailer_url: Optional[str] = None # YouTube trailer link
    category: Optional[str] = None
    country: Optional[str] = None
    cast: Optional[str] = None
    director: Optional[str] = None
    rating: Optional[str] = None
    totalEpisodes: Optional[str] = None
    is_streamable: bool = False       # True khi có link_m3u8 hoặc link_embed
    # Lightweight list of episode slugs (for episode navigation)
    episodes: List[EpisodeInfo] = []
    # Full server data with stream links (only populated in detail response)
    servers: List[ServerData] = []

class BaseSourcePlugin(ABC):
    """
    Interface chuẩn cho tất cả các nguồn nội dung của CINEVINA.
    Mỗi plugin mới phải kế thừa class này và implement các method bắt buộc.
    """
    
    @property
    @abstractmethod
    def id(self) -> str:
        """ID duy nhất của plugin, ví dụ: 'vnmedia', 'vietmediaf'"""
        pass
        
    @property
    @abstractmethod
    def name(self) -> str:
        """Tên hiển thị của plugin"""
        pass
        
    @property
    def is_active(self) -> bool:
        """Trạng thái hoạt động của plugin. Mặc định là True."""
        return True

    @abstractmethod
    async def get_movies(self, category: str, page: int = 1) -> List[MovieInfo]:
        """Lấy danh sách phim theo danh mục"""
        pass

    @abstractmethod
    async def search(self, keyword: str, page: int = 1) -> List[MovieInfo]:
        """Tìm kiếm phim"""
        pass

    @abstractmethod
    async def get_movie_detail(self, slug: str) -> Optional[MovieInfo]:
        """Lấy chi tiết phim"""
        pass

    @abstractmethod
    async def get_stream(self, movie_slug: str, episode_slug: str) -> Optional[StreamInfo]:
        """Lấy link stream để phát video"""
        pass
