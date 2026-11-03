from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import verify_password, create_access_token, get_current_member

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.email == form_data.username).first()
    if not member or not verify_password(form_data.password, member.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if member.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )
    token = create_access_token({"sub": str(member.id), "role": member.role})
    return schemas.TokenResponse(
        access_token=token,
        role=member.role,
        member_id=member.id,
        full_name=member.full_name,
    )


@router.get("/me", response_model=schemas.MemberOut)
def get_me(current_member: models.Member = Depends(get_current_member), db: Session = Depends(get_db)):
    active_loans = db.query(models.Loan).filter(
        models.Loan.member_id == current_member.id,
        models.Loan.returned_on.is_(None),
    ).count()
    current_member.active_loans = active_loans
    return current_member
