import urllib.request

routes = [
    "/",
    "/login",
    "/admin/dashboard",
    "/admin/books",
    "/student/dashboard",
    "/about",
    "/unauthorized"
]

base = "https://libranest-ui.onrender.com"

print("--- Testing Frontend SPA Routing ---")
for r in routes:
    url = base + r
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            print(f"GET {r} -> HTTP {resp.status} (Length: {len(content)}, Has div id=root: {'id=\"root\"' in content})")
    except urllib.error.HTTPError as e:
        print(f"GET {r} -> HTTP ERROR {e.code}")
