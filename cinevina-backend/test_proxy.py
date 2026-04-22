import asyncio
import httpx

async def test():
    url = "https://phimimg.com/upload/vod/20240419-1/ab15f8a25c1b52a46e10ddc8efbf80c8.jpg"
    async with httpx.AsyncClient() as client:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        req = client.build_request("GET", url, headers=headers)
        r = await client.send(req, stream=True)
        print(f"Status: {r.status_code}")
        print(f"Headers: {r.headers}")
        content = await r.aread()
        print(f"Length: {len(content)}")

asyncio.run(test())
