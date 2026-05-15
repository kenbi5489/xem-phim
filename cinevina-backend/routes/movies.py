"""
CINEVINA — movies router
Nguồn chính: KKPhim (phimapi.com)
"""
import urllib.parse
from typing import Optional, List, Any, Dict

import httpx
from fastapi import APIRouter, HTTPException, Query
from services.sources.registry import SourceRegistry

router = APIRouter(prefix="/api/movies", tags=["movies"])

KKPHIM_BASE = "https://phimapi.com"
OPHIM_BASE = "https://ophim1.com"

# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def normalize_kkphim_image_url(url: Optional[str]) -> str:
    """
    KKPhim API trả ảnh với domain phimapi.com nhưng
    CDN thực tế là phimimg.com — cùng path, khác domain.
    """
    if not url:
        return ""
    # Đảm bảo là string và replace domain sai bằng domain đúng
    s = str(url).strip()
    return (
        s
        .replace("https://phimapi.com/upload/", "https://phimimg.com/upload/")
        .replace("http://phimapi.com/upload/", "https://phimimg.com/upload/")
    )


def _fix_image(path: Optional[str]) -> str:
    """Chuyển path ảnh tương đối → URL proxy tuyệt đối, sau khi đã normalize domain."""
    if not path:
        return ""
    
    # 1. Normalize domain trước (nếu là link tuyệt đối của KKPhim)
    normalized_url = normalize_kkphim_image_url(path)
    if not normalized_url:
        return ""
        
    # 2. Nếu đã là URL proxy rồi thì không bọc nữa
    if "proxy/image" in normalized_url:
        return normalized_url
        
    # 3. Nếu là path tương đối, thêm domain đúng
    if not normalized_url.startswith("http"):
        full = f"https://phimimg.com/{normalized_url.lstrip('/')}"
    else:
        full = normalized_url
        
    return full


def _to_str(val, key: str = "name") -> str:
    """Array of objects hoặc string → string."""
    if isinstance(val, list):
        return ", ".join(
            item.get(key, "") if isinstance(item, dict) else str(item)
            for item in val
        )
    return str(val) if val else ""


def normalize_quality(*sources: Optional[str]) -> str:
    """
    Chuẩn hóa chất lượng video từ nhiều nguồn text khác nhau.
    Ưu tiên: 4K > FHD > HD > CAM > SD.
    """
    combined = " ".join(str(s).upper() for s in sources if s)
    
    if any(k in combined for k in ["4K", "UHD", "2160", "2160P", "4096", "ULTRAHD", "ULTRA HD", "ULTRA-HD", "HDR10", "HDR 10", "DOLBY VISION", "DV"]):
        return "4K"
    if any(k in combined for k in ["FHD", "1080", "FULL HD", "FULLHD", "FULL-HD", "1080P"]):
        return "FHD"
    if any(k in combined for k in ["HD", "720", "720P"]):
        return "HD"
    if any(k in combined for k in ["CAM", "TS", "TC", "BẢN CAM"]):
        return "CAM"
    if any(k in combined for k in ["SD", "480", "360"]):
        return "SD"
    return "HD"


def _map_item(item: dict, path_image: str = "") -> dict:
    """Map 1 item từ KKPhim/Ophim listing → CINEVINA format."""
    # ── country ──────────────────────────────
    cr = item.get("country") or []
    if isinstance(cr, list) and cr:
        c0 = cr[0]
        country_name = c0.get("name", "") if isinstance(c0, dict) else str(c0)
        country_slug = c0.get("slug", "") if isinstance(c0, dict) else ""
    elif isinstance(cr, str):
        country_name, country_slug = cr, ""
    else:
        country_name = country_slug = ""

    # ── category ─────────────────────────────
    cat_raw = item.get("category") or []
    if isinstance(cat_raw, list):
        genres = [
            {"name": c.get("name", ""), "slug": c.get("slug", "")}
            for c in cat_raw if isinstance(c, dict)
        ]
        cat_str = ", ".join(g["name"] for g in genres)
    else:
        genres, cat_str = [], (str(cat_raw) if cat_raw else "")

    # ── modified ─────────────────────────────
    mod = item.get("modified") or {}
    modified_time = mod.get("time", "") if isinstance(mod, dict) else ""

    # ── rating ───────────────────────────────
    tmdb_rating = item.get("tmdb") or {}
    rating_val = tmdb_rating.get("vote_average") if isinstance(tmdb_rating, dict) else None
    
    if rating_val is None or rating_val == 0 or rating_val == "0" or rating_val == 0.0:
        rating_str = "N/A"
    else:
        # Handle float precision
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

    return {
        "id":             str(item.get("_id") or item.get("id") or ""),
        "slug":           item.get("slug", ""),
        "title":          item.get("name", ""),
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
        "episode_total":   str(item.get("episode_total")   or ""),
        "rating":         rating_str,
        "modified":       modified_time,
    }


