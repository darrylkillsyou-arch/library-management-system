from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, ForeignKey, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Author(Base):
    __tablename__ = "authors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)

    books = relationship("Book", back_populates="author")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)

    books = relationship("Book", back_populates="category")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String(20), nullable=False, unique=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("authors.id", ondelete="RESTRICT"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    publisher = Column(String(200))
    publication_year = Column(Integer)
    description = Column(Text)
    cover_url = Column(String(500))
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    author = relationship("Author", back_populates="books")
    category = relationship("Category", back_populates="books")
    copies = relationship("BookCopy", back_populates="book")

    __table_args__ = (
        CheckConstraint("publication_year >= 1000 AND publication_year <= 2100", name="chk_pub_year"),
    )


class BookCopy(Base):
    __tablename__ = "book_copies"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="RESTRICT"), nullable=False)
    accession_number = Column(String(50), nullable=False, unique=True, index=True)
    status = Column(String(20), nullable=False, default="Available")
    shelf_location = Column(String(100))

    book = relationship("Book", back_populates="copies")
    loans = relationship("Loan", back_populates="copy")

    __table_args__ = (
        CheckConstraint("status IN ('Available', 'Issued', 'Maintenance', 'Lost')", name="chk_copy_status"),
    )


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    roll_number = Column(String(50), nullable=False, unique=True, index=True)
    email = Column(String(200), nullable=False, unique=True, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), nullable=False, default="student")
    department = Column(String(100))
    programme = Column(String(100))
    status = Column(String(20), nullable=False, default="active")
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    issued_loans = relationship("Loan", foreign_keys="Loan.issued_by", back_populates="issuing_member")
    returned_loans = relationship("Loan", foreign_keys="Loan.returned_to", back_populates="returning_member")
    borrowing_loans = relationship("Loan", foreign_keys="Loan.member_id", back_populates="member")

    __table_args__ = (
        CheckConstraint("role IN ('student', 'admin')", name="chk_member_role"),
        CheckConstraint("status IN ('active', 'inactive', 'suspended')", name="chk_member_status"),
    )


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    copy_id = Column(Integer, ForeignKey("book_copies.id", ondelete="RESTRICT"), nullable=False, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="RESTRICT"), nullable=False, index=True)
    issued_on = Column(DateTime, nullable=False)
    due_on = Column(DateTime, nullable=False)
    returned_on = Column(DateTime, nullable=True)
    issued_by = Column(Integer, ForeignKey("members.id", ondelete="RESTRICT"), nullable=False)
    returned_to = Column(Integer, ForeignKey("members.id", ondelete="RESTRICT"), nullable=True)

    copy = relationship("BookCopy", back_populates="loans")
    member = relationship("Member", foreign_keys=[member_id], back_populates="borrowing_loans")
    issuing_member = relationship("Member", foreign_keys=[issued_by], back_populates="issued_loans")
    returning_member = relationship("Member", foreign_keys=[returned_to], back_populates="returned_loans")

    __table_args__ = (
        CheckConstraint("due_on >= issued_on", name="chk_due_after_issued"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    performed_by = Column(Integer, ForeignKey("members.id", ondelete="SET NULL"), nullable=True)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
