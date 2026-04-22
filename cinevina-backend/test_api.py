import requests
resp = requests.get("https://phimapi.com/v1/api/danh-sach/phim-moi-cap-nhat?page=1").json()
item = resp['data']['items'][0]
print("Item poster_url:", item.get('poster_url'))
print("Item thumb_url:", item.get('thumb_url'))

# What does the image prefix property say?
print("APP_DOMAIN_CDN_IMAGE:", resp['data'].get('APP_DOMAIN_CDN_IMAGE'))
