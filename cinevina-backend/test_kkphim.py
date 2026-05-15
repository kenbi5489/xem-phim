import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://phimapi.com/v1/api/danh-sach/phim-le?page=1")
        data = resp.json()
        items = data.get("data", {}).get("items", [])
        if items:
            print("First item keys:", items[0].keys())
            print("tmdb info:", items[0].get("tmdb"))

asyncio.run(test())
