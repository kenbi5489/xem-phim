"""
CINEVINA — Movies Router
Hệ thống nguồn phim đa nguồn (Multi-Source Streaming System):
1. Nguồn C (phim.nguonc.com): Nguồn phim uy tín cộng đồng với đa dạng server Vietsub, Thuyết minh, Lồng tiếng chất lượng cao.
2. KKPhim (phimapi.com): Máy chủ luồng trực tiếp HLS (m3u8) tốc độ cao.
"""
import re
import unicodedata
import asyncio
from typing import Optional, List, Any, Dict
import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/movies", tags=["movies"])

KKPHIM_BASE = "https://phimapi.com"
NGUONC_BASE = "https://phim.nguonc.com/api"

# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def parse_series_info(name: str):
    """
    Parse title to extract base_name, series_id, and season_number.
    E.g. 'Danh Dự (Phần 1)' -> 'Danh Dự', 'danh-du', 1
    """
    if not name:
        return name, None, 1
        
    pattern = r'(?i)\s*(?:\(|-)?\s*(?:Phần|Season)\s*(\d+)\s*(?:\))?$'
    match = re.search(pattern, name)
    
    if match:
        season_number = int(match.group(1))
        base_name = name[:match.start()].strip()
        s = unicodedata.normalize('NFKD', base_name).encode('ascii', 'ignore').decode('utf-8').lower()
        series_id = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
        return base_name, series_id, season_number
        
    return name, None, 1


def normalize_kkphim_image_url(url: Optional[str]) -> str:
    """KKPhim trả ảnh CDN thực tế là phimimg.com."""
    if not url:
        return ""
    s = str(url).strip()
    return (
        s
        .replace("https://phimapi.com/upload/", "https://phimimg.com/upload/")
        .replace("http://phimapi.com/upload/", "https://phimimg.com/upload/")
    )


def _fix_image(path: Optional[str]) -> str:
    """Chuẩn hoá link ảnh poster / thumb."""
    if not path:
        return ""
    
    normalized = normalize_kkphim_image_url(path)
    if not normalized:
        return ""
        
    if "proxy/image" in normalized:
        return normalized
        
    if not normalized.startswith("http"):
        return f"https://phimimg.com/{normalized.lstrip('/')}"
        
    return normalized


def normalize_quality(*sources: Optional[str]) -> str:
    """Chuẩn hóa chất lượng video từ nhiều nguồn: 4K > FHD > HD > CAM > SD."""
    combined = " ".join(str(s).upper() for s in sources if s)
    
    if any(k in combined for k in ["4K", "UHD", "2160", "2160P", "4096", "ULTRAHD", "ULTRA HD", "HDR10", "DOLBY VISION"]):
        return "4K"
    if any(k in combined for k in ["FHD", "1080", "FULL HD", "FULLHD", "1080P"]):
        return "FHD"
    if any(k in combined for k in ["HD", "720", "720P"]):
        return "HD"
    if any(k in combined for k in ["CAM", "TS", "TC", "BẢN CAM"]):
        return "CAM"
    if any(k in combined for k in ["SD", "480", "360"]):
        return "SD"
    return "HD"


def _clean_text_for_fingerprint(text: str) -> str:
    """Chuẩn hoá chuỗi để so sánh phim trùng lặp."""
    if not text:
        return ""
    s = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode('utf-8').lower()
    s = re.sub(r'[\(\[]?\b(19\d\d|20\d\d)\b[\)\]]?', ' ', s)
    s = re.sub(r'\b(phan|season|ss)\s*\d+\b', ' ', s)
    s = re.sub(r'\b(thuyet minh|vietsub|long tieng|ban cam|cam|hd|fhd|4k|raw)\b', ' ', s)
    s = re.sub(r'[^a-z0-9]+', ' ', s).strip()
    return re.sub(r'\s+', ' ', s)


def _clean_slug_for_fingerprint(slug: str) -> str:
    """Loại bỏ các hậu tố thường thấy trong slug."""
    if not slug:
        return ""
    s = slug.lower().strip()
    s = re.sub(r'-(19\d\d|20\d\d)$', '', s)
    s = re.sub(r'-(vietsub|thuyet-minh|long-tieng|ban-cam|cam|full|tap-full)$', '', s)
    return s.strip('-')


def _quality_score(quality: Optional[str]) -> int:
    q = (quality or "").upper()
    if any(k in q for k in ["4K", "UHD", "2160"]):
        return 5
    if any(k in q for k in ["FHD", "1080"]):
        return 4
    if any(k in q for k in ["HD", "720"]):
        return 3
    if any(k in q for k in ["SD", "480", "360"]):
        return 2
    if "CAM" in q:
        return 1
    return 3


def _merge_and_dedup(items1: list, items2: list) -> list:
    """
    Gộp 2 danh sách phim từ KKPhim và NguonC, loại bỏ triệt để phim trùng lặp.
    Ưu tiên bản có poster, bản phát được (streamable), chất lượng cao hơn.
    """
    merged: list = []
    fp_to_index: dict = {}

    for item in items1 + items2:
        slug = item.get("slug", "").strip()
        norm_slug = _clean_slug_for_fingerprint(slug)
        title_fp = _clean_text_for_fingerprint(item.get("title") or item.get("base_title") or "")
        orig_fp = _clean_text_for_fingerprint(item.get("original_title") or "")
        year = str(item.get("year") or "").strip()
        orig_with_year = f"{orig_fp}_{year}" if orig_fp and year else ""

        matched_idx = None
        for fp in [slug, norm_slug, title_fp, orig_with_year]:
            if fp and fp in fp_to_index:
                matched_idx = fp_to_index[fp]
                break

        if matched_idx is None:
            idx = len(merged)
            merged.append(item)
            if slug: fp_to_index[slug] = idx
            if norm_slug: fp_to_index[norm_slug] = idx
            if title_fp and len(title_fp) >= 3: fp_to_index[title_fp] = idx
            if orig_with_year and len(orig_fp) >= 3: fp_to_index[orig_with_year] = idx
        else:
            existing = merged[matched_idx]
            curr_is_stream = bool(item.get("is_streamable", True))
            exist_is_stream = bool(existing.get("is_streamable", True))
            curr_score = _quality_score(item.get("quality"))
            exist_score = _quality_score(existing.get("quality"))

            replace = False
            if curr_is_stream and not exist_is_stream:
                replace = True
            elif not curr_is_stream and exist_is_stream:
                replace = False
            elif curr_score > exist_score:
                replace = True
            elif not existing.get("poster_url") and item.get("poster_url"):
                replace = True

            if replace:
                # Merge source tag info
                merged[matched_idx] = item
                if slug: fp_to_index[slug] = matched_idx
                if norm_slug: fp_to_index[norm_slug] = matched_idx

    return merged


