"""
Sport Live Plugin — CINEVINA
Cung cấp danh sách kênh thể thao trực tiếp dưới dạng MovieInfo/StreamInfo.
Thay STREAM_PLACEHOLDER bằng URL HLS thật khi có nguồn chính thức.
"""
from typing import List, Optional
from ..base import BaseSourcePlugin, MovieInfo, EpisodeInfo, StreamInfo

# ── Placeholder stream ─────────────────────────────────────────────────────────
# Khi có stream thật, chỉ cần thay URL ở đây, không cần sửa gì khác.
STREAM_PLACEHOLDER = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"

# ── Channel definitions ────────────────────────────────────────────────────────
# Format: (id, name, group, emoji, program_now, program_next, stream_url)
_CHANNELS = [
    # Thể thao (Sports)
    ("vtv5tt",    "VTV5 Thể Thao",  "the-thao", "⚽", "Bóng đá V-League",      "Tin thể thao tổng hợp", STREAM_PLACEHOLDER),
    ("vtv6",      "VTV6",           "the-thao", "🎬", "Phim chiếu rạp HD",     "Gameshow tối",          STREAM_PLACEHOLDER),
    ("on-sports", "On Sports+",     "the-thao", "🏆", "AFF Cup Trực Tiếp",     "Phân tích chiến thuật", STREAM_PLACEHOLDER),
    ("fox",       "Fox Sports",     "the-thao", "🦊", "Premier League Live",   "La Liga Highlights",    STREAM_PLACEHOLDER),
    # Bóng đá (Football)
    ("kplus",     "K+",             "bong-da",  "📡", "Champions League",      "K+ Studio",             STREAM_PLACEHOLDER),
    ("kplus1",    "K+1",            "bong-da",  "📺", "Serie A: Juventus",     "Ligue 1",               STREAM_PLACEHOLDER),
    ("kplus-pm",  "K+PM",          "bong-da",  "🏅", "La Liga: Barcelona",    "Bundesliga",            STREAM_PLACEHOLDER),
    ("bein1",     "beIN Sports 1",  "bong-da",  "⚽", "NBA: Lakers vs GSW",    "MLB Baseball",          STREAM_PLACEHOLDER),
    ("bein2",     "beIN Sports 2",  "bong-da",  "🏀", "NFL Sunday Night",      "NHL Hockey",            STREAM_PLACEHOLDER),
    # Truyền hình (TV)
    ("vtv1",      "VTV1",           "truyen-hinh", "📡", "Thời sự 19h",        "Phim truyện",           STREAM_PLACEHOLDER),
    ("vtv3",      "VTV3",           "truyen-hinh", "🎭", "Ai Là Triệu Phú",    "Phim Việt giờ vàng",    STREAM_PLACEHOLDER),
    ("htv7",      "HTV7",           "truyen-hinh", "🇻🇳", "Running Man VN",   "Phim tối HTV7",         STREAM_PLACEHOLDER),
]

# ── Group meta ────────────────────────────────────────────────────────────────
_GROUP_LABELS = {
    "the-thao":    "Thể thao",
    "bong-da":     "Bóng đá",
    "truyen-hinh": "Truyền hình",
}

def _channel_to_movie(ch: tuple) -> MovieInfo:
    cid, name, group, emoji, prog_now, prog_next, _ = ch
    return MovieInfo(
        id=cid,
        slug=cid,
        title=name,
        original_title=prog_now,
        poster_url="",
        thumb_url="",
        description=f"Đang phát: {prog_now}\nTiếp theo: {prog_next}",
        year=None,
        quality="LIVE",
        lang="VI",
        type="live",
        is_cinema=False,
        episodes=[EpisodeInfo(id="live", name="Trực tiếp", slug="live")],
    )


class SportLivePlugin(BaseSourcePlugin):
    @property
    def id(self) -> str:
        return "sport_live"

    @property
    def name(self) -> str:
        return "Sport Live"

    @property
    def is_active(self) -> bool:
        return True  # ← kích hoạt plugin

    def get_channels(self, group: Optional[str] = None) -> List[dict]:
        """
        Trả về danh sách kênh dạng dict để LiveTV page dùng trực tiếp.
        group: 'the-thao' | 'bong-da' | 'truyen-hinh' | None (tất cả)
        """
        channels = []
        for ch in _CHANNELS:
            cid, name, grp, emoji, prog_now, prog_next, stream_url = ch
            if group and grp != group:
                continue
            channels.append({
                "id": cid,
                "name": name,
                "group": grp,
                "group_label": _GROUP_LABELS.get(grp, grp),
                "emoji": emoji,
                "program_now": prog_now,
                "program_next": prog_next,
                "stream_url": stream_url,
                "color": {
                    "the-thao": "#16a34a",
                    "bong-da": "#1d4ed8",
                    "truyen-hinh": "#7c3aed",
                }.get(grp, "#525252"),
            })
        return channels

    async def get_movies(self, category: str, page: int = 1, **kwargs) -> List[MovieInfo]:
        """Dùng khi Browse page gọi /browse/the-thao."""
        return [_channel_to_movie(ch) for ch in _CHANNELS]

    async def search(self, keyword: str, page: int = 1) -> List[MovieInfo]:
        kw = keyword.lower()
        return [_channel_to_movie(ch) for ch in _CHANNELS if kw in ch[1].lower()]

    async def get_movie_detail(self, slug: str) -> Optional[MovieInfo]:
        for ch in _CHANNELS:
            if ch[0] == slug:
                return _channel_to_movie(ch)
        return None

    async def get_stream(self, movie_slug: str, episode_slug: str) -> Optional[StreamInfo]:
        for ch in _CHANNELS:
            if ch[0] == movie_slug:
                return StreamInfo(url=ch[6], type="hls", quality="HD")
        return None