def _paginate(data: dict, page: int, limit: int) -> dict:
    """Chuẩn hoá response phân trang từ KKPhim."""
    # Try v1 structure first
    items_raw = data.get("data", {}).get("items", [])
    params = data.get("data", {}).get("params", {})
    pagination = params.get("pagination", {})
    
    # If not v1, try old structure (home page uses this)
    if not items_raw:
        items_raw = data.get("items", [])
        pagination_raw = data.get("pagination", {})
        total = pagination_raw.get("totalItems", len(items_raw))
        total_pages = pagination_raw.get("totalPages", 1)
    else:
        total = pagination.get("totalItems", len(items_raw))
        total_pages = pagination.get("totalPages", 1)
        
    path_image = data.get("pathImage", "")
    return {
        "items":       [_map_item(i, path_image) for i in items_raw],
        "total":       total,
        "page":        page,
        "limit":       limit,
        "total_pages": total_pages,
    }


async def _kkphim_get(path: str, params: dict) -> dict:
    """Wrapper gọi KKPhim API với error handling."""
    url = f"{KKPHIM_BASE}{path}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.TimeoutException:
            raise HTTPException(502, "KKPhim API timeout")
        except httpx.HTTPStatusError as e:
            raise HTTPException(502, f"KKPhim API error: {e.response.status_code}")
async def _ophim_get(path: str, params: dict) -> dict:
    """Wrapper gọi Ophim API với error handling."""
    url = f"{OPHIM_BASE}{path}"
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.TimeoutException:
            return {} # Fallback
        except httpx.HTTPStatusError as e:
            return {} # Fallback
        except Exception as e:
            return {} # Fallback

def _merge_and_dedup(items1: list, items2: list) -> list:
    """Gộp 2 danh sách phim và loại bỏ các phim trùng lặp dựa trên slug."""
    seen_slugs = set()
    merged = []
    for item in items1 + items2:
        slug = item.get("slug")
        if slug and slug not in seen_slugs:
            seen_slugs.add(slug)
            merged.append(item)
    return merged

async def _fetch_and_merge(path: str, params: dict, page: int, limit: int) -> dict:
    """Fetch dữ liệu từ KKPhim và Ophim, sau đó gộp lại."""
    import asyncio
    kkphim_task = _kkphim_get(path, params)
    ophim_task = _ophim_get(path, params)
    
    # KKPhim có thể throw Exception, Ophim trả về {} nếu lỗi
    try:
        kkphim_data, ophim_data = await asyncio.gather(kkphim_task, ophim_task)
    except Exception as e:
        raise HTTPException(502, f"Lỗi fetch dữ liệu: {str(e)}")

    # Trích xuất items
    kkphim_items_raw = kkphim_data.get("data", {}).get("items", []) or kkphim_data.get("items", [])
    ophim_items_raw = ophim_data.get("data", {}).get("items", []) or ophim_data.get("items", [])
    
    # Lấy path image cho Ophim (tuỳ thuộc vào endpoint trả về format nào)
    ophim_path_image = ophim_data.get("pathImage") or ophim_data.get("data", {}).get("APP_DOMAIN_CDN_IMAGE", "")
    if not ophim_path_image or ophim_path_image.strip("/") == "https://img.ophim.live":
        ophim_path_image = "https://img.ophim.live/uploads/movies/"
    elif not ophim_path_image.endswith("/"):
        ophim_path_image += "/"
        
    ophim_mapped = [_map_item(i, ophim_path_image) for i in ophim_items_raw]
    
    merged_items = _merge_and_dedup(kkphim_mapped, ophim_mapped)
    
    # Tính toán pagination
    kk_pagination = kkphim_data.get("data", {}).get("params", {}).get("pagination", {}) or kkphim_data.get("pagination", {})
    op_pagination = ophim_data.get("data", {}).get("params", {}).get("pagination", {}) or ophim_data.get("pagination", {})
    
    total = max(kk_pagination.get("totalItems", 0), op_pagination.get("totalItems", 0))
    if not total: total = len(merged_items)
    
    total_pages = max(kk_pagination.get("totalPages", 1), op_pagination.get("totalPages", 1))

    return {
        "items": merged_items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }

