from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from services.sources.manager import source_manager
from services.sources.base import MovieInfo, StreamInfo

router = APIRouter(prefix="/api/movies", tags=["movies"])


@router.get("", response_model=List[MovieInfo])
async def get_movies(
    category: Optional[str] = Query(None, description="Category slug: phim-le, phim-bo, hoat-hinh, tv-shows, phim-chieu-rap"),
    country:  Optional[str] = Query(None, description="Country slug: viet-nam, han-quoc, ..."),
    genre:    Optional[str] = Query(None, description="Genre slug: hanh-dong, tinh-cam, ..."),
    year:     Optional[str] = Query(None, description="Year: 2025, 2024, ..."),
    sort:     Optional[str] = Query("newest", description="Sort: newest, rating, views"),
    page:     int = Query(1, ge=1),
    source:   str = Query("vnmedia"),
):
    """
    Lấy danh sách phim theo filter.
    Thứ tự ưu tiên: Country > Genre > Year > Category > Default (phim-bo)
    """
    try:
        plugin = source_manager._get_plugin(source)
        if not plugin:
            raise HTTPException(status_code=400, detail=f"Source {source} not found")

        if country:
            return await plugin.get_catalog_by_country(country, page)
        if genre:
            return await plugin.get_catalog_by_genre(genre, page)
        if year:
            return await plugin.get_catalog_by_year(year, page)
        if category:
            return await plugin.get_catalog(category, page)
            
        # Default fallback
        return await plugin.get_catalog("phim-bo", page)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=List[MovieInfo])
async def search_movies(
    keyword: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    source: str = Query("vnmedia"),
):
    try:
        # Source manager search already calls plugin.search which uses limit=30
        return await source_manager.search(keyword, page, source)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cinema", response_model=List[MovieInfo])
async def get_cinema_movies(
    page: int = Query(1, ge=1),
    source: str = Query("vnmedia"),
):
    """Shortcut: lấy phim đang chiếu rạp."""
    try:
        return await source_manager.get_movies("phim-chieu-rap", page, source_id=source)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{slug}", response_model=MovieInfo)
async def get_movie_detail(
    slug: str,
    source: str = Query("vnmedia"),
):
    movie = await source_manager.get_movie_detail(slug, source)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@router.get("/{slug}/stream/{episode_slug}", response_model=StreamInfo)
async def get_stream(
    slug: str,
    episode_slug: str,
    source: str = Query("vnmedia"),
):
    stream = await source_manager.get_stream(slug, episode_slug, source)
    if not stream:
        raise HTTPException(status_code=404, detail="Stream not found")
    return stream
