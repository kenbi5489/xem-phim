"""
Sport Live Plugin — CINEVINA
Cung cấp danh sách 60+ kênh truyền hình Việt Nam, Thể thao quốc tế và NBA từ TrucTiepNBA.
Nguồn stream ổn định cập nhật 2024.
"""
from typing import List, Optional
from ..base import BaseSourcePlugin, MovieInfo, EpisodeInfo, StreamInfo

# ── Màu theo nhà mạng / thể loại ───────────────────────────────────────────────
NETWORK_COLORS = {
    "VTV":       "#1d4ed8",
    "HTV":       "#7c3aed",
    "KPLUS":     "#dc2626",
    "HBO":       "#000000",
    "CINEMAX":   "#e11d48",
    "NBA":       "#1e3a8a",
    "TRUCTIEPNBA":"#f59e0b", # Amber
    "DISNEY":    "#007297",
    "FOX":       "#1a3668",
    "NATGEO":    "#ffcc00",
}

# ── Logo kênh ──────────────────────────────────────────────────────────────────
_LOGOS = {
    "vtv1":    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/VTV1_logo_%282022%29.svg/200px-VTV1_logo_%282022%29.svg.png",
    "vtv2":    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/VTV2_logo_%282022%29.svg/200px-VTV2_logo_%282022%29.svg.png",
    "vtv3":    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/VTV3_logo_%282022%29.svg/200px-VTV3_logo_%282022%29.svg.png",
    "htv7":    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/HTV7_logo_%282020%29.svg/200px-HTV7_logo_%282020%29.svg.png",
    "htv9":    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/HTV9_logo_%282020%29.svg/200px-HTV9_logo_%282020%29.svg.png",
    "hbo":     "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/200px-HBO_logo.svg.png",
    "cinemax": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Cinemax_logo_2011.svg/200px-Cinemax_logo_2011.svg.png",
    "nba-tv":  "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/NBA_TV_logo.svg/200px-NBA_TV_logo.svg.png",
}

# ── Channel definitions ────────────────────────────────────────────────────────
_CHANNELS = [
    # VTV
    ("vtv1", "VTV1 HD", "VTV", "truyen-hinh", "📺", True, "Thời sự & Chính luận", "Tin tức 24h", "https://live.fptplay53.net/fnxch2/vtv1hd_abr.smil/chunklist.m3u8"),
    ("vtv2", "VTV2 HD", "VTV", "truyen-hinh", "🧬", True, "Khoa học & Giáo dục", "Khám phá thế giới", "https://live.fptplay53.net/fnxch2/vtv2hd_abr.smil/chunklist.m3u8"),
    ("vtv3", "VTV3 HD", "VTV", "truyen-hinh", "🎭", True, "Giải trí & Thể thao", "Phim truyện VTV3", "https://live.fptplay53.net/fnxch2/vtv3hd_abr.smil/chunklist.m3u8"),
    ("vtv5", "VTV5 HD", "VTV", "truyen-hinh", "🏘️", True, "Dân tộc & Miền núi", "Văn hóa dân tộc", "https://live-a.fptplay53.net/live/media/VTV5HD/live_hls_avc/index.m3u8"),
    ("vtv9", "VTV9 HD", "VTV", "truyen-hinh", "🌴", True, "Tin tức Phía Nam", "Phim truyện VTV9", "https://toiyeuvietnam.dpdns.org/TuyetDoiKhongKinhDoanh/vtv9-hd/KenhCoBan.m3u8"),
    
    # Kênh Phim truyện
    ("hbo", "HBO HD", "HBO", "phim-truyen", "🎬", True, "Phim bom tấn Hollywood", "HBO Original Series", "https://fl1.moveonjoy.com/HBO/index.m3u8"),
    ("cinemax", "Cinemax HD", "CINEMAX", "phim-truyen", "📽️", True, "Hành động kịch tính", "Max Original", "https://fl1.moveonjoy.com/CINEMAX/index.m3u8"),
    ("star-movies", "Star Movies", "FOX", "phim-truyen", "⭐️", True, "Hollywood Blockbusters", "Classic Movies", "https://fl1.moveonjoy.com/STARZ/index.m3u8"),
    ("kplus-cine", "K+ Cine HD", "KPLUS", "phim-truyen", "🎞️", True, "Phim điện ảnh mới nhất", "Phim Việt độc quyền", "https://pepsi4.abntv.live/hls/psp4.m3u8"),
    ("kplus-action", "K+ Action HD", "KPLUS", "phim-truyen", "💥", True, "Phim hành động", "Phim võ thuật", "https://pepsi2.abntv.live/hls/psp2.m3u8"),
    
    # Discovery / Disney
    ("nat-geo", "Nat Geo HD", "NATGEO", "quoc-te", "🐆", True, "Khám phá thế giới", "National Geographic", "https://fl1.moveonjoy.com/National_Geographic/index.m3u8"),
    ("discovery", "Discovery Channel", "DISCOVERY", "quoc-te", "🔬", True, "Khoa học & Đời sống", "The History Channel", "https://fl1.moveonjoy.com/history_channel/index.m3u8"),
    ("disney", "Disney Channel", "DISNEY", "thieu-nhi", "🏰", True, "Disney Original", "Animation", "https://fl1.moveonjoy.com/DISNEY/index.m3u8"),

    # HTV / THVL / Dia phuong
    ("htv7", "HTV7 HD", "HTV", "truyen-hinh", "🇻🇳", True, "Giải trí tổng hợp", "Phim truyện HTV7", "https://live.fptplay53.net/epzhd1/htv7hd_vhls.smil/chunklist_b5000000.m3u8"),
    ("htv9", "HTV9 HD", "HTV", "truyen-hinh", "🏙️", True, "Tin tức & Phim", "Phim truyện HTV9", "https://live.fptplay53.net/epzhd1/htv9hd_vhls.smil/chunklist.m3u8"),
    ("thvl1", "THVL1 HD", "THVL", "dia-phuong", "🌿", True, "Vĩnh Long 1 HD", "Phim truyện THVL", "https://live.fptplay53.net/epzhd2/vinhlong1_vhls.smil/chunklist_b5000000.m3u8"),
    ("antv", "ANTV HD", "ANTV", "tin-tuc", "🚔", True, "An ninh & Pháp luật", "Tin tức 24/7", "https://liveh12.vtvprime.vn/hls/ANNINHTV/index.m3u8"),
]

