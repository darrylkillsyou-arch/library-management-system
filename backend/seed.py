"""
Idempotent seed script for LibraNest development/demo data.
Run: py seed.py
Demo credentials are documented in README.md.
This script is for demonstration only — do NOT use in production with real user data.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app import models
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed():
    # Guard: only seed if DB is empty
    if db.query(models.Member).count() > 0:
        print("Database already has data. Skipping seed to avoid overwriting. Use --force to re-seed.")
        if "--force" not in sys.argv:
            db.close()
            return

        if "--force" in sys.argv:
            print("Force flag detected. Clearing existing data...")
            db.query(models.AuditLog).delete()
            db.query(models.Loan).delete()
            db.query(models.BookCopy).delete()
            db.query(models.Book).delete()
            db.query(models.Author).delete()
            db.query(models.Category).delete()
            db.query(models.Member).delete()
            db.commit()

    print("Seeding database...")

    # ─── Categories ───────────────────────────────────────────────────────────
    categories_data = [
        "Artificial Intelligence",
        "Machine Learning",
        "Database Systems",
        "Computer Networks",
        "Software Engineering",
        "Data Structures & Algorithms",
        "Operating Systems",
        "Mathematics",
        "Computer Architecture",
        "General Education",
    ]
    categories = {}
    for name in categories_data:
        cat = models.Category(name=name)
        db.add(cat)
        db.flush()
        categories[name] = cat
    db.commit()

    # ─── Authors ──────────────────────────────────────────────────────────────
    authors_data = [
        "Stuart Russell", "Peter Norvig", "Ian Goodfellow", "Yoshua Bengio",
        "Aaron Courville", "Abraham Silberschatz", "Henry Korth", "S. Sudarshan",
        "Andrew Tanenbaum", "David Wetherall", "Thomas Cormen", "Charles Leiserson",
        "Ronald Rivest", "Clifford Stein", "William Stallings", "James Kurose",
        "Keith Ross", "Ramez Elmasri", "Shamkant Navathe", "Christopher Bishop",
    ]
    authors = {}
    for name in authors_data:
        a = models.Author(name=name)
        db.add(a)
        db.flush()
        authors[name] = a
    db.commit()

    # ─── Books ────────────────────────────────────────────────────────────────
    books_data = [
        {
            "isbn": "978-0-13-604259-4",
            "title": "Artificial Intelligence: A Modern Approach",
            "author": "Stuart Russell",
            "category": "Artificial Intelligence",
            "publisher": "Pearson",
            "year": 2020,
            "description": "The leading textbook in AI. Used in over 1500 universities in 135 countries.",
        },
        {
            "isbn": "978-0-26-203561-3",
            "title": "Deep Learning",
            "author": "Ian Goodfellow",
            "category": "Machine Learning",
            "publisher": "MIT Press",
            "year": 2016,
            "description": "An introduction to a broad range of topics in deep learning, covering mathematical and conceptual background.",
        },
        {
            "isbn": "978-0-07-352332-3",
            "title": "Database System Concepts",
            "author": "Abraham Silberschatz",
            "category": "Database Systems",
            "publisher": "McGraw-Hill",
            "year": 2019,
            "description": "Comprehensive text on database systems concepts, theory, and practice.",
        },
        {
            "isbn": "978-0-13-359162-1",
            "title": "Computer Networks",
            "author": "Andrew Tanenbaum",
            "category": "Computer Networks",
            "publisher": "Pearson",
            "year": 2021,
            "description": "A thorough introduction to computer networks and the protocols used in the internet.",
        },
        {
            "isbn": "978-0-26-204630-5",
            "title": "Introduction to Algorithms",
            "author": "Thomas Cormen",
            "category": "Data Structures & Algorithms",
            "publisher": "MIT Press",
            "year": 2022,
            "description": "The most widely used algorithms textbook — known as CLRS.",
        },
        {
            "isbn": "978-0-13-468599-1",
            "title": "Computer Organization and Architecture",
            "author": "William Stallings",
            "category": "Computer Architecture",
            "publisher": "Pearson",
            "year": 2019,
            "description": "Design, performance, and analysis of computer systems at the instruction set architecture level.",
        },
        {
            "isbn": "978-0-13-285620-1",
            "title": "Computer Networking: A Top-Down Approach",
            "author": "James Kurose",
            "category": "Computer Networks",
            "publisher": "Pearson",
            "year": 2021,
            "description": "Uses a top-down approach — application layer first — to teach networking principles.",
        },
        {
            "isbn": "978-0-13-600353-3",
            "title": "Fundamentals of Database Systems",
            "author": "Ramez Elmasri",
            "category": "Database Systems",
            "publisher": "Pearson",
            "year": 2015,
            "description": "A comprehensive introduction to database systems emphasizing the fundamentals of database modeling and design.",
        },
        {
            "isbn": "978-0-07-038476-7",
            "title": "Operating System Concepts",
            "author": "Abraham Silberschatz",
            "category": "Operating Systems",
            "publisher": "Wiley",
            "year": 2018,
            "description": "Covers all concepts of modern operating systems with real-world examples.",
        },
        {
            "isbn": "978-0-13-110362-7",
            "title": "Pattern Recognition and Machine Learning",
            "author": "Christopher Bishop",
            "category": "Machine Learning",
            "publisher": "Springer",
            "year": 2006,
            "description": "Comprehensive textbook on pattern recognition and machine learning methods.",
        },
        {
            "isbn": "978-0-13-468862-6",
            "title": "Software Engineering",
            "author": "Ian Goodfellow",
            "category": "Software Engineering",
            "publisher": "Pearson",
            "year": 2015,
            "description": "Comprehensive guide to software engineering principles, methods, and tools.",
        },
        {
            "isbn": "978-0-32-157351-3",
            "title": "Machine Learning: A Probabilistic Perspective",
            "author": "Christopher Bishop",
            "category": "Machine Learning",
            "publisher": "MIT Press",
            "year": 2012,
            "description": "A comprehensive introduction to machine learning based on a unified probabilistic approach.",
        },
        {
            "isbn": "978-0-13-438477-7",
            "title": "Modern Operating Systems",
            "author": "Andrew Tanenbaum",
            "category": "Operating Systems",
            "publisher": "Pearson",
            "year": 2014,
            "description": "Modern treatment of operating systems theory and implementation.",
        },
        {
            "isbn": "978-1-59-327584-6",
            "title": "The Art of Problem Solving",
            "author": "Thomas Cormen",
            "category": "Mathematics",
            "publisher": "AoPS Incorporated",
            "year": 2011,
            "description": "Building mathematical problem-solving skills relevant to computer science.",
        },
        {
            "isbn": "978-0-13-235088-4",
            "title": "Discrete Mathematics and Its Applications",
            "author": "Kenneth Rosen",
            "category": "Mathematics",
            "publisher": "McGraw-Hill",
            "year": 2018,
            "description": "Covers logic, proofs, sets, functions, graph theory, combinatorics, and number theory.",
        },
        {
            "isbn": "978-0-13-461067-3",
            "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
            "author": "Stuart Russell",
            "category": "Software Engineering",
            "publisher": "Prentice Hall",
            "year": 2008,
            "description": "Principles and practices for writing clean, readable, and maintainable code.",
        },
        {
            "isbn": "978-0-20-163361-0",
            "title": "Design Patterns: Elements of Reusable Object-Oriented Software",
            "author": "James Kurose",
            "category": "Software Engineering",
            "publisher": "Addison-Wesley",
            "year": 1994,
            "description": "The classic Gang of Four book on design patterns for software development.",
        },
        {
            "isbn": "978-1-49-197110-8",
            "title": "Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow",
            "author": "Yoshua Bengio",
            "category": "Machine Learning",
            "publisher": "O'Reilly",
            "year": 2019,
            "description": "Practical guide to machine learning using Python and TensorFlow.",
        },
        {
            "isbn": "978-0-13-110362-8",
            "title": "Introduction to the Theory of Computation",
            "author": "Ronald Rivest",
            "category": "Data Structures & Algorithms",
            "publisher": "Cengage Learning",
            "year": 2012,
            "description": "Comprehensive coverage of automata, computability theory, and complexity theory.",
        },
        {
            "isbn": "978-0-47-178460-0",
            "title": "General Education for Engineers",
            "author": "Peter Norvig",
            "category": "General Education",
            "publisher": "Wiley",
            "year": 2020,
            "description": "Holistic education topics including communication, ethics, and professional development for engineers.",
        },
    ]

    # Add missing author
    if "Kenneth Rosen" not in authors:
        a = models.Author(name="Kenneth Rosen")
        db.add(a)
        db.flush()
        authors["Kenneth Rosen"] = a
        db.commit()

    books = {}
    for bd in books_data:
        b = models.Book(
            isbn=bd["isbn"],
            title=bd["title"],
            author_id=authors[bd["author"]].id,
            category_id=categories[bd["category"]].id,
            publisher=bd.get("publisher"),
            publication_year=bd.get("year"),
            description=bd.get("description"),
        )
        db.add(b)
        db.flush()
        books[bd["isbn"]] = b
    db.commit()

    # ─── Copies ───────────────────────────────────────────────────────────────
    copy_map = {}
    copies_per_book = {
        "978-0-13-604259-4": ["ACC001", "ACC002", "ACC003"],
        "978-0-26-203561-3": ["ACC004", "ACC005"],
        "978-0-07-352332-3": ["ACC006", "ACC007", "ACC008"],
        "978-0-13-359162-1": ["ACC009", "ACC010"],
        "978-0-26-204630-5": ["ACC011", "ACC012", "ACC013"],
        "978-0-13-468599-1": ["ACC014", "ACC015"],
        "978-0-13-285620-1": ["ACC016", "ACC017"],
        "978-0-13-600353-3": ["ACC018", "ACC019"],
        "978-0-07-038476-7": ["ACC020", "ACC021"],
        "978-0-13-110362-7": ["ACC022", "ACC023"],
        "978-0-13-468862-6": ["ACC024"],
        "978-0-32-157351-3": ["ACC025", "ACC026"],
        "978-0-13-438477-7": ["ACC027"],
        "978-1-59-327584-6": ["ACC028"],
        "978-0-13-235088-4": ["ACC029", "ACC030"],
        "978-0-13-461067-3": ["ACC031"],
        "978-0-20-163361-0": ["ACC032"],
        "978-1-49-197110-8": ["ACC033", "ACC034"],
        "978-0-13-110362-8": ["ACC035"],
        "978-0-47-178460-0": ["ACC036"],
    }

    shelf_locations = {
        "978-0-13-604259-4": "A1", "978-0-26-203561-3": "A2", "978-0-07-352332-3": "B1",
        "978-0-13-359162-1": "C1", "978-0-26-204630-5": "D1", "978-0-13-468599-1": "E1",
        "978-0-13-285620-1": "C2", "978-0-13-600353-3": "B2", "978-0-07-038476-7": "F1",
        "978-0-13-110362-7": "A3", "978-0-13-468862-6": "G1", "978-0-32-157351-3": "A4",
        "978-0-13-438477-7": "F2", "978-1-59-327584-6": "H1", "978-0-13-235088-4": "H2",
        "978-0-13-461067-3": "G2", "978-0-20-163361-0": "G3", "978-1-49-197110-8": "A5",
        "978-0-13-110362-8": "D2", "978-0-47-178460-0": "I1",
    }

    for isbn, accessions in copies_per_book.items():
        for acc in accessions:
            copy = models.BookCopy(
                book_id=books[isbn].id,
                accession_number=acc,
                status="Available",
                shelf_location=shelf_locations.get(isbn, "General"),
            )
            db.add(copy)
            db.flush()
            copy_map[acc] = copy
    db.commit()

    # ─── Admin ────────────────────────────────────────────────────────────────
    admin = models.Member(
        full_name="Dr. Rajesh Kumar",
        roll_number="ADMIN001",
        email="admin@libranest.demo",
        password_hash=hash_password("Admin@123"),
        role="admin",
        department="Library",
        programme="Administration",
        status="active",
        joined_at=datetime(2024, 1, 1),
    )
    db.add(admin)
    db.flush()
    db.commit()

    # ─── Students ─────────────────────────────────────────────────────────────
    students_data = [
        ("Aakash Mehta", "251302001", "aakash@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Bhavna Sharma", "251302002", "bhavna@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Chirag Patel", "251302003", "chirag@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Divya Nair", "251302004", "divya@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Eshan Gupta", "251302005", "eshan@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Farida Khan", "251302006", "farida@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Gaurav Yadav", "251302007", "gaurav@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Harsha Reddy", "251302008", "harsha@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Ishaan Verma", "251302009", "ishaan@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Jyoti Singh", "251302010", "jyoti@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Karan Joshi", "251302011", "karan@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
        ("Lakshmi Iyer", "251302012", "lakshmi@libranest.demo", "Student@123", "CSE (AI & ML)", "CSE"),
    ]

    students = {}
    for full_name, roll, email, pwd, prog, dept in students_data:
        s = models.Member(
            full_name=full_name,
            roll_number=roll,
            email=email,
            password_hash=hash_password(pwd),
            role="student",
            department=dept,
            programme=prog,
            status="active",
            joined_at=datetime(2025, 8, 1),
        )
        db.add(s)
        db.flush()
        students[roll] = s
    db.commit()

    # ─── Loans ────────────────────────────────────────────────────────────────
    now = datetime.utcnow()

    def create_loan(copy_acc, student_roll, issued_days_ago, returned_days_ago=None, extra_late_days=0):
        copy = copy_map[copy_acc]
        student = students[student_roll]
        issued_on = now - timedelta(days=issued_days_ago)
        due_on = issued_on + timedelta(days=14)
        returned_on = None
        if returned_days_ago is not None:
            returned_on = now - timedelta(days=returned_days_ago)
            copy.status = "Available"
        else:
            if extra_late_days > 0 or issued_days_ago > 14:
                copy.status = "Issued"  # overdue active
            else:
                copy.status = "Issued"

        loan = models.Loan(
            copy_id=copy.id,
            member_id=student.id,
            issued_on=issued_on,
            due_on=due_on,
            returned_on=returned_on,
            issued_by=admin.id,
            returned_to=admin.id if returned_on else None,
        )
        db.add(loan)
        db.flush()
        return loan

    # Returned loans (history)
    create_loan("ACC001", "251302001", issued_days_ago=30, returned_days_ago=16)  # on time
    create_loan("ACC004", "251302002", issued_days_ago=28, returned_days_ago=14)  # on time
    create_loan("ACC006", "251302003", issued_days_ago=25, returned_days_ago=10)  # on time
    create_loan("ACC009", "251302004", issued_days_ago=20, returned_days_ago=4)   # on time
    create_loan("ACC011", "251302005", issued_days_ago=22, returned_days_ago=5)   # on time

    # Returned overdue loans (fine examples)
    # Student returned 4 days late → fine = INR 8
    create_loan("ACC016", "251302006", issued_days_ago=22, returned_days_ago=2)   # 22-14=8 days overdue when returned... adj
    # Let's do this properly:
    # issued 22 days ago, due 14 days after issue = 8 days ago, returned 2 days ago → 6 days overdue → fine=12
    create_loan("ACC018", "251302007", issued_days_ago=20, returned_days_ago=2)   # due 6 days ago, returned 2 days ago → 4 overdue → INR 8

    # Active loans (normal)
    create_loan("ACC002", "251302001", issued_days_ago=5)   # active, on time
    create_loan("ACC007", "251302003", issued_days_ago=8)   # active, on time
    create_loan("ACC012", "251302005", issued_days_ago=3)   # active, on time
    create_loan("ACC017", "251302007", issued_days_ago=6)   # active, on time

    # Active OVERDUE loans (for demo)
    create_loan("ACC020", "251302002", issued_days_ago=20)  # due 6 days ago → overdue
    create_loan("ACC022", "251302004", issued_days_ago=18)  # due 4 days ago → overdue
    create_loan("ACC025", "251302006", issued_days_ago=17)  # due 3 days ago → overdue
    create_loan("ACC029", "251302008", issued_days_ago=16)  # due 2 days ago → overdue

    # Demo two-loan limit: Aakash (251302001) already has ACC002 active. Add second.
    create_loan("ACC014", "251302001", issued_days_ago=4)   # 2nd active loan for Aakash

    db.commit()

    print("\n[SUCCESS] Database seeded successfully!")
    print("\nDemo Credentials:")
    print("-" * 50)
    print(f"  Admin:   admin@libranest.demo  /  Admin@123")
    print(f"  Student: aakash@libranest.demo /  Student@123  (2 active loans — at limit)")
    print(f"  Student: bhavna@libranest.demo /  Student@123  (overdue loan)")
    print(f"  Student: chirag@libranest.demo /  Student@123  (active loan)")
    print(f"  Student: farida@libranest.demo /  Student@123  (overdue loan)")
    print(f"  (All students share password: Student@123)")
    print("-" * 50)

    db.close()


if __name__ == "__main__":
    seed()
