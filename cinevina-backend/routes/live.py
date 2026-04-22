"""
Live TV channels API — trả danh sách kênh từ sport_live plugin.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from services.sources.registry import SourceRegistry

router = APIRouter(prefix="/api/live", tags=["live"])


@router.get("/channels")
async def get_live_channels(
    group: Optional[str] = Query(None, description="Filter by group: the-thao | bong-da | truyen-hinh"),
):
    """Trả danh sách kênh live với stream URL."""
    plugin = SourceRegistry.get_plugin("sport_live")
    if not plugin or not plugin.is_active:
        raise HTTPException(status_code=503, detail="Sport Live plugin is not available")
    if not hasattr(plugin, "get_channels"):
        raise HTTPException(status_code=501, detail="Plugin does not support get_channels")
    return plugin.get_channels(group=group)


@router.get("/stream/{channel_id}")
async def get_channel_stream(channel_id: str):
    """Trả stream URL cho một kênh cụ thể."""
    plugin = SourceRegistry.get_plugin("sport_live")
    if not plugin or not plugin.is_active:
        raise HTTPException(status_code=503, detail="Sport Live plugin is not available")
    stream = await plugin.get_stream(channel_id, "live")
    if not stream:
        raise HTTPException(status_code=404, detail=f"Channel '{channel_id}' not found")
    return stream
