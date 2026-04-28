"""
Sport Live Plugin — CINEVINA
Cung cấp danh sách 60+ kênh truyền hình Việt Nam, Thể thao quốc tế và NBA từ TrucTiepNBA.
Nguồn stream ổn định cập nhật 2024.
"""
from typing import List, Optional
import httpx
from bs4 import BeautifulSoup
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
    ("vtv7", "VTV7 HD", "VTV", "truyen-hinh", "🎓", True, "Giáo dục Quốc gia", "Học cùng VTV7", "https://live.fptplay53.net/fnxhd1/vtv7hd_vhls.smil/chunklist.m3u8"),
    ("vtv8", "VTV8 HD", "VTV", "truyen-hinh", "🌅", True, "Miền Trung - Tây Nguyên", "Văn hóa khu vực", "https://live.fptplay53.net/epzhd1/vtv8hd_vhls.smil/chunklist.m3u8"),
    ("vtv9", "VTV9 HD", "VTV", "truyen-hinh", "🌴", True, "Tin tức Phía Nam", "Phim truyện VTV9", "https://live.fptplay53.net/fnxhd1/vtv9_vhls.smil/chunklist.m3u8"),
    
    # HTV / THVL / Dia phuong
    ("htv1", "HTV1", "HTV", "truyen-hinh", "🇻🇳", False, "Thông tin công cộng", "HTV1", "https://vc.101vn.com/htv/htvcmb.php?id=2631"),
    ("htv3", "HTV3", "HTV", "thieu-nhi", "🧸", False, "Phim & Thiếu nhi", "DreamsTV", "https://vc.101vn.com/htv/htvcmb.php?id=2535"),
    ("htv7", "HTV7 HD", "HTV", "truyen-hinh", "🎬", True, "Giải trí tổng hợp", "Phim truyện HTV7", "https://live.fptplay53.net/epzhd1/htv7hd_vhls.smil/chunklist_b5000000.m3u8"),
    ("htv9", "HTV9 HD", "HTV", "truyen-hinh", "🏙️", True, "Tin tức & Phim", "Phim truyện HTV9", "https://live.fptplay53.net/epzhd1/htv9hd_vhls.smil/chunklist.m3u8"),
    ("htv-key", "HTV Key", "HTV", "truyen-hinh", "📚", True, "Giáo dục & Kiến thức", "HTV Key", "https://liveh12.vtvprime.vn/hls/HTVKey/index.m3u8"),
    ("thvl1", "THVL1 HD", "THVL", "dia-phuong", "🌿", True, "Vĩnh Long 1 HD", "Phim truyện THVL", "https://live.fptplay53.net/epzhd2/vinhlong1_vhls.smil/chunklist_b5000000.m3u8"),
    ("antv", "ANTV HD", "ANTV", "tin-tuc", "🚔", True, "An ninh & Pháp luật", "Tin tức 24/7", "https://liveh12.vtvprime.vn/hls/ANNINHTV/index.m3u8"),
    ("dong-thap", "Đồng Tháp TV", "THDT", "dia-phuong", "🌾", True, "Đài PT-TH Đồng Tháp", "Tin tức", "https://liveh34.vtvprime.vn/hls/DONGTHAPTV/index.m3u8"),
    ("ha-tinh", "Hà Tĩnh TV", "HTTV", "dia-phuong", "🏞️", True, "Đài PT-TH Hà Tĩnh", "Tin tức", "https://wse.hatinhtv.net/live/httv1/chunklist.m3u8"),
]