# ── Sports Channels ────────────────────────────────────────────────────────────
_SPORTS_CHANNELS = [
    # NBA - Nguồn TrucTiepNBA (Mới nhất)
    ("nba-prime-1", "NBA Prime 1", "TRUCTIEPNBA", "bong-ro", "🏀", True, "Trực tiếp NBA — Server 1", "Sự kiện sắp diễn ra", "https://cc.bluecdn.link/prime1/playlist.m3u8"),
    ("nba-prime-2", "NBA Prime 2", "TRUCTIEPNBA", "bong-ro", "🏀", True, "Trực tiếp NBA — Server 2", "Sự kiện sắp diễn ra", "https://cc.bluecdn.link/prime2/playlist.m3u8"),
    ("nba-prime-3", "NBA Prime 3", "TRUCTIEPNBA", "bong-ro", "🏀", True, "Trực tiếp NBA — Server 3", "Sự kiện sắp diễn ra", "https://cc.bluecdn.link/prime3/playlist.m3u8"),
    
    # NBA Official & Fallback
    ("nba-tv", "NBA TV Official", "NBA", "bong-ro", "🏀", True, "NBA Regular Season", "NBA Highlights", "https://fl1.moveonjoy.com/NBA_TV/index.m3u8"),
    ("fox-sports-1", "FOX Sports 1", "FOX", "bong-ro", "🏀", True, "NCAA & NBA", "Sports Center", "https://fl7.moveonjoy.com/FOX_Sports_1/index.m3u8"),
    
    # K+ Sport
    ("kplus-sport-1", "K+ SPORT 1 HD", "KPLUS", "bong-da", "⚽", True, "Ngoại Hạng Anh & NBA", "Bình luận bóng đá", "https://pepsi.abntv.live/hls/4spstream.m3u8"),
    ("kplus-sport-2", "K+ SPORT 2 HD", "KPLUS", "dua-xe", "🏎️", True, "Formula 1 & Tennis", "Đua xe rực lửa", "https://pepsi3.abntv.live/hls/psp3.m3u8"),
    
    # Football / Other
    ("bein-xtra", "BeIN Sports Xtra", "BEIN", "bong-da", "⚽", True, "Live Football", "Xtra Sports", "https://amg01334-beinsportsllc-beinxtra-localnow-kcy6r.amagi.tv/playlist.m3u8"),
    ("setanta-1", "Setanta Sports 1", "SETANTA", "bong-da", "🏆", True, "European Football", "Sports News", "https://vod.splay.uz/live_splay/original/Setanta1HD/tracks-v1a1/mono.m3u8"),
    ("mutv", "MUTV HD", "MUTV", "bong-da", "⚽", True, "Man Utd TV", "Inside United", "https://mu.live.moveonjoy.com/MUTV/index.m3u8"),
    ("t-sports", "T Sports Live", "TSPORTS", "tong-hop", "🏆", True, "Multi-sports", "Events", "https://lb1-live-mv.v2h-cdn.com/hls/ffef/tsport/tsport.m3u8"),
]

# ── Group meta ────────────────────────────────────────────────────────────────
_GROUP_LABELS = {
    "truyen-hinh": "Truyền hình",
    "phim-truyen": "Phim truyện",
    "tin-tuc":     "Tin tức",
    "dia-phuong":  "Địa phương",
    "thieu-nhi":   "Thiếu nhi",
    "quoc-te":     "Quốc tế",
    "bong-da":     "Bóng đá",
    "bong-ro":     "Bóng rổ",
    "tennis":      "Quần vợt",
    "dua-xe":      "Đua xe",
    "tong-hop":    "Tổng hợp",
}

