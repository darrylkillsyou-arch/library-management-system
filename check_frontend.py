import urllib.request
import re

url = "https://libranest-ui.onrender.com"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')
    print("Status:", resp.status)
    print("HTML length:", len(html))
    print("Title in HTML:", "LibraNest" in html)

js_files = re.findall(r'src="(/assets/[^"]+)"', html)
print("JS assets found:", js_files)
for js in js_files:
    js_url = url + js
    req_js = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req_js) as r:
        content = r.read().decode('utf-8')
        has_api = "libranest-api.onrender.com" in content
        has_local = "localhost:8000" in content
        print(f"{js}: contains libranest-api={has_api}, contains localhost:8000={has_local}")