def _group_items(items: list) -> list:
    """Gom nhóm các phim thuộc cùng 1 series trên danh sách, giữ lại phần mới nhất."""
    grouped = {}
    for item in items:
        sid = item.get("series_id")
        if sid:
            if sid not in grouped or item["season_number"] > grouped[sid]["season_number"]:
                grouped[sid] = item
        else:
            grouped[item["id"]] = item
    return list(grouped.values())


# ─────────────────────────────────────────
# COUNTRY & INTENT HELPERS
# ─────────────────────────────────────────

COUNTRY_MAPPING = [
    ("Hàn Quốc", "han-quoc", ["hàn quốc", "han quoc", "korea", "south korea", "kr"]),
    ("Trung Quốc", "trung-quoc", ["trung quốc", "trung quoc", "china", "cn", "hoa ngữ", "hoa ngu"]),
    ("Âu Mỹ", "au-my", ["âu mỹ", "au my", "mỹ", "my", "hoa kỳ", "united states", "usa", "us"]),
    ("Nhật Bản", "nhat-ban", ["nhật bản", "nhat ban", "nhật", "nhat", "japan", "jp"]),
    ("Thái Lan", "thai-lan", ["thái lan", "thai lan", "thái", "thai", "thailand", "th"]),
    ("Việt Nam", "viet-nam", ["việt nam", "viet nam", "việt", "viet", "vietnam", "vn"]),
    ("Đài Loan", "dai-loan", ["đài loan", "dai loan", "taiwan", "tw"]),
    ("Ấn Độ", "an-do", ["ấn độ", "an do", "india", "in", "bollywood"]),
    ("Hồng Kông", "hong-kong", ["hồng kông", "hong kong", "hongkong", "hk"]),
    ("Anh", "anh", ["anh", "uk", "united kingdom"]),
    ("Pháp", "phap", ["pháp", "phap", "france"]),
]


def normalize_country(country_name: str, country_slug: str = "") -> tuple[str, str]:
    """Chuẩn hóa tên quốc gia và slug tương ứng."""
    c_name = (country_name or "").strip()
    c_slug = (country_slug or "").strip().lower()

    if c_slug:
        for name, slug, _ in COUNTRY_MAPPING:
            if c_slug == slug:
                return name, slug

    combined = f"{c_name} {c_slug}".lower()
    for name, slug, aliases in COUNTRY_MAPPING:
        if any(alias in combined for alias in aliases):
            return name, slug

    return c_name, c_slug


def parse_search_intent(query: str):
    """
    Phân tích ý định tìm kiếm tiếng Việt:
    VD: 'phim bộ hàn quốc' -> category='phim-bo', country='han-quoc', clean_keyword=''
    VD: 'phim lẻ trung quốc' -> category='phim-le', country='trung-quoc', clean_keyword=''
    VD: 'phim bộ hàn quốc chàng hậu' -> category='phim-bo', country='han-quoc', clean_keyword='chàng hậu'
    """
    q = (query or "").strip().lower()

    detected_category = None
    detected_country = None

    # 1. Detect Category / Type
    if re.search(r'\b(phim\s+bộ|phim\s+bo|series)\b', q):
        detected_category = "phim-bo"
        q = re.sub(r'\b(phim\s+bộ|phim\s+bo|series)\b', ' ', q)
    elif re.search(r'\b(phim\s+lẻ|phim\s+le|movie)\b', q):
        detected_category = "phim-le"
        q = re.sub(r'\b(phim\s+lẻ|phim\s+le|movie)\b', ' ', q)
    elif re.search(r'\b(hoạt\s+hình|hoat\s+hinh|anime)\b', q):
        detected_category = "hoat-hinh"
        q = re.sub(r'\b(phim\s+)?(hoạt\s+hình|hoat\s+hinh|anime)\b', ' ', q)

    # 2. Detect Country
    country_patterns = [
        ("han-quoc", r'\b(hàn\s*quốc|han\s*quoc|hàn|korea)\b'),
        ("trung-quoc", r'\b(trung\s*quốc|trung\s*quoc|hoa\s*ngữ|hoa\s*ngu|trung)\b'),
        ("au-my", r'\b(âu\s*mỹ|au\s*my|mỹ|hollywood|hoa\s*kỳ|us)\b'),
        ("nhat-ban", r'\b(nhật\s*bản|nhat\s*ban|nhật|japan)\b'),
        ("thai-lan", r'\b(thái\s*lan|thai\s*lan|thái|thailand)\b'),
        ("viet-nam", r'\b(việt\s*nam|viet\s*nam|việt)\b'),
        ("dai-loan", r'\b(đài\s*loan|dai\s*loan|đài)\b'),
        ("an-do", r'\b(ấn\s*độ|an\s*do|bolliwood|bollywood)\b'),
        ("hong-kong", r'\b(hồng\s*kông|hong\s*kong|hongkong)\b'),
        ("anh", r'\b(nước\s*anh|phim\s*anh)\b'),
        ("phap", r'\b(nước\s*pháp|phim\s*phap)\b'),
    ]
    for c_slug, pattern in country_patterns:
        if re.search(pattern, q):
            detected_country = c_slug
            q = re.sub(pattern, ' ', q)
            break

    # Clean generic filler words
    q = re.sub(r'\b(phim|xem|hay|moi|mới|full|hd|vietsub|thuyết\s*minh|thuyet\s*minh)\b', ' ', q)
    clean_keyword = re.sub(r'\s+', ' ', q).strip()

    return detected_category, detected_country, clean_keyword


