from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RoleEnum(str, Enum):
    student = "student"
    admin = "admin"


class StatusEnum(str, Enum):
    active = "active"
    inactive = "inactive"
    suspended = "suspended"


class CopyStatusEnum(str, Enum):
    available = "Available"
    issued = "Issued"
    maintenance = "Maintenance"
    lost = "Lost"


# ─── Auth ─────────────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    member_id: int
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ─── Author ───────────────────────────────────────────────────────────────────
class AuthorBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)


class AuthorCreate(AuthorBase):
    pass


class AuthorUpdate(AuthorBase):
    pass


class AuthorOut(AuthorBase):
    id: int
    book_count: Optional[int] = 0

    model_config = {"from_attributes": True}


# ─── Category ─────────────────────────────────────────────────────────────────
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int
    book_count: Optional[int] = 0

    model_config = {"from_attributes": True}


# ─── Book ─────────────────────────────────────────────────────────────────────
class BookBase(BaseModel):
    isbn: str = Field(..., min_length=1, max_length=20)
    title: str = Field(..., min_length=1, max_length=300)
    author_id: int
    category_id: int
    publisher: Optional[str] = None
    publication_year: Optional[int] = Field(None, ge=1000, le=2100)
    description: Optional[str] = None
    cover_url: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    isbn: Optional[str] = None
    title: Optional[str] = None
    author_id: Optional[int] = None
    category_id: Optional[int] = None
    publisher: Optional[str] = None
    publication_year: Optional[int] = Field(None, ge=1000, le=2100)
    description: Optional[str] = None
    cover_url: Optional[str] = None
    is_archived: Optional[bool] = None


class BookOut(BookBase):
    id: int
    is_archived: bool
    created_at: datetime
    author: Optional[AuthorOut] = None
    category: Optional[CategoryOut] = None
    total_copies: Optional[int] = 0
    available_copies: Optional[int] = 0
    issued_copies: Optional[int] = 0

    model_config = {"from_attributes": True}


# ─── BookCopy ─────────────────────────────────────────────────────────────────
class BookCopyBase(BaseModel):
    accession_number: str = Field(..., min_length=1, max_length=50)
    status: CopyStatusEnum = CopyStatusEnum.available
    shelf_location: Optional[str] = None


class BookCopyCreate(BookCopyBase):
    book_id: int


class BookCopyUpdate(BaseModel):
    accession_number: Optional[str] = None
    status: Optional[CopyStatusEnum] = None
    shelf_location: Optional[str] = None


class BookCopyOut(BookCopyBase):
    id: int
    book_id: int
    book: Optional[BookOut] = None

    model_config = {"from_attributes": True}


# ─── Member ───────────────────────────────────────────────────────────────────
class MemberBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)
    roll_number: str = Field(..., min_length=1, max_length=50)
    email: str = Field(..., min_length=5, max_length=200)
    role: RoleEnum = RoleEnum.student
    department: Optional[str] = None
    programme: Optional[str] = None
    status: StatusEnum = StatusEnum.active


class MemberCreate(MemberBase):
    password: str = Field(..., min_length=6)


class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    programme: Optional[str] = None
    status: Optional[StatusEnum] = None
    password: Optional[str] = Field(None, min_length=6)


class MemberOut(MemberBase):
    id: int
    joined_at: datetime
    active_loans: Optional[int] = 0

    model_config = {"from_attributes": True}


# ─── Loan ─────────────────────────────────────────────────────────────────────
class LoanCreate(BaseModel):
    copy_id: int
    member_id: int
    issued_on: Optional[datetime] = None  # defaults to now


class LoanReturn(BaseModel):
    returned_on: Optional[datetime] = None  # defaults to now


class LoanOut(BaseModel):
    id: int
    copy_id: int
    member_id: int
    issued_on: datetime
    due_on: datetime
    returned_on: Optional[datetime] = None
    issued_by: int
    returned_to: Optional[int] = None
    fine_amount: Optional[float] = 0.0
    is_overdue: Optional[bool] = False
    overdue_days: Optional[int] = 0

    # nested
    copy: Optional[BookCopyOut] = None
    member: Optional[MemberOut] = None

    model_config = {"from_attributes": True}


# ─── Dashboard ────────────────────────────────────────────────────────────────
class DashboardMetrics(BaseModel):
    total_books: int
    total_copies: int
    available_copies: int
    issued_copies: int
    total_members: int
    active_loans: int
    overdue_loans: int
    outstanding_fines: float


class CategoryStat(BaseModel):
    name: str
    book_count: int


class DashboardResponse(BaseModel):
    metrics: DashboardMetrics
    category_distribution: List[CategoryStat]
    recent_loans: List[LoanOut]


# ─── Pagination ───────────────────────────────────────────────────────────────
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    pages: int


# ─── Audit ────────────────────────────────────────────────────────────────────
class AuditLogOut(BaseModel):
    id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    performed_by: Optional[int] = None
    details: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