# ─────────────────────────────────────────
# ROUTES — thứ tự QUAN TRỌNG: specific trước generic
# ─────────────────────────────────────────

@router.get("/trending")
async def get_trending(limit: int = 10):
    """Lấy top phim trending — dùng phim mới cập nhật từ cả 2 nguồn làm trending proxy."""
    data = await _fetch_and_merge("/danh-sach/phim-moi-cap-nhat", {"page": 1, "limit": limit}, 1, limit)
    return data.get("items", [])[:limit]


@router.get("")
async def get_movies(
    category: Optional[str] = None,
    country:  Optional[str] = None,
    genre:    Optional[str] = None,
    year:     Optional[str] = None,
    sort:     str           = "modified.time",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
):
    """Lấy danh sách phim có hỗ trợ filter country, genre, year, sort."""
    
    base_params: dict = {"page": page, "limit": limit, "sort_field": sort}
    if year:  base_params["year"] = year

    # Ưu tiên filter theo Country
    if country:
        endpoint = f"/v1/api/quoc-gia/{country}"
        if genre: base_params["category"] = genre
        return await _fetch_and_merge(endpoint, base_params, page, limit)

    # Ưu tiên tiếp theo theo Genre
    if genre:
        endpoint = f"/v1/api/the-loai/{genre}"
        return await _fetch_and_merge(endpoint, base_params, page, limit)

    # Cuối cùng theo Category
    cat = category or "phim-moi-cap-nhat"
    if cat == "phim-moi-cap-nhat":
        return await _fetch_and_merge("/danh-sach/phim-moi-cap-nhat", {"page": page, "limit": limit}, page, limit)
    
    endpoint = f"/v1/api/danh-sach/{cat}"
    return await _fetch_and_merge(endpoint, base_params, page, limit)



@router.get("/search")
async def search_movies(
    keyword: str = Query(..., min_length=1),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
):
    # 1. Optionally fetch live/sport items from plugin (non-fatal)
    live_items = []
    if page == 1:
        try:
            SourceRegistry.discover_plugins()
            plugin = SourceRegistry.get_plugin("sport_live")
            if plugin and getattr(plugin, "is_active", False):
                live_items_raw = await plugin.search(keyword)
                live_items = [item.model_dump() if hasattr(item, "model_dump") else item for item in live_items_raw]
        except Exception:
            pass  # Plugin errors should never break main search


    # 2. Fetch từ cả KKPhim và Ophim
    import asyncio
    kkphim_task = _kkphim_get("/v1/api/tim-kiem", {"keyword": keyword, "page": page, "limit": limit})
    ophim_task = _ophim_get("/v1/api/tim-kiem", {"keyword": keyword, "page": page, "limit": limit})
    
    try:
        kkphim_data, ophim_data = await asyncio.gather(kkphim_task, ophim_task)
    except Exception:
        kkphim_data, ophim_data = {}, {}

    kk_items = kkphim_data.get("data", {}).get("items") or []
    op_items = ophim_data.get("data", {}).get("items") or []
    
    ophim_path_image = ophim_data.get("pathImage") or ophim_data.get("data", {}).get("APP_DOMAIN_CDN_IMAGE", "")
    if not ophim_path_image or ophim_path_image.strip("/") == "https://img.ophim.live":
        ophim_path_image = "https://img.ophim.live/uploads/movies/"
    elif not ophim_path_image.endswith("/"):
        ophim_path_image += "/"
    
    kk_mapped = [_map_item(i) for i in kk_items]
    op_mapped = [_map_item(i, ophim_path_image) for i in op_items]
    
    merged_api_items = _merge_and_dedup(kk_mapped, op_mapped)
    
    pagination = kkphim_data.get("data", {}).get("params", {}).get("pagination", {})
    if not pagination:
        pagination = ophim_data.get("data", {}).get("params", {}).get("pagination", {})

    combined_items = live_items + merged_api_items

    return {
        "items":       combined_items,
        "total":       pagination.get("totalItems", len(merged_api_items)) + len(live_items),
        "page":        page,
        "limit":       limit,
        "total_pages": pagination.get("totalPages", 1),
    }


