import httpx
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import Response

router = APIRouter(prefix="/api/proxy", tags=["proxy"])

ALLOWED_DOMAINS = [
    "phimimg.com",
    "phimapi.com",
    "googleusercontent.com",
    "imgur.com",
    "cloudinary.com",
    "vnmedia.vn",
    "vnmedia.com.vn",
    "static.vn",
    "mediacloud.vn",
    "ophim.live",
]

DOMAIN_FALLBACKS = [
    ("phimapi.com/upload/", "phimimg.com/upload/"),
    ("phimimg.com/upload/", "phimapi.com/upload/"),
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

    # Determine fallback URLs to try
    urls_to_try = [url]
    for old, new in DOMAIN_FALLBACKS:
        if old in url:
            urls_to_try.append(url.replace(old, new))
            break

    last_error = None
    
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Referer": "https://phimimg.com/",
        }
        
        for try_url in urls_to_try:
            if not _is_allowed(try_url):
                continue
                
            try:
                r = await client.get(try_url, headers=headers)
                
                if r.status_code == 200:
                    content_type = r.headers.get("content-type", "image/jpeg")
                    # Ensure it is an image or at least some common binary data
                    if "image" in content_type or "octet-stream" in content_type:
                        return Response(
                            content=r.content,
                            media_type=content_type,
                            headers={
                                "Cache-Control": "public, max-age=31536000, immutable",
                                "Access-Control-Allow-Origin": "*",
                                "X-Content-Type-Options": "nosniff",
                            }
                        )
                
                last_error = f"Upstream {try_url} returned {r.status_code}"
            except Exception as e:
                last_error = f"Error fetching {try_url}: {str(e)}"
                continue

    raise HTTPException(status_code=404, detail=last_error or "Image not found")


@router.get("/stream")
async def proxy_stream(url: str = Query(..., description="URL of the stream to proxy")):
    if not url:
        raise HTTPException(status_code=400, detail="url parameter is required")
         
    from urllib.parse import urlparse, urljoin
    host = urlparse(url).hostname or ""
    # Allowed all domains for full streaming compatibility

        
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Referer": "https://bunchatv4.net/",
        }
        try:
            r = await client.get(url, headers=headers)
            if r.status_code == 200:
                content_type = r.headers.get("content-type", "application/octet-stream")
                
                # If it's a playlist, rewrite paths
                if "mpegurl" in content_type or "m3u8" in content_type or url.endswith(".m3u8"):
                    content = r.text
                    lines = []
                    for line in content.splitlines():
                        stripped = line.strip()
                        if stripped and not stripped.startswith('#'):
                            full_url = urljoin(url, stripped)
                            lines.append(f"/api/proxy/stream?url={full_url}")
                        else:
                            lines.append(line)
                    
                    return Response(
                        content="\n".join(lines),
                        media_type="application/vnd.apple.mpegurl",
                        headers={
                            "Access-Control-Allow-Origin": "*",
                            "Cache-Control": "no-cache",
                        }
                    )
                else:
                    # Binary data (segments like .ts)
                    return Response(
                        content=r.content,
                        media_type=content_type,
                        headers={
                            "Access-Control-Allow-Origin": "*",
                            "Cache-Control": "public, max-age=3600",
                        }
                    )
            else:
                raise HTTPException(status_code=r.status_code, detail=f"Upstream returned {r.status_code}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching stream: {str(e)}")
