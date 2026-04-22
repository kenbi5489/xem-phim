import requests
import json
resp = requests.get("https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1")
print(json.dumps(resp.json(), indent=2)[:500])
