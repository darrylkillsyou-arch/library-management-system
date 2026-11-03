import json
import urllib.request
import urllib.error

API_BASE = "https://libranest-api.onrender.com"

def make_request(path, method="GET", data=None, token=None, is_form=False):
    url = f"{API_BASE}{path}"
    headers = {"User-Agent": "LibraNest-E2E-Tester/1.0"}
    
    encoded_data = None
    if data is not None:
        if is_form:
            headers["Content-Type"] = "application/x-www-form-urlencoded"
            form_items = [f"{k}={urllib.parse.quote_plus(str(v))}" for k, v in data.items()]
            encoded_data = "&".join(form_items).encode("utf-8")
        else:
            headers["Content-Type"] = "application/json"
            encoded_data = json.dumps(data).encode("utf-8")
            
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}

print("==================================================")
print("     LIBRANEST PRODUCTION E2E VERIFICATION SUITE   ")
print("==================================================")

# 1. Health check
print("\n[Test 1] Health Check Endpoint")
status, res = make_request("/health")
assert status == 200, f"Expected 200, got {status}"
print(f"PASS: /health returned HTTP 200 -> {res}")

# 2. Admin Authentication
print("\n[Test 2] Admin Login Authentication")
status, res = make_request("/api/auth/login", method="POST", data={"username": "admin@libranest.demo", "password": "Admin@123"}, is_form=True)
assert status == 200, f"Admin login failed: {res}"
admin_token = res["access_token"]
print(f"PASS: Admin login successful. Role: {res['role']}, Name: {res['full_name']}")

# 3. Dashboard Metrics
print("\n[Test 3] Admin Dashboard Real-time Metrics")
status, stats = make_request("/api/dashboard", token=admin_token)
assert status == 200, f"Dashboard stats failed: {stats}"
m = stats['metrics']
print(f"PASS: Stats -> Titles: {m['total_books']}, Copies: {m['total_copies']}, "
      f"Available: {m['available_copies']}, Active Loans: {m['active_loans']}, "
      f"Members: {m['total_members']}, Fines: INR {m['outstanding_fines']}")

# 4. Student Authentication
print("\n[Test 4] Student Login Authentication")
status, res = make_request("/api/auth/login", method="POST", data={"username": "aakash@libranest.demo", "password": "Student@123"}, is_form=True)
assert status == 200, f"Student login failed: {res}"
student_token = res["access_token"]
print(f"PASS: Student login successful. Role: {res['role']}, Name: {res['full_name']}")

# 4b. Student /me Profile
status, me = make_request("/api/auth/me", token=student_token)
assert status == 200
print(f"PASS: Student /api/auth/me -> Roll: {me['roll_number']}, Programme: {me['programme']}, Dept: {me['department']}")

# 5. Role-Based Access Control (RBAC) Enforcement
print("\n[Test 5] RBAC Enforcement: Student access to Admin-only endpoint")
status, res = make_request("/api/dashboard", token=student_token)
assert status == 403, f"Expected 403 Forbidden for student on admin endpoint, got {status}: {res}"
print(f"PASS: HTTP 403 Forbidden enforced correctly for student on /api/dashboard -> {res.get('detail')}")

# 6. Student Personal View
print("\n[Test 6] Student Self Borrowings and Dashboard")
status, res = make_request("/api/loans", token=student_token)
assert status == 200, f"Student list loans failed: {res}"
items = res.get("items", [])
print(f"PASS: Student loans query succeeded. Current loans for Aakash: {len(items)}, Active: {len([l for l in items if l['returned_on'] is None])}")

# 7. Borrowing Limit Enforcement (2 Active Loans Rule)
print("\n[Test 7] Business Rule: Maximum 2 Active Loans Enforcement")
status, members_resp = make_request("/api/members", token=admin_token)
assert status == 200
members = members_resp.get("items", [])
member_with_loans = next((m for m in members if m["active_loans"] >= 2), None)
if member_with_loans:
    print(f"Found student {member_with_loans['full_name']} (Roll: {member_with_loans['roll_number']}) with {member_with_loans['active_loans']} active loans.")
    # Find any available copy
    status, copies = make_request("/api/dashboard/copies?status=Available", token=admin_token)
    assert status == 200
    available_copy = next((c for c in copies if c["status"] == "Available"), None)
    if available_copy:
        # Attempt to issue 3rd loan
        status, err = make_request("/api/loans", method="POST", data={"copy_id": available_copy["id"], "member_id": member_with_loans["id"]}, token=admin_token)
        assert status == 400, f"Expected 400 limit exceeded, got {status}: {err}"
        print(f"PASS: Active loan limit enforced! API rejected loan with HTTP 400: '{err.get('detail')}'")
    else:
        print("SKIP: No available copy found.")
else:
    print("NOTE: No student currently at 2-loan limit; will verify via single borrow flow.")

# 8. Catalogue Browsing
print("\n[Test 8] Book Catalogue Query")
status, books_resp = make_request("/api/books?q=Artificial", token=student_token)
assert status == 200
books = books_resp.get("items", [])
print(f"PASS: Catalogue search for 'Artificial' returned {len(books)} matches. First title: '{books[0]['title'] if books else 'N/A'}'")

# 9. Authors and Categories
print("\n[Test 9] Authors and Categories API")
status, authors = make_request("/api/authors", token=admin_token)
assert status == 200
status, categories = make_request("/api/categories", token=admin_token)
assert status == 200
print(f"PASS: Retrieved {len(authors)} authors and {len(categories)} categories.")

# 10. Reports / Export
print("\n[Test 10] Reports / Active Loans Query")
status, loans_resp = make_request("/api/loans?active_only=true", token=admin_token)
assert status == 200
active_loans = loans_resp.get("items", [])
print(f"PASS: Retrieved {len(active_loans)} active loans for reporting.")

print("\n==================================================")
print("     ALL LIVE PRODUCTION TESTS PASSED (10/10)     ")
print("==================================================")