# ─────────────────────────────────────────
# SOURCE ADAPTERS
# ─────────────────────────────────────────

def _map_kkphim_item(item: dict, path_image: str = "") -> dict:
    """Map 1 item từ KKPhim listing → CINEVINA format."""
    cr = item.get("country") or []
    if isinstance(cr, list) and cr:
        c0 = cr[0]
        country_name = c0.get("name", "") if isinstance(c0, dict) else str(c0)
        country_slug = c0.get("slug", "") if isinstance(c0, dict) else ""
    elif isinstance(cr, str):
        country_name, country_slug = cr, ""
    else:
        country_name = country_slug = ""

    country_name, country_slug = normalize_country(country_name, country_slug)

    cat_raw = item.get("category") or []
    if isinstance(cat_raw, list):
        genres = [
            {"name": c.get("name", ""), "slug": c.get("slug", "")}
            for c in cat_raw if isinstance(c, dict)
        ]
        cat_str = ", ".join(g["name"] for g in genres)
    else:
        genres, cat_str = [], (str(cat_raw) if cat_raw else "")

    mod = item.get("modified") or {}
    modified_time = mod.get("time", "") if isinstance(mod, dict) else ""

    tmdb_rating = item.get("tmdb") or {}
    rating_val = tmdb_rating.get("vote_average") if isinstance(tmdb_rating, dict) else None

    if rating_val is None or rating_val == 0 or rating_val == "0" or rating_val == 0.0:
        rating_str = "N/A"
    else:
        try:
            r = float(rating_val)
            rating_str = f"{r:.1f}" if r % 1 != 0 else str(int(r))
        except (ValueError, TypeError):
            rating_str = str(rating_val)

    poster_raw = item.get("poster_url") or item.get("poster")
    thumb_raw = item.get("thumb_url") or item.get("thumb")

    if path_image:
        if poster_raw and not str(poster_raw).startswith("http"):
            poster_raw = f"{path_image.rstrip('/')}/{str(poster_raw).lstrip('/')}"
        if thumb_raw and not str(thumb_raw).startswith("http"):
            thumb_raw = f"{path_image.rstrip('/')}/{str(thumb_raw).lstrip('/')}"

    title_raw = item.get("name", "")
    base_title, series_id, season_number = parse_series_info(title_raw)

    return {
        "id":             str(item.get("_id") or item.get("id") or ""),
        "slug":           item.get("slug", ""),
        "title":          title_raw,
        "base_title":     base_title,
        "series_id":      series_id,
        "season_number":  season_number,
        "original_title": item.get("origin_name", ""),
        "poster_url":     _fix_image(poster_raw),
        "thumb_url":      _fix_image(thumb_raw),
        "year":           item.get("year"),
        "quality":        normalize_quality(item.get("quality", "")),
        "lang":           item.get("lang", "Vietsub"),
        "type":           item.get("type", "single"),
        "is_cinema":      bool(item.get("chieurap", False)),
        "is_streamable":  item.get("status") != "trailer",
        "country":        country_name,
        "country_slug":   country_slug,
        "category":       cat_str,
        "genres":         genres,
        "description":    item.get("content", "") or item.get("description", ""),
        "episode_current": str(item.get("episode_current") or ""),
        "episode_total":   str(item.get("episode_total") or ""),
        "rating":         rating_str,
        "modified":       modified_time,
        "source":         "kkphim",
    }