@router.get("/cinema")
async def get_cinema_movies(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=24, ge=1, le=100),
):
    return await _fetch_and_merge("/v1/api/danh-sach/phim-chieu-rap", {"page": page, "limit": limit, "sort_field": "modified.time"}, page, limit)


@router.get("/by-country/{country_slug}")
async def get_by_country(
    country_slug: str,
    page:  int            = Query(default=1, ge=1),
    limit: int            = Query(default=24, ge=1, le=100),
    genre: Optional[str]  = None,
    year:  Optional[str]  = None,
    sort:  str            = "modified.time",
):
    params = {"page": page, "limit": limit, "sort_field": sort}
    if genre: params["category"] = genre
    if year:  params["year"] = year
    return await _fetch_and_merge(f"/v1/api/quoc-gia/{country_slug}", params, page, limit)


@router.get("/by-genre/{genre_slug}")
async def get_by_genre(
    genre_slug: str,
    page:    int           = Query(default=1, ge=1),
    limit:   int           = Query(default=24, ge=1, le=100),
    country: Optional[str] = None,
    year:    Optional[str] = None,
    sort:    str           = "modified.time",
):
    params = {"page": page, "limit": limit, "sort_field": sort}
    if country: params["country"] = country
    if year:    params["year"] = year
    return await _fetch_and_merge(f"/v1/api/the-loai/{genre_slug}", params, page, limit)


@router.get("/{slug}/stream/{episode_slug}")
async def get_stream(slug: str, episode_slug: str):
    import asyncio
    kk_task = _kkphim_get(f"/phim/{slug}", {})
    op_task = _ophim_get(f"/phim/{slug}", {})
    
    try:
        kk_data, op_data = await asyncio.gather(kk_task, op_task)
    except Exception:
        kk_data, op_data = {}, {}

    for data in [kk_data, op_data]:
        for ep_group in (data.get("episodes") or []):
            for ep in (ep_group.get("server_data") or []):
                if ep.get("slug") == episode_slug or ep.get("filename") == episode_slug:
                    return {
                        "url":   ep.get("link_m3u8") or ep.get("link_embed", ""),
                        "type":  "hls" if ep.get("link_m3u8") else "embed",
                        "title": ep.get("name", ""),
                    }
    raise HTTPException(404, "Episode not found")


