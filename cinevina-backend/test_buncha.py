import httpx
from bs4 import BeautifulSoup

def test_buncha_match():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://bunchatv4.net/",
    }
    url = "https://bunchatv4.net/truc-tiep/zamalek-sc-vs-enppi-2100-27-04-2026/601411597"
    try:
        resp = httpx.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        print("--- Streams Found ---")
        for div in soup.find_all('div', class_='box-chose-stream'):
            fileurl = div.get('data-fileurl', '')
            channel = div.get('data-channel', '')
            name = div.get_text(strip=True)
            print(f"- {name} | URL: {fileurl} | Channel: {channel}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_buncha_match()
