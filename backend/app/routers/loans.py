from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional
from datetime import timedelta
from ..database import get_db
from .. import models, schemas
from ..auth import require_admin, get_current_member
from ..utils import now_ist, calculate_fine

router = APIRouter(prefix="/api/loans", tags=["loans"])

LOAN_DURATION_DAYS = 14
MAX_ACTIVE_LOANS = 2


def _enrich_loan(loan: models.Loan, db: Session) -> schemas.LoanOut:
    fine, overdue_days, is_overdue = calculate_fine(loan.due_on, loan.returned_on)

    copy_out = None
    if loan.copy:
        book_out = None
        if loan.copy.book:
            b = loan.copy.book
            book_out = schemas.BookOut(
                id=b.id, isbn=b.isbn, title=b.title,
                author_id=b.author_id, category_id=b.category_id,
                publisher=b.publisher, publication_year=b.publication_year,
                description=b.description, cover_url=b.cover_url,
                is_archived=b.is_archived, created_at=b.created_at,
            )
        copy_out = schemas.BookCopyOut(
            id=loan.copy.id,
            book_id=loan.copy.book_id,
            accession_number=loan.copy.accession_number,
            status=loan.copy.status,
            shelf_location=loan.copy.shelf_location,
            book=book_out,
        )

    member_out = None
    if loan.member:
        m = loan.member
        member_out = schemas.MemberOut(
            id=m.id, full_name=m.full_name, roll_number=m.roll_number,
            email=m.email, role=m.role, department=m.department,
            programme=m.programme, status=m.status, joined_at=m.joined_at,
        )

    return schemas.LoanOut(
        id=loan.id,
        copy_id=loan.copy_id,
        member_id=loan.member_id,
        issued_on=loan.issued_on,
        due_on=loan.due_on,
        returned_on=loan.returned_on,
        issued_by=loan.issued_by,
        returned_to=loan.returned_to,
        fine_amount=fine,
        is_overdue=is_overdue,
        overdue_days=overdue_days,
        copy=copy_out,
        member=member_out,
    )


@router.get("", response_model=dict)
def list_loans(
    q: Optional[str] = Query(None),
    member_id: Optional[int] = Query(None),
    active_only: Optional[bool] = Query(None),
    overdue_only: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current: models.Member = Depends(get_current_member),
):
    query = db.query(models.Loan).options(
        joinedload(models.Loan.copy).joinedload(models.BookCopy.book).joinedload(models.Book.author),
        joinedload(models.Loan.member),
    )

    # Students can only see their own loans
    if current.role == "student":
        query = query.filter(models.Loan.member_id == current.id)
    elif member_id:
        query = query.filter(models.Loan.member_id == member_id)

    if active_only:
        query = query.filter(models.Loan.returned_on.is_(None))

    if q:
        query = query.join(models.BookCopy).join(models.Book).filter(
            or_(
                models.Book.title.ilike(f"%{q}%"),
                models.BookCopy.accession_number.ilike(f"%{q}%"),
            )
        )

    total = query.count()
    loans = query.order_by(models.Loan.issued_on.desc()).offset((page - 1) * page_size).limit(page_size).all()
    items = [_enrich_loan(l, db) for l in loans]

    if overdue_only:
        items = [l for l in items if l.is_overdue and l.returned_on is None]
        total = len(items)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, -(-total // page_size)),
    }


@router.get("/{loan_id}", response_model=schemas.LoanOut)
def get_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current: models.Member = Depends(get_current_member),
):
    loan = db.query(models.Loan).options(
        joinedload(models.Loan.copy).joinedload(models.BookCopy.book),
        joinedload(models.Loan.member),
    ).filter(models.Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if current.role == "student" and loan.member_id != current.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return _enrich_loan(loan, db)


@router.post("", response_model=schemas.LoanOut, status_code=status.HTTP_201_CREATED)
def issue_book(
    data: schemas.LoanCreate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    # Validate member
    member = db.query(models.Member).filter(models.Member.id == data.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.status != "active":
        raise HTTPException(status_code=400, detail="Member account is not active")

    # Validate copy
    copy = db.query(models.BookCopy).filter(models.BookCopy.id == data.copy_id).first()
    if not copy:
        raise HTTPException(status_code=404, detail="Book copy not found")
    if copy.status != "Available":
        raise HTTPException(status_code=400, detail=f"Copy is not available (status: {copy.status})")

    # Check active loan on this copy (extra safety)
    existing_copy_loan = db.query(models.Loan).filter(
        models.Loan.copy_id == data.copy_id,
        models.Loan.returned_on.is_(None),
    ).first()
    if existing_copy_loan:
        raise HTTPException(status_code=400, detail="This copy already has an active loan")

    # Check max active loans
    active_loans_count = db.query(func.count(models.Loan.id)).filter(
        models.Loan.member_id == data.member_id,
        models.Loan.returned_on.is_(None),
    ).scalar() or 0

    if active_loans_count >= MAX_ACTIVE_LOANS:
        raise HTTPException(
            status_code=400,
            detail=f"Student already has {active_loans_count} active loan(s). Maximum allowed is {MAX_ACTIVE_LOANS}.",
        )

    issued_on = data.issued_on or now_ist()
    due_on = issued_on + timedelta(days=LOAN_DURATION_DAYS)

    # Transactional write
    loan = models.Loan(
        copy_id=data.copy_id,
        member_id=data.member_id,
        issued_on=issued_on,
        due_on=due_on,
        issued_by=admin.id,
    )
    db.add(loan)
    copy.status = "Issued"
    db.flush()

    # Audit
    db.add(models.AuditLog(
        action="BOOK_ISSUED",
        entity_type="loan",
        entity_id=loan.id,
        performed_by=admin.id,
        details=f"Book '{copy.book_id}' copy '{copy.accession_number}' issued to member {member.id}",
    ))
    db.commit()
    db.refresh(loan)

    loan = db.query(models.Loan).options(
        joinedload(models.Loan.copy).joinedload(models.BookCopy.book),
        joinedload(models.Loan.member),
    ).filter(models.Loan.id == loan.id).first()
    return _enrich_loan(loan, db)


@router.post("/{loan_id}/return", response_model=schemas.LoanOut)
def return_book(
    loan_id: int,
    data: schemas.LoanReturn,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    loan = db.query(models.Loan).options(
        joinedload(models.Loan.copy).joinedload(models.BookCopy.book),
        joinedload(models.Loan.member),
    ).filter(models.Loan.id == loan_id).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.returned_on is not None:
        raise HTTPException(status_code=400, detail="Book already returned")

    returned_on = data.returned_on or now_ist()
    loan.returned_on = returned_on
    loan.returned_to = admin.id

    copy = db.query(models.BookCopy).filter(models.BookCopy.id == loan.copy_id).first()
    if copy:
        copy.status = "Available"

    fine, _, _ = calculate_fine(loan.due_on, returned_on)

    db.add(models.AuditLog(
        action="BOOK_RETURNED",
        entity_type="loan",
        entity_id=loan.id,
        performed_by=admin.id,
        details=f"Copy '{copy.accession_number if copy else loan.copy_id}' returned. Fine: INR {fine:.0f}",
    ))
    db.commit()
    db.refresh(loan)

    loan = db.query(models.Loan).options(
        joinedload(models.Loan.copy).joinedload(models.BookCopy.book),
        joinedload(models.Loan.member),
    ).filter(models.Loan.id == loan.id).first()
    return _enrich_loan(loan, db)
