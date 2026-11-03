import json
import urllib.request
import re

with open(r"C:\Users\ACER\.render\cli.yaml") as f:
    text = f.read()

key_match = re.search(r"key:\s*([^\s]+)", text)
api_key = key_match.group(1)
service_id = "srv-dbku7gjbc2fs73acb79g"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

# 1. Get current env vars
req = urllib.request.Request(f"https://api.render.com/v1/services/{service_id}/env-vars", headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        current_vars = json.loads(resp.read().decode())
        print("Current env vars:", current_vars)
except Exception as e:
    print("Error fetching env vars:", e)

# 2. Put VITE_API_BASE_URL
env_data = [
    {
        "key": "VITE_API_BASE_URL",
        "value": "https://libranest-api.onrender.com"
    }
]

put_req = urllib.request.Request(
    f"https://api.render.com/v1/services/{service_id}/env-vars",
    data=json.dumps(env_data).encode("utf-8"),
    headers=headers,
    method="PUT"
)

try:
    with urllib.request.urlopen(put_req) as resp:
        result = json.loads(resp.read().decode())
        print("Updated env vars:", result)
except urllib.error.HTTPError as e:
    print("HTTP error updating env vars:", e.code, e.read().decode())

# 3. Trigger a deploy with clearCache: "clear"
deploy_req = urllib.request.Request(
    f"https://api.render.com/v1/services/{service_id}/deploys",
    data=json.dumps({"clearCache": "clear"}).encode("utf-8"),
    headers=headers,
    method="POST"
)

try:
    with urllib.request.urlopen(deploy_req) as resp:
        deploy_res = json.loads(resp.read().decode())
        print("Deploy triggered:", deploy_res.get("id"), deploy_res.get("status"))
except urllib.error.HTTPError as e:
    print("HTTP error triggering deploy:", e.code, e.read().decode())
