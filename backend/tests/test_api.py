"""
Backend tests for LibraNest API.
Run: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.auth import hash_password
from app import models

TEST_DATABASE_URL = "sqlite:///./test_libranest.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Enable FK for test db
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_pragma(conn, rec):
        conn.execute("PRAGMA foreign_keys=ON")

    # Create admin
    admin = models.Member(
        full_name="Test Admin",
        roll_number="ADMIN001",
        email="admin@test.com",
        password_hash=hash_password("Admin@123"),
        role="admin",
        department="Library",
        programme="Admin",
        status="active",
    )
    db.add(admin)

    # Create students
    s1 = models.Member(
        full_name="Student One",
        roll_number="STU001",
        email="student1@test.com",
        password_hash=hash_password("Student@123"),
        role="student",
        department="CSE",
        programme="B.Tech",
        status="active",
    )
    s2 = models.Member(
        full_name="Student Two",
        roll_number="STU002",
        email="student2@test.com",
        password_hash=hash_password("Student@123"),
        role="student",
        department="CSE",
        programme="B.Tech",
        status="active",
    )
    db.add_all([s1, s2])

    # Author, Category, Book, Copies
    author = models.Author(name="Test Author")
    cat = models.Category(name="Test Category")
    db.add_all([author, cat])
    db.flush()

    book = models.Book(
        isbn="978-0-00-000001-0", title="Test Book", author_id=author.id,
        category_id=cat.id, publication_year=2020,
    )
    db.add(book)
    db.flush()

    for i in range(1, 4):
        copy = models.BookCopy(book_id=book.id, accession_number=f"TEST{i:03d}", status="Available")
        db.add(copy)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


def get_token(client, email, password):
    resp = client.post("/api/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def admin_headers(client):
    token = get_token(client, "admin@test.com", "Admin@123")
    return {"Authorization": f"Bearer {token}"}


def student_headers(client, n=1):
    token = get_token(client, f"student{n}@test.com", "Student@123")
    return {"Authorization": f"Bearer {token}"}


# ─── Test 1: Health Check ─────────────────────────────────────────────────────
def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ─── Test 2: Admin Login ──────────────────────────────────────────────────────
def test_admin_login(client):
    r = client.post("/api/auth/login", data={"username": "admin@test.com", "password": "Admin@123"})
    assert r.status_code == 200
    data = r.json()
    assert data["role"] == "admin"
    assert "access_token" in data


# ─── Test 3: Student Login ────────────────────────────────────────────────────
def test_student_login(client):
    r = client.post("/api/auth/login", data={"username": "student1@test.com", "password": "Student@123"})
    assert r.status_code == 200
    assert r.json()["role"] == "student"


# ─── Test 4: Invalid Login ────────────────────────────────────────────────────
def test_invalid_login(client):
    r = client.post("/api/auth/login", data={"username": "wrong@test.com", "password": "wrongpass"})
    assert r.status_code == 401


# ─── Test 5: Create Book (Admin) ──────────────────────────────────────────────
def test_create_book_admin(client):
    db = TestingSessionLocal()
    author_id = db.query(models.Author).first().id
    cat_id = db.query(models.Category).first().id
    db.close()
    r = client.post("/api/books", json={
        "isbn": "978-0-00-000002-0",
        "title": "New Test Book",
        "author_id": author_id,
        "category_id": cat_id,
        "publication_year": 2021,
    }, headers=admin_headers(client))
    assert r.status_code == 201


# ─── Test 6: Create Member ────────────────────────────────────────────────────
def test_create_member(client):
    r = client.post("/api/members", json={
        "full_name": "New Student",
        "roll_number": "STU999",
        "email": "newstudent@test.com",
        "password": "Student@123",
        "role": "student",
        "department": "CSE",
        "programme": "B.Tech",
        "status": "active",
    }, headers=admin_headers(client))
    assert r.status_code == 201


# ─── Test 7: Issue Book ───────────────────────────────────────────────────────
def test_issue_book(client):
    db = TestingSessionLocal()
    student = db.query(models.Member).filter(models.Member.email == "student1@test.com").first()
    copy = db.query(models.BookCopy).filter(models.BookCopy.status == "Available").first()
    sid = student.id
    cid = copy.id
    db.close()

    r = client.post("/api/loans", json={
        "member_id": sid,
        "copy_id": cid,
    }, headers=admin_headers(client))
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["member_id"] == sid
    assert data["copy_id"] == cid
    return data["id"], cid


# ─── Test 8: Copy becomes Issued ─────────────────────────────────────────────
def test_copy_becomes_issued(client):
    db = TestingSessionLocal()
    copy = db.query(models.BookCopy).filter(models.BookCopy.status == "Issued").first()
    assert copy is not None, "No issued copy found"
    db.close()


# ─── Test 9: Issue second book (different copy) ───────────────────────────────
def test_issue_second_book(client):
    db = TestingSessionLocal()
    student = db.query(models.Member).filter(models.Member.email == "student1@test.com").first()
    copy = db.query(models.BookCopy).filter(models.BookCopy.status == "Available").first()
    sid = student.id
    cid = copy.id
    db.close()

    r = client.post("/api/loans", json={
        "member_id": sid,
        "copy_id": cid,
    }, headers=admin_headers(client))
    assert r.status_code == 201, r.text


# ─── Test 10: Reject Third Loan ───────────────────────────────────────────────
def test_reject_third_loan(client):
    db = TestingSessionLocal()
    student = db.query(models.Member).filter(models.Member.email == "student1@test.com").first()
    copy = db.query(models.BookCopy).filter(models.BookCopy.status == "Available").first()
    sid = student.id
    cid = copy.id if copy else None
    db.close()

    if cid is None:
        pytest.skip("No available copy for third loan test")

    r = client.post("/api/loans", json={
        "member_id": sid,
        "copy_id": cid,
    }, headers=admin_headers(client))
    assert r.status_code == 400
    assert "Maximum" in r.json()["detail"] or "active loan" in r.json()["detail"].lower()


# ─── Test 11: Return Book ─────────────────────────────────────────────────────
def test_return_book(client):
    db = TestingSessionLocal()
    loan = db.query(models.Loan).filter(models.Loan.returned_on.is_(None)).first()
    if not loan:
        pytest.skip("No active loan")
    lid = loan.id
    db.close()

    r = client.post(f"/api/loans/{lid}/return", json={}, headers=admin_headers(client))
    assert r.status_code == 200
    data = r.json()
    assert data["returned_on"] is not None


# ─── Test 12: Copy Available After Return ────────────────────────────────────
def test_copy_available_after_return(client):
    db = TestingSessionLocal()
    # At least one copy should be available again
    available = db.query(models.BookCopy).filter(models.BookCopy.status == "Available").count()
    assert available > 0
    db.close()


# ─── Test 13: 14-day due date calculation ────────────────────────────────────
def test_due_date_calculation(client):
    db = TestingSessionLocal()
    loan = db.query(models.Loan).order_by(models.Loan.id.desc()).first()
    if loan:
        delta = (loan.due_on - loan.issued_on).days
        assert delta == 14, f"Expected 14-day loan, got {delta}"
    db.close()


# ─── Test 14: Fine calculation ────────────────────────────────────────────────
def test_fine_calculation():
    from app.utils import calculate_fine
    from datetime import datetime
    due = datetime(2026, 10, 1)
    returned = datetime(2026, 10, 5)  # 4 days late
    fine, days, overdue = calculate_fine(due, returned)
    assert days == 4
    assert fine == 8.0
    assert overdue is True


# ─── Test 15: On-time return = zero fine ─────────────────────────────────────
def test_zero_fine_on_time():
    from app.utils import calculate_fine
    from datetime import datetime
    due = datetime(2026, 10, 5)
    returned = datetime(2026, 10, 5)  # on time
    fine, days, overdue = calculate_fine(due, returned)
    assert fine == 0.0
    assert days == 0
    assert overdue is False


# ─── Test 16: Student cannot access other student records ────────────────────
def test_student_cannot_access_other_student(client):
    db = TestingSessionLocal()
    s2 = db.query(models.Member).filter(models.Member.email == "student2@test.com").first()
    s2_id = s2.id
    db.close()

    r = client.get(f"/api/members/{s2_id}", headers=student_headers(client, 1))
    assert r.status_code == 403


# ─── Test 17: Unauthorized admin API is denied ───────────────────────────────
def test_unauthorized_admin_api(client):
    r = client.get("/api/members", headers=student_headers(client, 1))
    assert r.status_code == 403


# ─── Test 18: Dashboard accessible by admin ──────────────────────────────────
def test_dashboard_admin(client):
    r = client.get("/api/dashboard", headers=admin_headers(client))
    assert r.status_code == 200
    data = r.json()
    assert "metrics" in data
    assert data["metrics"]["total_members"] >= 1


# ─── Test 19: Dashboard denied to student ────────────────────────────────────
def test_dashboard_denied_student(client):
    r = client.get("/api/dashboard", headers=student_headers(client, 1))
    assert r.status_code == 403