@router.get("/{slug}")
async def get_movie_detail(slug: str):
    import asyncio
    kk_task = _kkphim_get(f"/phim/{slug}", {})
    op_task = _ophim_get(f"/phim/{slug}", {})
    
    try:
        kk_data, op_data = await asyncio.gather(kk_task, op_task)
    except Exception:
        kk_data, op_data = {}, {}

    if not kk_data.get("status") and not op_data.get("status"):
        raise HTTPException(404, "Movie not found")

    # Ưu tiên lấy movie metadata từ KKPhim, nếu không có thì lấy Ophim
    movie = kk_data.get("movie", {}) if kk_data.get("status") else op_data.get("movie", {})
    
    # Build servers từ cả 2 nguồn
    servers = []
    stream_texts = []
    
    def process_episodes(episodes_list, prefix=""):
        for ep_group in episodes_list:
            server_name = ep_group.get("server_name", "")
            display_name = f"{prefix} {server_name}".strip()
            stream_texts.append(server_name)
            eps = []
            for ep in (ep_group.get("server_data") or []):
                name = ep.get("name", "")
                filename = ep.get("filename", "")
                stream_texts.append(name)
                stream_texts.append(filename)
                eps.append({
                    "name":       name,
                    "slug":       ep.get("slug", ""),
                    "filename":   filename,
                    "link_m3u8":  ep.get("link_m3u8", ""),
                    "link_embed": ep.get("link_embed", ""),
                })
            if eps:
                servers.append({"server_name": display_name, "server_data": eps})

    if kk_data.get("status"):
        process_episodes(kk_data.get("episodes", []), "KKP")
    if op_data.get("status"):
        process_episodes(op_data.get("episodes", []), "OP")

    # Phân tích quality từ toàn bộ metadata của phim và stream
    final_quality = normalize_quality(movie.get("quality", ""), *stream_texts)
    if final_quality == "UNKNOWN":
        final_quality = "HD"

    # Lấy rating từ detail movie
    detail_tmdb = movie.get("tmdb") or {}
    detail_imdb = movie.get("imdb") or {}
    
    # TMDB Rating
    tmdb_rating_val = detail_tmdb.get("vote_average") if isinstance(detail_tmdb, dict) else None
    if tmdb_rating_val is None or tmdb_rating_val == 0 or tmdb_rating_val == "0" or tmdb_rating_val == 0.0:
        detail_rating_str = "N/A"
    else:
        try:
            r = float(tmdb_rating_val)
            detail_rating_str = f"{r:.1f}" if r % 1 != 0 else str(int(r))
        except (ValueError, TypeError):
            detail_rating_str = str(tmdb_rating_val)

    # IMDB Rating
    imdb_rating_val = detail_imdb.get("vote_average") if isinstance(detail_imdb, dict) else None
    if imdb_rating_val is None or imdb_rating_val == 0 or imdb_rating_val == "0" or imdb_rating_val == 0.0:
        imdb_rating_str = "N/A"
    else:
        try:
            r = float(imdb_rating_val)
            imdb_rating_str = f"{r:.1f}" if r % 1 != 0 else str(int(r))
        except (ValueError, TypeError):
            imdb_rating_str = str(imdb_rating_val)

    # Lấy thêm trường duration từ "time"
    duration = movie.get("time", "")

    return {
        "id":             str(movie.get("_id") or ""),
        "slug":           movie.get("slug", ""),
        "title":          movie.get("name", ""),
        "original_title": movie.get("origin_name", ""),
        "description":    movie.get("content", ""),
        "poster_url":     _fix_image(movie.get("poster_url")),
        "thumb_url":      _fix_image(movie.get("thumb_url")),
        "year":           movie.get("year"),
        "quality":        final_quality,
        "lang":           movie.get("lang", "Vietsub"),
        "type":           movie.get("type", "single"),
        "is_cinema":      bool(movie.get("chieurap", False)),
        "trailer_url":    movie.get("trailer_url", ""),
        "category":       movie.get("category", []),
        "country":        movie.get("country", []),
        "cast":           movie.get("actor", []),
        "director":       movie.get("director", []),
        "rating":         detail_rating_str,
        "imdb_rating":    imdb_rating_str,
        "tmdb_id":        detail_tmdb.get("id", ""),
        "imdb_id":        detail_imdb.get("id", ""),
        "duration":       duration,
        "episode_current": str(movie.get("episode_current", "")),
        "total_episodes": str(movie.get("episode_total", "")),
        "is_streamable":  movie.get("status") != "trailer",
        "episodes":       [],
        "servers":        servers,
    }
