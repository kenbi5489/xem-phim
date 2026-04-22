import httpx
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response

router = APIRouter(prefix="/api/proxy", tags=["proxy"])

ALLOWED_DOMAINS = [
    "phimimg.com",
    "phimapi.com",
]

def _is_allowed(url: str) -> bool:
    """Basic security: only proxy images from known safe domains."""
    from urllib.parse import urlparse
    try:
        host = urlparse(url).hostname or ""
        return any(host == d or host.endswith("." + d) for d in ALLOWED_DOMAINS)
    except Exception:
        return False

@router.get("/image")
async def proxy_image(url: str = Query(..., description="URL of the image to proxy")):
    if not url:
        raise HTTPException(status_code=400, detail="url parameter is required")

    if not _is_allowed(url):
        raise HTTPException(status_code=403, detail="Domain not allowed")

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Referer": "https://phimimg.com/",
            }
            r = await client.get(url, headers=headers)

        if r.status_code != 200:
            raise HTTPException(
                status_code=r.status_code,
                detail=f"Upstream returned {r.status_code}"
            )

        content_type = r.headers.get("content-type", "image/jpeg")
        # Ensure it is an image
        if "image" not in content_type and "octet-stream" not in content_type:
            raise HTTPException(status_code=415, detail="Upstream is not an image")

        return Response(
            content=r.content,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
            }
        )
    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream image timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")