_NETWORK_LABELS = {
    "VTV":    "VTV — Quốc gia",
    "HTV":    "HTV — TP.HCM",
    "HBO":    "HBO",
    "CINEMAX":"Cinemax",
    "KPLUS":  "K+ Television",
    "TRUCTIEPNBA": "TrucTiepNBA",
    "NBA":    "NBA TV",
    "FOX":    "FOX Sports",
    "NATGEO": "Nat Geo",
    "DISCOVERY":"Discovery",
    "DISNEY": "Disney",
}

def _get_color(network: str, group: str) -> str:
    group_color_map = {
        "phim-truyen": "#e11d48",
        "bong-da":     "#dc2626",
        "bong-ro":     "#ea580c",
        "truyen-hinh": "#7c3aed",
    }
    network_color_map = {
        "VTV":  "#1d4ed8",
        "HTV":  "#7c3aed",
        "TRUCTIEPNBA": "#f59e0b",
        "KPLUS":"#dc2626",
    }
    return network_color_map.get(network, group_color_map.get(group, "#525252"))

def _channel_to_movie(ch: tuple) -> MovieInfo:
    cid, name, network, group, emoji, is_hd, prog_now, prog_next, _ = ch
    return MovieInfo(
        id=cid, slug=cid, title=name, original_title=prog_now,
        poster_url="", thumb_url="", description=f"Đang phát: {prog_now}\nTiếp theo: {prog_next}",
        year=None, quality="HD" if is_hd else "SD", lang="VI", type="live", is_cinema=False,
        episodes=[EpisodeInfo(id="live", name="Trực tiếp", slug="live")],
    )

class SportLivePlugin(BaseSourcePlugin):
    @property
    def id(self) -> str: return "sport_live"
    @property
    def name(self) -> str: return "CINEVINA Live"
    @property
    def priority(self) -> int: return 99
    @property
    def enabled(self) -> bool: return True

    def get_channels(self, type: Optional[str] = None, group: Optional[str] = None, network: Optional[str] = None) -> List[dict]:
        source_list = _SPORTS_CHANNELS if type == 'sport' else (_CHANNELS if type == 'live' else _CHANNELS + _SPORTS_CHANNELS)
        channels = []
        for ch in source_list:
            cid, cname, cnetwork, cgroup, emoji, is_hd, prog_now, prog_next, stream_url = ch
            if group and cgroup != group: continue
            if network and cnetwork.upper() != network.upper(): continue
            channels.append({
                "id": cid, "name": cname, "network": cnetwork,
                "network_label": _NETWORK_LABELS.get(cnetwork, cnetwork),
                "group": cgroup, "group_label": _GROUP_LABELS.get(cgroup, cgroup),
                "emoji": emoji, "is_hd": is_hd, "logo_url": _LOGOS.get(cid, ""),
                "program_now": prog_now, "program_next": prog_next, "stream_url": stream_url,
                "color": _get_color(cnetwork, cgroup),
            })
        return channels

    def get_networks(self) -> List[dict]:
        seen = {}
        for ch in _CHANNELS + _SPORTS_CHANNELS:
            _, _, network, group, _, _, _, _, _ = ch
            if network not in seen:
                seen[network] = {"id": network, "label": _NETWORK_LABELS.get(network, network), "color": _get_color(network, group), "count": 0}
            seen[network]["count"] += 1
        return list(seen.values())

    async def get_movies(self, category: str, page: int = 1, **kwargs) -> List[MovieInfo]:
        return [_channel_to_movie(ch) for ch in _CHANNELS + _SPORTS_CHANNELS]

    async def search(self, keyword: str, page: int = 1) -> List[MovieInfo]:
        kw = keyword.lower()
        return [_channel_to_movie(ch) for ch in _CHANNELS + _SPORTS_CHANNELS if kw in ch[1].lower()]

    async def get_movie_detail(self, slug: str) -> Optional[MovieInfo]:
        for ch in _CHANNELS + _SPORTS_CHANNELS:
            if ch[0] == slug: return _channel_to_movie(ch)
        return None

    async def get_stream(self, movie_slug: str, episode_slug: str) -> Optional[StreamInfo]:
        for ch in _CHANNELS + _SPORTS_CHANNELS:
            if ch[0] == movie_slug: return StreamInfo(url=ch[8], type="hls", quality="HD" if ch[5] else "SD")
        return None

    async def get_by_category(self, slug: str, page: int = 1, **filters) -> dict: return {"items": [], "total": 0, "page": page}
    async def get_by_country(self, slug: str, page: int = 1, **filters) -> dict: return {"items": [], "total": 0, "page": page}
