"""
Live TV channels API — trả danh sách kênh đầy đủ từ sport_live plugin.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from services.sources.registry import SourceRegistry

router = APIRouter(prefix="/api/live", tags=["live"])


def _get_plugin():
    # Ensure plugins are loaded
    SourceRegistry.discover_plugins()
    plugin = SourceRegistry.get_plugin("sport_live")
    if not plugin:
        raise HTTPException(status_code=503, detail="Sport Live plugin is not available")
    return plugin


@router.get("/channels")
async def get_live_channels(
    type:    Optional[str] = Query(None, description="Filter by type: live | sport"),
    group:   Optional[str] = Query(None, description="Filter by group: truyen-hinh | the-thao | bong-da | tin-tuc | dia-phuong | thieu-nhi | quoc-te"),
    network: Optional[str] = Query(None, description="Filter by network: VTV | HTV | SCTV | HTVC | K+ | ..."),
):
    """Trả danh sách kênh live với stream URL, logo và thông tin nhà mạng."""
    plugin = _get_plugin()
    return await plugin.get_channels(type=type, group=group, network=network)


@router.get("/networks")
async def get_live_networks():
    """Trả danh sách nhà mạng và số kênh."""
    plugin = _get_plugin()
    return await plugin.get_networks()


@router.get("/stream/{channel_id}")
async def get_channel_stream(channel_id: str):
    """Trả stream URL cho một kênh cụ thể."""
    plugin = _get_plugin()
    stream = await plugin.get_stream(channel_id, "live")
    if not stream:
        raise HTTPException(status_code=404, detail=f"Channel '{channel_id}' not found")
    return stream
