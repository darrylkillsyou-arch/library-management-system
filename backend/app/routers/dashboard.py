from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional
from ..database import get_db
from .. import models, schemas
from ..auth import require_admin, get_current_member
from ..utils import calculate_fine
from .loans import _enrich_loan

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=schemas.DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    total_books = db.query(func.count(models.Book.id)).filter(models.Book.is_archived == False).scalar() or 0
    total_copies = db.query(func.count(models.BookCopy.id)).scalar() or 0
    available_copies = db.query(func.count(models.BookCopy.id)).filter(models.BookCopy.status == "Available").scalar() or 0
    issued_copies = db.query(func.count(models.BookCopy.id)).filter(models.BookCopy.status == "Issued").scalar() or 0
    total_members = db.query(func.count(models.Member.id)).filter(models.Member.status == "active").scalar() or 0
    active_loans = db.query(func.count(models.Loan.id)).filter(models.Loan.returned_on.is_(None)).scalar() or 0

    from ..utils import now_ist
    now = now_ist()

    # Overdue = active loan where due_on < now
    all_active = db.query(models.Loan).filter(models.Loan.returned_on.is_(None)).all()
    overdue_loans = sum(1 for l in all_active if l.due_on < now)
    outstanding_fines = sum(calculate_fine(l.due_on, None)[0] for l in all_active if l.due_on < now)

    # Category distribution
    cats = db.query(models.Category).all()
    category_distribution = []
    for c in cats:
        cnt = db.query(func.count(models.Book.id)).filter(
            models.Book.category_id == c.id,
            models.Book.is_archived == False,
        ).scalar() or 0
        category_distribution.append(schemas.CategoryStat(name=c.name, book_count=cnt))

    # Recent loans (last 10)
    recent = db.query(models.Loan).options(
        joinedload(models.Loan.copy).joinedload(models.BookCopy.book),
        joinedload(models.Loan.member),
    ).order_by(models.Loan.issued_on.desc()).limit(10).all()

    return schemas.DashboardResponse(
        metrics=schemas.DashboardMetrics(
            total_books=total_books,
            total_copies=total_copies,
            available_copies=available_copies,
            issued_copies=issued_copies,
            total_members=total_members,
            active_loans=active_loans,
            overdue_loans=overdue_loans,
            outstanding_fines=outstanding_fines,
        ),
        category_distribution=category_distribution,
        recent_loans=[_enrich_loan(l, db) for l in recent],
    )


@router.get("/copies", response_model=list[schemas.BookCopyOut])
def list_all_copies(
    q: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    query = db.query(models.BookCopy).options(joinedload(models.BookCopy.book))
    if q:
        query = query.filter(models.BookCopy.accession_number.ilike(f"%{q}%"))
    if status_filter:
        query = query.filter(models.BookCopy.status == status_filter)
    return query.order_by(models.BookCopy.accession_number).all()


@router.get("/audit", response_model=list[schemas.AuditLogOut])
def list_audit_logs(
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    return db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(limit).all()