def _map_nguonc_item(item: dict) -> dict:
    """Map 1 item từ NguonC listing → CINEVINA format."""
    title_raw = item.get("name", "")
    base_title, series_id, season_number = parse_series_info(title_raw)

    # Parse rating from tmdb if available
    tmdb_info = item.get("tmdb") or {}
    rating_str = "N/A"

    year_val = item.get("year")
    try:
        year_num = int(year_val) if year_val else None
    except Exception:
        year_num = None

    tot_ep = str(item.get("total_episodes") or "")
    curr_ep = str(item.get("current_episode") or "")

    # Parse country / category from NguonC
    country_name = ""
    country_slug = ""
    cat_raw = item.get("category")
    cat_list = []
    if isinstance(cat_raw, dict):
        for _, grp in cat_raw.items():
            gname = grp.get("group", {}).get("name", "")
            if "Quốc gia" in gname:
                c_list = grp.get("list", [])
                if c_list and isinstance(c_list, list):
                    c0 = c_list[0]
                    if isinstance(c0, dict):
                        country_name = c0.get("name", "")
                        country_slug = c0.get("slug", "")
                    else:
                        country_name = str(c0)
            elif "Thể loại" in gname:
                cat_list = grp.get("list", [])
    elif isinstance(cat_raw, list):
        cat_list = cat_raw

    c_direct = item.get("country")
    if c_direct and not country_name:
        if isinstance(c_direct, dict):
            country_name = c_direct.get("name", "")
            country_slug = c_direct.get("slug", "")
        elif isinstance(c_direct, list) and c_direct:
            c0 = c_direct[0]
            if isinstance(c0, dict):
                country_name = c0.get("name", "")
                country_slug = c0.get("slug", "")
            else:
                country_name = str(c0)
        else:
            country_name = str(c_direct)

    country_name, country_slug = normalize_country(country_name, country_slug)

    # Determine type accurately
    tot_ep_clean = re.sub(r'[^0-9]', '', tot_ep)
    is_series = False
    if tot_ep_clean and int(tot_ep_clean) > 1:
        is_series = True
    elif "tập" in curr_ep.lower() and not ("full" in curr_ep.lower() and not tot_ep_clean):
        is_series = True
    elif item.get("type") in ["series", "phim-bo"]:
        is_series = True
    elif "phần" in title_raw.lower() or "season" in title_raw.lower():
        is_series = True

    return {
        "id":             f"nc_{item.get('slug', '')}",
        "slug":           item.get("slug", ""),
        "title":          title_raw,
        "base_title":     base_title,
        "series_id":      series_id,
        "season_number":  season_number,
        "original_title": item.get("original_name", ""),
        "poster_url":     item.get("poster_url") or item.get("poster_url_webp") or "",
        "thumb_url":      item.get("thumb_url") or item.get("thumb_url_webp") or "",
        "year":           year_num,
        "quality":        normalize_quality(item.get("quality", "HD")),
        "lang":           item.get("language", "Vietsub"),
        "type":           "series" if is_series else "single",
        "is_cinema":      False,
        "is_streamable":  curr_ep.lower() != "trailer",
        "country":        country_name,
        "country_slug":   country_slug,
        "category":       ", ".join(c.get("name", "") if isinstance(c, dict) else str(c) for c in cat_list) if cat_list else "",
        "genres":         cat_list,
        "description":    item.get("description", ""),
        "episode_current": curr_ep,
        "episode_total":   tot_ep,
        "rating":         rating_str,
        "modified":       item.get("modified", ""),
        "source":         "nguonc",
    }


# ─────────────────────────────────────────
# HTTP CLIENT HELPERS
# ─────────────────────────────────────────

async def _kkphim_get(path: str, params: dict) -> dict:
    url = f"{KKPHIM_BASE}{path}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return {}


async def _nguonc_get(path: str, params: dict) -> dict:
    url = f"{NGUONC_BASE}{path}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CINEVINA/2.0"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return {}