# ── Sports Channels ────────────────────────────────────────────────────────────
_SPORTS_CHANNELS = [
    # Kênh Thể thao Quốc gia (100% Ổn định)
    ("vtv5-the-thao", "VTV5 Quốc Gia", "VTV", "bong-da", "⚽", True, "Thể thao & Bóng đá", "Trực tiếp", "https://live-a.fptplay53.net/live/media/VTV5HD/live_hls_avc/index.m3u8"),
    ("htv-the-thao", "HTV Thể Thao", "HTV", "bong-da", "⚽", True, "Thể thao Việt Nam", "Thể thao", "https://live.fptplay53.net/epzhd1/htvcthethao_vhls.smil/chunklist.m3u8"),
    ("on-sports", "On Sports", "VTVCab", "bong-da", "⚽", True, "Trực tiếp bóng đá", "On Sports", "https://liveh12.vtvprime.vn/hls/ONSPORTS/index.m3u8"),
    
    # Kênh NBA / Bóng rổ
    ("nba-prime-1", "NBA Prime 1", "TRUCTIEPNBA", "bong-ro", "🏀", True, "Trực tiếp NBA — Server 1", "Sự kiện sắp diễn ra", "https://cc.bluecdn.link/prime1/playlist.m3u8"),
    ("nba-prime-2", "NBA Prime 2", "TRUCTIEPNBA", "bong-ro", "🏀", True, "Trực tiếp NBA — Server 2", "Sự kiện sắp diễn ra", "https://cc.bluecdn.link/prime2/playlist.m3u8"),
    
    # Kênh Thể thao Quốc tế (Public M3U8)
    ("red-bull-tv", "Red Bull TV", "REDBULL", "the-thao-mao-hiem", "🏂", True, "Thể thao mạo hiểm", "Live Events", "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master_3360.m3u8"),
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
    
async def _scrape_bunchatv() -> List[dict]:
    """Scrapes match metadata from bunchatv4.net (without resolving m3u8 yet)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://bunchatv4.net/",
    }
    channels = []
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get("https://bunchatv4.net/", headers=headers, follow_redirects=True)
            if resp.status_code != 200:
                return []
                
        soup = BeautifulSoup(resp.text, 'html.parser')
        cards = soup.find_all('div', class_='link-match-full')
        
        for div in cards:
            a_tag = div.find('a', class_='link-match-main')
            if not a_tag or 'href' not in a_tag.attrs:
                continue
                
            href = a_tag['href']
            # Reconstruct the slug: substitute '/' with '|'
            slug_encoded = f"buncha_{href.replace('/', '|')}"
            
            # Extract time
            span_time = div.find('div', class_='span-time')
            time_str = span_time.get_text(strip=True) if span_time else "Đang diễn ra"
            
            # Extract tournament
            name_tour = div.find('div', class_='name-tour')
            tour_str = name_tour.get_text(strip=True) if name_tour else "Thể thao"
            
            # Extract teams
            club_left = div.find('div', class_='club-left')
            team_left = club_left.find('div', class_='name-club').get_text(strip=True) if club_left and club_left.find('div', class_='name-club') else "Đội nhà"
            
            club_right = div.find('div', class_='club-right')
            team_right = club_right.find('div', class_='name-club').get_text(strip=True) if club_right and club_right.find('div', class_='name-club') else "Đội khách"
            
            match_name = f"{team_left} vs {team_right}"
            
            # Extract first logo
            logo_url = ""
            if club_left:
                img_tag = club_left.find('img')
                if img_tag and 'src' in img_tag.attrs:
                    logo_url = img_tag['src']
            
            # Deduce sport type
            sport_type = "bong-da"
            sport_label = "Bóng đá"
            emoji = "⚽"
            
            # Check for specific sport images or leagues
            images = div.find_all('img')
            for img in images:
                src = img.get('src', '').lower()
                alt = img.get('alt', '').lower()
                
                if 'tennis' in src or 'tennis' in alt:
                    sport_type = 'tennis'
                    sport_label = 'Tennis'
                    emoji = '🎾'
                    break
                elif 'basket' in src or 'basket' in alt or 'bong-ro' in src or 'bong-ro' in alt:
                    sport_type = 'bong-ro'
                    sport_label = 'Bóng rổ'
                    emoji = '🏀'
                    break
                elif 'volleyball' in src or 'bong-chuyen' in src or 'bong-chuyen' in alt:
                    sport_type = 'bong-chuyen'
                    sport_label = 'Bóng chuyền'
                    emoji = '🏐'
                    break
                elif 'badminton' in src or 'cau-long' in src or 'cau-long' in alt:
                    sport_type = 'cau-long'
                    sport_label = 'Cầu lông'
                    emoji = '🏸'
                    break
                elif 'billiards' in src or 'bida' in src or 'bida' in alt:
                    sport_type = 'billiards'
                    sport_label = 'Billiards'
                    emoji = '🎱'
                    break
                elif 'pingpong' in src or 'bong-ban' in src or 'bong-ban' in alt:
                    sport_type = 'bong-ban'
                    sport_label = 'Bóng bàn'
                    emoji = '🏓'
                    break
                elif 'esport' in src or 'esport' in alt:
                    sport_type = 'esport'
                    sport_label = 'Esport'
                    emoji = '🎮'
                    break
                elif 'martial' in src or 'vo-thuat' in alt:
                    sport_type = 'vo-thuat'
                    sport_label = 'Võ thuật'
                    emoji = '🥊'
                    break

            # Fallback based on text match
            if sport_type == "bong-da":
                low_tour = tour_str.lower()
                low_href = href.lower()
                low_name = match_name.lower()
                
                if 'tennis' in low_tour or 'tennis' in low_href or 'tennis' in low_name or 'wta' in low_tour or 'atp' in low_tour:
                    sport_type, sport_label, emoji = 'tennis', 'Tennis', '🎾'
                elif 'bóng rổ' in low_tour or 'nba' in low_tour or 'bong-ro' in low_href or 'basketball' in low_tour or 'basketball' in low_name:
                    sport_type, sport_label, emoji = 'bong-ro', 'Bóng rổ', '🏀'
                elif 'bóng chuyền' in low_tour or 'bong-chuyen' in low_href or 'volleyball' in low_tour or 'volleyball' in low_name:
                    sport_type, sport_label, emoji = 'bong-chuyen', 'Bóng chuyền', '🏐'
                elif 'cầu lông' in low_tour or 'cau-long' in low_href or 'badminton' in low_tour or 'badminton' in low_name:
                    sport_type, sport_label, emoji = 'cau-long', 'Cầu lông', '🏸'
                elif 'billiards' in low_tour or 'bida' in low_tour or 'billiards' in low_href or 'snooker' in low_tour or 'pool' in low_tour:
                    sport_type, sport_label, emoji = 'billiards', 'Billiards', '🎱'
                elif 'bóng bàn' in low_tour or 'bong-ban' in low_href or 'table tennis' in low_tour or 'table tennis' in low_name:
                    sport_type, sport_label, emoji = 'bong-ban', 'Bóng bàn', '🏓'
                elif 'esport' in low_tour or 'esport' in low_href or 'lien minh' in low_name or 'dota' in low_name:
                    sport_type, sport_label, emoji = 'esport', 'Esport', '🎮'
                elif 'võ thuật' in low_tour or 'mma' in low_tour or 'ufc' in low_tour or 'boxing' in low_tour:
                    sport_type, sport_label, emoji = 'vo-thuat', 'Võ thuật', '🥊'
                elif 'golf' in low_tour or 'golf' in low_href or 'golf' in low_name:
                    sport_type, sport_label, emoji = 'golf', 'Golf', '⛳'
                elif 'đua xe' in low_tour or 'dua-xe' in low_href or 'racing' in low_tour or 'f1' in low_tour or 'motogp' in low_tour:
                    sport_type, sport_label, emoji = 'dua-xe', 'Đua xe', '🏎️'

            channels.append({
                "id": slug_encoded,
                "name": match_name,
                "network": "BUNCHATV",
                "network_label": "Bún Chả TV",
                "group": sport_type,
                "group_label": sport_label,
                "emoji": emoji,
                "is_hd": True,
                "logo_url": logo_url,
                "program_now": f"{tour_str} ({time_str})",
                "program_next": "Kết thúc trận đấu",
                "stream_url": f"/api/live/stream/{slug_encoded}", 
                "color": "#e11d48",
            })
            
    except Exception as e:
        print(f"[bunchatv] Scrape error: {str(e)}")
        
    return channels

class SportLivePlugin(BaseSourcePlugin):
    @property
    def id(self) -> str: return "sport_live"
    @property
    def name(self) -> str: return "CINEVINA Live"
    @property
    def priority(self) -> int: return 99
    @property
    def enabled(self) -> bool: return True

    async def get_channels(self, type: Optional[str] = None, group: Optional[str] = None, network: Optional[str] = None) -> List[dict]:
        source_list = [] if type == 'sport' else (_CHANNELS + _SPORTS_CHANNELS if type == 'live' else _CHANNELS + _SPORTS_CHANNELS)
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
            
        # Dynamically append BunchaTV matches for sports
        if type == 'sport' or (type != 'live' and not group):
            buncha_channels = await _scrape_bunchatv()
            if group:
                buncha_channels = [c for c in buncha_channels if c['group'] == group]
            if network:
                buncha_channels = [c for c in buncha_channels if c['network'].upper() == network.upper()]
            channels.extend(buncha_channels)
            
        return channels

    async def get_networks(self) -> List[dict]:
        seen = {}
        for ch in _CHANNELS + _SPORTS_CHANNELS:
            _, _, network, group, _, _, _, _, _ = ch
            if network not in seen:
                seen[network] = {"id": network, "label": _NETWORK_LABELS.get(network, network), "color": _get_color(network, group), "count": 0}
            seen[network]["count"] += 1
            
        # Dynamically append BUNCHATV count
        buncha_channels = await _scrape_bunchatv()
        if buncha_channels:
            seen["BUNCHATV"] = {
                "id": "BUNCHATV",
                "label": "Bún Chả TV",
                "color": "#e11d48",
                "count": len(buncha_channels)
            }
            
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
        if movie_slug.startswith('buncha_'):
            # Reconstruct original path
            path = movie_slug.replace('buncha_', '').replace('|', '/')
            url = f"https://bunchatv4.net{path}"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Referer": "https://bunchatv4.net/",
            }
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(url, headers=headers, follow_redirects=True)
                    if resp.status_code == 200:
                        soup = BeautifulSoup(resp.text, 'html.parser')
                        
                        fileurl = None
                        channel = None
                        for div in soup.find_all('div', class_='box-chose-stream'):
                            if not fileurl:
                                f_url = div.get('data-fileurl', '')
                                if f_url and f_url.startswith('http'):
                                    fileurl = f_url
                            if not channel:
                                c_url = div.get('data-channel', '')
                                if c_url and c_url.startswith('http'):
                                    channel = c_url
                                    
                        if fileurl:
                            return StreamInfo(
                                url=f"/api/proxy/stream?url={fileurl}",
                                type="hls",
                                quality="HD",
                                embed_url=channel
                            )
                        elif channel:
                            return StreamInfo(url=channel, type="embed", quality="HD")
            except Exception as e:
                import traceback
                print(f"[bunchatv] Stream extraction error: {repr(e)}")
                traceback.print_exc()
            return None
            
        for ch in _CHANNELS + _SPORTS_CHANNELS:
            if ch[0] == movie_slug: return StreamInfo(url=ch[8], type="hls", quality="HD" if ch[5] else "SD")
        return None

    async def get_by_category(self, slug: str, page: int = 1, **filters) -> dict: return {"items": [], "total": 0, "page": page}
    async def get_by_country(self, slug: str, page: int = 1, **filters) -> dict: return {"items": [], "total": 0, "page": page}
