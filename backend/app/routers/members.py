from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional
from ..database import get_db
from .. import models, schemas
from ..auth import require_admin, get_current_member, hash_password

router = APIRouter(prefix="/api/members", tags=["members"])


def _enrich_member(member: models.Member, db: Session) -> schemas.MemberOut:
    active_loans = db.query(func.count(models.Loan.id)).filter(
        models.Loan.member_id == member.id,
        models.Loan.returned_on.is_(None),
    ).scalar() or 0
    return schemas.MemberOut(
        id=member.id,
        full_name=member.full_name,
        roll_number=member.roll_number,
        email=member.email,
        role=member.role,
        department=member.department,
        programme=member.programme,
        status=member.status,
        joined_at=member.joined_at,
        active_loans=active_loans,
    )


@router.get("", response_model=dict)
def list_members(
    q: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    query = db.query(models.Member)
    if q:
        query = query.filter(
            or_(
                models.Member.full_name.ilike(f"%{q}%"),
                models.Member.email.ilike(f"%{q}%"),
                models.Member.roll_number.ilike(f"%{q}%"),
            )
        )
    if role:
        query = query.filter(models.Member.role == role)
    if status_filter:
        query = query.filter(models.Member.status == status_filter)

    total = query.count()
    members = query.order_by(models.Member.full_name).offset((page - 1) * page_size).limit(page_size).all()
    items = [_enrich_member(m, db) for m in members]
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, -(-total // page_size)),
    }


@router.get("/{member_id}", response_model=schemas.MemberOut)
def get_member(
    member_id: int,
    db: Session = Depends(get_db),
    current: models.Member = Depends(get_current_member),
):
    # Students can only view their own profile
    if current.role != "admin" and current.id != member_id:
        raise HTTPException(status_code=403, detail="Access denied")
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return _enrich_member(member, db)


@router.post("", response_model=schemas.MemberOut, status_code=status.HTTP_201_CREATED)
def create_member(
    data: schemas.MemberCreate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    if db.query(models.Member).filter(models.Member.email == data.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    if db.query(models.Member).filter(models.Member.roll_number == data.roll_number).first():
        raise HTTPException(status_code=409, detail="Roll number already registered")
    member = models.Member(
        full_name=data.full_name,
        roll_number=data.roll_number,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role.value,
        department=data.department,
        programme=data.programme,
        status=data.status.value,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return _enrich_member(member, db)


@router.put("/{member_id}", response_model=schemas.MemberOut)
def update_member(
    member_id: int,
    data: schemas.MemberUpdate,
    db: Session = Depends(get_db),
    current: models.Member = Depends(get_current_member),
):
    # Students can only update their own profile
    if current.role != "admin" and current.id != member_id:
        raise HTTPException(status_code=403, detail="Access denied")
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Students cannot change their own role
    update_data = data.model_dump(exclude_unset=True)
    if current.role != "admin" and "status" in update_data:
        del update_data["status"]

    password = update_data.pop("password", None)
    if password:
        member.password_hash = hash_password(password)

    for k, v in update_data.items():
        if v is not None:
            setattr(member, k, v.value if hasattr(v, 'value') else v)

    db.commit()
    db.refresh(member)
    return _enrich_member(member, db)