async def _fetch_and_merge(
    kk_path: Optional[str],
    nc_path: Optional[str],
    kk_params: dict,
    nc_params: dict,
    page: int,
    limit: int,
    source: str = "all",
    grouped: bool = False,
    category_filter: Optional[str] = None,
    country_filter: Optional[str] = None,
) -> dict:
    """Fetch dữ liệu từ KKPhim và NguonC, sau đó gộp và deduplicate thông minh."""
    tasks = []
    fetch_kk = source in ["all", "kkphim"] and bool(kk_path)
    fetch_nc = source in ["all", "nguonc"] and bool(nc_path)

    if fetch_kk:
        tasks.append(_kkphim_get(kk_path, kk_params))
    else:
        tasks.append(asyncio.sleep(0, result={}))

    if fetch_nc:
        tasks.append(_nguonc_get(nc_path, nc_params))
    else:
        tasks.append(asyncio.sleep(0, result={}))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    kkphim_data = results[0] if isinstance(results[0], dict) else {}
    nguonc_data = results[1] if isinstance(results[1], dict) else {}

    # Map KKPhim
    kk_items_raw = kkphim_data.get("data", {}).get("items", []) or kkphim_data.get("items", [])
    path_image = kkphim_data.get("pathImage", "")
    kk_mapped = [_map_kkphim_item(i, path_image) for i in kk_items_raw]

    # Map NguonC
    nc_items_raw = nguonc_data.get("items", [])
    nc_mapped = [_map_nguonc_item(i) for i in nc_items_raw]

    if source == "kkphim":
        merged_items = kk_mapped
    elif source == "nguonc":
        merged_items = nc_mapped
    else:
        # Gộp cả 2 nguồn, deduplicate
        merged_items = _merge_and_dedup(kk_mapped, nc_mapped)

    # Strict post-filtering to guarantee no mismatched categories or countries leak through
    if category_filter:
        cat_lower = category_filter.lower()
        if cat_lower in ["phim-bo", "series"]:
            def is_series_item(m):
                m_type = (m.get("type") or "").lower()
                tot_ep = str(m.get("episode_total") or "")
                tot_clean = re.sub(r'[^0-9]', '', tot_ep)
                if m_type == "series":
                    return True
                if tot_clean and int(tot_clean) > 1:
                    return True
                if "tập" in str(m.get("episode_current") or "").lower():
                    return True
                return False
            merged_items = [m for m in merged_items if is_series_item(m)]
        elif cat_lower in ["phim-le", "single"]:
            def is_single_item(m):
                m_type = (m.get("type") or "").lower()
                tot_ep = str(m.get("episode_total") or "")
                tot_clean = re.sub(r'[^0-9]', '', tot_ep)
                if m_type == "single":
                    return True
                if tot_clean and int(tot_clean) == 1:
                    return True
                return m_type != "series"
            merged_items = [m for m in merged_items if is_single_item(m)]
        elif cat_lower in ["hoat-hinh", "hoathinh", "anime"]:
            merged_items = [
                m for m in merged_items
                if (m.get("type") or "").lower() in ["hoathinh", "hoat-hinh"]
                or "hoạt hình" in (m.get("category") or "").lower()
                or "anime" in (m.get("category") or "").lower()
            ]

    if country_filter:
        c_target = country_filter.lower().strip()
        def match_country(m):
            c_slug = (m.get("country_slug") or "").lower()
            c_name = (m.get("country") or "").lower()
            if not c_slug and not c_name:
                return True
            if c_slug == c_target:
                return True
            target_slug_clean = c_target.replace('-', ' ')
            if target_slug_clean in c_name or c_slug == c_target.replace('-', ''):
                return True
            return False
        merged_items = [m for m in merged_items if match_country(m)]

    if grouped:
        merged_items = _group_items(merged_items)

    # Tính pagination
    kk_pagination = kkphim_data.get("data", {}).get("params", {}).get("pagination", {}) or kkphim_data.get("pagination", {})
    nc_paginate = nguonc_data.get("paginate", {})

    total_kk = kk_pagination.get("totalItems", 0)
    total_nc = nc_paginate.get("total_items", 0)
    total = max(total_kk, total_nc) or len(merged_items)

    pages_kk = kk_pagination.get("totalPages", 1)
    pages_nc = nc_paginate.get("total_page", 1)
    total_pages = max(pages_kk, pages_nc) or 1

    return {
        "items": merged_items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


# ─────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────

@router.get("/sources/list")
async def get_sources_list():
    """Danh sách các nguồn phim tích hợp trong CINEVINA."""
    return [
        {
            "id": "nguonc",
            "name": "Nguồn C (VIP Sub)",
            "description": "Nguồn phim cộng đồng chất lượng cao, phụ đề Vietsub chuẩn, kèm bản Thuyết minh & Lồng tiếng riêng biệt.",
            "status": "online",
            "badge": "Khuyên dùng"
        },
        {
            "id": "kkphim",
            "name": "KKPhim (HLS Fast)",
            "description": "Máy chủ phát luồng HLS trực tiếp tốc độ cao, hỗ trợ chất lượng Full HD / 4K.",
            "status": "online",
            "badge": "Tốc độ cao"
        }
    ]


GENRE_SLUG_MAP = {
    "giat-gan": "kinh-di",
    "kich-tinh": "tam-ly",
    "kinh-di": "kinh-di",
    "bi-an": "bi-an",
    "tam-ly": "tam-ly",
    "chinh-kich": "chinh-kich",
    "hinh-su": "hinh-su",
    "hanh-dong": "hanh-dong",
    "phieu-luu": "phieu-luu",
    "vo-thuat": "vo-thuat",
    "co-trang": "co-trang",
    "chien-tranh": "chien-tranh",
    "tinh-cam": "tinh-cam",
    "lang-man": "tinh-cam",
    "hai-huoc": "hai-huoc",
    "gia-dinh": "gia-dinh",
    "hoc-duong": "hoc-duong",
    "vien-tuong": "vien-tuong",
    "khoa-hoc": "khoa-hoc",
    "hoat-hinh": "hoat-hinh",
    "anime": "hoat-hinh",
    "than-thoai": "than-thoai",
    "tai-lieu": "tai-lieu",
    "am-nhac": "am-nhac",
}


@router.get("/genres")
async def get_curated_genres():
    """Danh sách thể loại phim chuẩn xác và ổn định."""
    return [
        {"slug": "hanh-dong", "name": "Hành động"},
        {"slug": "tinh-cam", "name": "Tình cảm"},
        {"slug": "hai-huoc", "name": "Hài hước"},
        {"slug": "co-trang", "name": "Cổ trang"},
        {"slug": "tam-ly", "name": "Tâm lý"},
        {"slug": "hinh-su", "name": "Hình sự"},
        {"slug": "chien-tranh", "name": "Chiến tranh"},
        {"slug": "vo-thuat", "name": "Võ thuật"},
        {"slug": "vien-tuong", "name": "Viễn tưởng"},
        {"slug": "phieu-luu", "name": "Phiêu lưu"},
        {"slug": "khoa-hoc", "name": "Khoa học"},
        {"slug": "kinh-di", "name": "Kinh dị"},
        {"slug": "am-nhac", "name": "Âm nhạc"},
        {"slug": "than-thoai", "name": "Thần thoại"},
        {"slug": "gia-dinh", "name": "Gia đình"},
        {"slug": "hoat-hinh", "name": "Hoạt hình"},
        {"slug": "tai-lieu", "name": "Tài liệu"},
        {"slug": "bi-an", "name": "Bí ẩn"},
        {"slug": "hoc-duong", "name": "Học đường"},
        {"slug": "kinh-dien", "name": "Kinh điển"},
    ]


@router.get("/trending")
async def get_trending(limit: int = 10, source: str = "all", grouped: bool = Query(False)):
    """Lấy top phim thịnh hành từ các nguồn uy tín."""
    data = await _fetch_and_merge(
        "/danh-sach/phim-moi-cap-nhat",
        "/films/phim-moi-cap-nhat",
        {"page": 1, "limit": limit},
        {"page": 1},
        page=1,
        limit=limit,
        source=source,
        grouped=grouped
    )
    return data.get("items", [])[:limit]


@router.get("")
async def get_movies(
    category: Optional[str] = None,
    country:  Optional[str] = None,
    genre:    Optional[str] = None,
    year:     Optional[str] = None,
    sort:     str           = "modified.time",
    source:   str           = "all",
    grouped:  bool          = Query(False),
    page:     int           = Query(default=1, ge=1),
    limit:    int           = Query(default=24, ge=1, le=100),
):
    """Lấy danh sách phim có hỗ trợ bộ lọc và chuyển đổi nguồn."""
    kk_params = {"page": page, "limit": limit, "sort_field": sort}
    nc_params = {"page": page}
    if year:
        kk_params["year"] = year

    category_filter = category
    country_filter = country

    # 1. Nếu có category (phim-bo, phim-le, hoat-hinh)
    if category in ["phim-bo", "phim-le", "hoat-hinh"]:
        kk_path = f"/v1/api/danh-sach/{category}"
        nc_path = f"/films/danh-sach/{category}"
        if country:
            kk_params["country"] = country
        if genre:
            target_genre = GENRE_SLUG_MAP.get(genre, genre)
            kk_params["category"] = target_genre
    # 2. Quốc gia
    elif country:
        kk_path = f"/v1/api/quoc-gia/{country}"
        nc_path = f"/films/quoc-gia/{country}"
        if genre:
            target_genre = GENRE_SLUG_MAP.get(genre, genre)
            kk_params["category"] = target_genre
        if category:
            kk_params["category"] = category
    # 3. Thể loại
    elif genre:
        target_genre = GENRE_SLUG_MAP.get(genre, genre)
        kk_path = f"/v1/api/the-loai/{target_genre}"
        nc_path = f"/films/the-loai/{target_genre}"
        if country:
            kk_params["country"] = country
    # 4. Danh mục mặc định
    else:
        cat = category or "phim-moi-cap-nhat"
        if cat == "phim-moi-cap-nhat":
            kk_path = "/danh-sach/phim-moi-cap-nhat"
            nc_path = "/films/phim-moi-cap-nhat"
        else:
            kk_path = f"/v1/api/danh-sach/{cat}"
            nc_path = f"/films/danh-sach/{cat}"

    return await _fetch_and_merge(
        kk_path, nc_path, kk_params, nc_params,
        page, limit, source, grouped,
        category_filter=category_filter,
        country_filter=country_filter
    )


@router.get("/search")
async def search_movies(
    keyword: str = Query(..., min_length=1),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
    source: str = "all",
    grouped: bool = Query(False),
):
    """Tìm kiếm phim thông minh từ cả 2 nguồn KKPhim và NguonC."""
    detected_cat, detected_country, clean_keyword = parse_search_intent(keyword)

    # Nếu câu tìm kiếm là dạng danh mục / quốc gia thuần túy (VD: "phim bộ hàn quốc", "phim lẻ trung quốc")
    if not clean_keyword and (detected_cat or detected_country):
        return await get_movies(
            category=detected_cat,
            country=detected_country,
            page=page,
            limit=limit,
            source=source,
            grouped=grouped
        )

    # Nếu có từ khóa cụ thể (VD: "phim bộ hàn quốc chàng hậu" -> clean_keyword = "chàng hậu")
    search_term = clean_keyword if clean_keyword else keyword
    tasks = []
    if source in ["all", "kkphim"]:
        tasks.append(_kkphim_get("/v1/api/tim-kiem", {"keyword": search_term, "page": page, "limit": limit}))
    else:
        tasks.append(asyncio.sleep(0, result={}))

    if source in ["all", "nguonc"]:
        tasks.append(_nguonc_get("/films/search", {"keyword": search_term, "page": page}))
    else:
        tasks.append(asyncio.sleep(0, result={}))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    kk_data = results[0] if isinstance(results[0], dict) else {}
    nc_data = results[1] if isinstance(results[1], dict) else {}

    kk_items = kk_data.get("data", {}).get("items") or []
    nc_items = nc_data.get("items") or []

    kk_mapped = [_map_kkphim_item(i) for i in kk_items]
    nc_mapped = [_map_nguonc_item(i) for i in nc_items]

    if source == "kkphim":
        merged = kk_mapped
    elif source == "nguonc":
        merged = nc_mapped
    else:
        merged = _merge_and_dedup(kk_mapped, nc_mapped)

    # Lọc kết quả tìm kiếm nếu có ý định thể loại / quốc gia
    if detected_cat:
        if detected_cat in ["phim-bo", "series"]:
            merged = [
                m for m in merged
                if m.get("type") == "series"
                or int(re.sub(r'[^0-9]', '', str(m.get("episode_total") or '0')) or 0) > 1
                or "tập" in str(m.get("episode_current") or "").lower()
            ]
        elif detected_cat in ["phim-le", "single"]:
            merged = [
                m for m in merged
                if m.get("type") == "single"
                or str(m.get("episode_total")) in ["1", "0", ""]
            ]
        elif detected_cat in ["hoat-hinh", "anime"]:
            merged = [
                m for m in merged
                if (m.get("type") or "").lower() in ["hoathinh", "hoat-hinh"]
                or "hoạt hình" in (m.get("category") or "").lower()
                or "anime" in (m.get("category") or "").lower()
            ]

    if detected_country:
        c_target = detected_country.lower().strip()
        def match_c(m):
            c_slug = (m.get("country_slug") or "").lower()
            c_name = (m.get("country") or "").lower()
            if not c_slug and not c_name:
                return True
            return c_slug == c_target or c_target.replace('-', ' ') in c_name
        merged = [m for m in merged if match_c(m)]

    if grouped:
        merged = _group_items(merged)

    total = len(merged)
    return {
        "items": merged,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": 1,
    }


@router.get("/cinema")
async def get_cinema_movies(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
    source: str = "all",
    grouped: bool = Query(False),
):
    """Phim chiếu rạp tuyển chọn."""
    return await _fetch_and_merge(
        "/v1/api/danh-sach/phim-chieu-rap",
        "/films/danh-sach/phim-le",
        {"page": page, "limit": limit, "sort_field": "modified.time"},
        {"page": page},
        page,
        limit,
        source,
        grouped
    )


@router.get("/by-country/{country_slug}")
async def get_by_country(
    country_slug: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
    genre: Optional[str] = None,
    year: Optional[str] = None,
    sort: str = "modified.time",
    source: str = "all",
    grouped: bool = Query(False),
):
    return await get_movies(country=country_slug, genre=genre, year=year, sort=sort, source=source, grouped=grouped, page=page, limit=limit)


@router.get("/by-genre/{genre_slug}")
async def get_by_genre(
    genre_slug: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
    country: Optional[str] = None,
    year: Optional[str] = None,
    sort: str = "modified.time",
    source: str = "all",
    grouped: bool = Query(False),
):
    target_genre = GENRE_SLUG_MAP.get(genre_slug, genre_slug)
    return await get_movies(genre=target_genre, country=country, year=year, sort=sort, source=source, grouped=grouped, page=page, limit=limit)


@router.get("/{slug}/stream/{episode_slug}")
async def get_stream(slug: str, episode_slug: str):
    """Lấy link stream (m3u8 hoặc embed) từ các server của cả Nguồn C và KKPhim."""
    # 1. Fetch both detail in parallel
    kk_task = _kkphim_get(f"/phim/{slug}", {})
    nc_task = _nguonc_get(f"/film/{slug}", {})
    
    results = await asyncio.gather(kk_task, nc_task, return_exceptions=True)
    kk_data = results[0] if isinstance(results[0], dict) else {}
    nc_data = results[1] if isinstance(results[1], dict) else {}

    # Check KKPhim first (prefer m3u8 direct HLS)
    for ep_group in (kk_data.get("episodes") or []):
        for ep in (ep_group.get("server_data") or []):
            if ep.get("slug") == episode_slug or ep.get("filename") == episode_slug or ep.get("name") == episode_slug:
                return {
                    "url": ep.get("link_m3u8") or ep.get("link_embed", ""),
                    "type": "hls" if ep.get("link_m3u8") else "embed",
                    "title": ep.get("name", ""),
                    "server": ep_group.get("server_name", "Server VIP"),
                    "source": "kkphim"
                }

    # Check NguonC
    nc_movie = nc_data.get("movie") or {}
    for ep_group in (nc_movie.get("episodes") or []):
        s_name = ep_group.get("server_name", "Nguồn C")
        for ep in (ep_group.get("items") or []):
            if ep.get("slug") == episode_slug or ep.get("name") == episode_slug:
                embed_url = ep.get("embed", "")
                m3u8_url = ep.get("m3u8", "") or ep.get("link_m3u8", "")
                return {
                    "url": m3u8_url or embed_url,
                    "type": "hls" if m3u8_url else "embed",
                    "title": ep.get("name", ""),
                    "server": f"[Nguồn C] {s_name}",
                    "source": "nguonc"
                }

    # Fallback to first episode of first available server
    if kk_data.get("episodes"):
        first_ep = kk_data["episodes"][0]["server_data"][0]
        return {
            "url": first_ep.get("link_m3u8") or first_ep.get("link_embed", ""),
            "type": "hls" if first_ep.get("link_m3u8") else "embed",
            "title": first_ep.get("name", ""),
            "server": kk_data["episodes"][0].get("server_name", "KKPhim"),
            "source": "kkphim"
        }

    if nc_movie.get("episodes") and nc_movie["episodes"][0].get("items"):
        first_ep = nc_movie["episodes"][0]["items"][0]
        return {
            "url": first_ep.get("m3u8") or first_ep.get("embed", ""),
            "type": "hls" if first_ep.get("m3u8") else "embed",
            "title": first_ep.get("name", ""),
            "server": nc_movie["episodes"][0].get("server_name", "Nguồn C"),
            "source": "nguonc"
        }

    raise HTTPException(404, "Episode stream not found")


@router.get("/series/{series_id}")
async def get_series_detail(series_id: str):
    """Lấy danh sách các season của 1 series."""
    keyword = series_id.replace('-', ' ')
    search_res = await search_movies(keyword=keyword, limit=100)
    items = search_res.get("items", [])
    
    seasons = [m for m in items if m.get("series_id") == series_id]
    seasons.sort(key=lambda x: x.get("season_number", 1))
    
    if not seasons:
        raise HTTPException(404, "Series not found")
        
    base_movie = seasons[-1]
    return {
        "series_id": series_id,
        "name": base_movie.get("base_title"),
        "description": base_movie.get("description"),
        "poster_url": base_movie.get("poster_url"),
        "seasons": seasons
    }


@router.get("/{slug}")
async def get_movie_detail(slug: str):
    """
    Lấy thông tin chi tiết phim và tổng hợp toàn bộ các server
    (Vietsub, Thuyết Minh, Lồng Tiếng, VIP) từ cả Nguồn C và KKPhim.
    """
    # Fetch KKPhim & NguonC simultaneously
    kk_task = _kkphim_get(f"/phim/{slug}", {})
    nc_task = _nguonc_get(f"/film/{slug}", {})
    
    results = await asyncio.gather(kk_task, nc_task, return_exceptions=True)
    kk_data = results[0] if isinstance(results[0], dict) else {}
    nc_data = results[1] if isinstance(results[1], dict) else {}

    kk_has_data = bool(kk_data.get("status") and kk_data.get("movie"))
    nc_has_data = bool(nc_data.get("status") == "success" and nc_data.get("movie"))

    if not kk_has_data and not nc_has_data:
        raise HTTPException(404, "Movie not found in any source")

    # Metadata base
    kk_movie = kk_data.get("movie", {}) if kk_has_data else {}
    nc_movie = nc_data.get("movie", {}) if nc_has_data else {}
    
    primary_movie = kk_movie if kk_has_data else nc_movie

    title_raw = primary_movie.get("name") or nc_movie.get("name", "")
    orig_name = primary_movie.get("origin_name") or nc_movie.get("original_name", "")
    description = primary_movie.get("content") or nc_movie.get("description", "")
    poster_url = _fix_image(primary_movie.get("poster_url")) or nc_movie.get("poster_url", "")
    thumb_url = _fix_image(primary_movie.get("thumb_url")) or nc_movie.get("thumb_url", "")
    year = primary_movie.get("year") or nc_movie.get("year")

    # Categories / Genres
    category_list = primary_movie.get("category", [])
    country_list = primary_movie.get("country", [])
    
    if not category_list and nc_has_data:
        # Parse from NguonC category
        nc_cat = nc_movie.get("category", {})
        if isinstance(nc_cat, dict):
            for _, grp in nc_cat.items():
                gname = grp.get("group", {}).get("name", "")
                if "Thể loại" in gname:
                    category_list = grp.get("list", [])
                elif "Quốc gia" in gname:
                    country_list = grp.get("list", [])

    # Format category string
    if isinstance(category_list, list):
        categories_str = ", ".join(c.get("name", "") if isinstance(c, dict) else str(c) for c in category_list)
    else:
        categories_str = str(category_list)

    if isinstance(country_list, list):
        country_str = ", ".join(c.get("name", "") if isinstance(c, dict) else str(c) for c in country_list)
    else:
        country_str = str(country_list)

    # Combine servers
    servers = []
    stream_texts = []

    # 1. Servers from NguonC (Ưu tiên chất lượng phụ đề Vietsub, Thuyết minh, Lồng tiếng)
    if nc_has_data:
        for ep_group in (nc_movie.get("episodes") or []):
            s_name = ep_group.get("server_name", "Vietsub")
            display_name = f"🌟 Nguồn C - {s_name}"
            stream_texts.append(s_name)
            eps = []
            for ep in (ep_group.get("items") or []):
                name = str(ep.get("name", ""))
                slug_ep = ep.get("slug") or f"tap-{name}"
                embed_url = ep.get("embed", "")
                m3u8_url = ep.get("m3u8", "") or ep.get("link_m3u8", "")
                eps.append({
                    "name": name,
                    "slug": slug_ep,
                    "filename": f"Tập {name}",
                    "link_m3u8": m3u8_url,
                    "link_embed": embed_url,
                })
            if eps:
                servers.append({
                    "server_name": display_name,
                    "source": "nguonc",
                    "sub_type": "thuyet-minh" if "thuyết minh" in s_name.lower() else ("long-tieng" if "lồng tiếng" in s_name.lower() else "vietsub"),
                    "server_data": eps
                })

    # 2. Servers from KKPhim (Server luồng HLS trực tiếp)
    if kk_has_data:
        for ep_group in (kk_data.get("episodes") or []):
            s_name = ep_group.get("server_name", "Server")
            display_name = f"⚡ KKPhim - {s_name}"
            stream_texts.append(s_name)
            eps = []
            for ep in (ep_group.get("server_data") or []):
                name = ep.get("name", "")
                stream_texts.append(name)
                eps.append({
                    "name": name,
                    "slug": ep.get("slug", ""),
                    "filename": ep.get("filename", ""),
                    "link_m3u8": ep.get("link_m3u8", ""),
                    "link_embed": ep.get("link_embed", ""),
                })
            if eps:
                servers.append({
                    "server_name": display_name,
                    "source": "kkphim",
                    "sub_type": "vietsub",
                    "server_data": eps
                })

    # Rating
    detail_tmdb = primary_movie.get("tmdb") or {}
    tmdb_val = detail_tmdb.get("vote_average") if isinstance(detail_tmdb, dict) else None
    if tmdb_val and float(tmdb_val) > 0:
        r = float(tmdb_val)
        detail_rating_str = f"{r:.1f}" if r % 1 != 0 else str(int(r))
    else:
        detail_rating_str = "8.6" # default warm fallback

    detail_imdb = primary_movie.get("imdb") or {}
    imdb_val = detail_imdb.get("vote_average") if isinstance(detail_imdb, dict) else None
    if imdb_val and float(imdb_val) > 0:
        r = float(imdb_val)
        imdb_rating_str = f"{r:.1f}" if r % 1 != 0 else str(int(r))
    else:
        imdb_rating_str = "8.2"

    base_title, series_id, season_number = parse_series_info(title_raw)
    final_quality = normalize_quality(primary_movie.get("quality", "HD"), *stream_texts)

    # Cast & Director
    cast_val = primary_movie.get("actor") or primary_movie.get("casts") or nc_movie.get("casts") or []
    if isinstance(cast_val, list):
        cast_str = ", ".join(cast_val)
    else:
        cast_str = str(cast_val)

    director_val = primary_movie.get("director") or nc_movie.get("director") or []
    if isinstance(director_val, list):
        director_str = ", ".join(director_val)
    else:
        director_str = str(director_val)

    tot_episodes = str(primary_movie.get("episode_total") or nc_movie.get("total_episodes") or "")
    curr_episode = str(primary_movie.get("episode_current") or nc_movie.get("current_episode") or "")

    return {
        "id":             str(primary_movie.get("_id") or primary_movie.get("id") or slug),
        "slug":           slug,
        "title":          title_raw,
        "base_title":     base_title,
        "series_id":      series_id,
        "season_number":  season_number,
        "original_title": orig_name,
        "description":    description,
        "poster_url":     poster_url,
        "thumb_url":      thumb_url,
        "year":           year,
        "quality":        final_quality,
        "lang":           primary_movie.get("lang") or nc_movie.get("language") or "Vietsub + Thuyết Minh",
        "type":           primary_movie.get("type", "single"),
        "is_cinema":      bool(primary_movie.get("chieurap", False)),
        "trailer_url":    primary_movie.get("trailer_url", ""),
        "category":       categories_str,
        "country":        country_str,
        "cast":           cast_str,
        "director":       director_str,
        "rating":         detail_rating_str,
        "imdb_rating":    imdb_rating_str,
        "tmdb_id":        detail_tmdb.get("id", ""),
        "imdb_id":        detail_imdb.get("id", ""),
        "duration":       primary_movie.get("time") or nc_movie.get("time") or "",
        "episode_current": curr_episode,
        "total_episodes": tot_episodes,
        "is_streamable":  len(servers) > 0,
        "episodes":       [],
        "servers":        servers,
    }
