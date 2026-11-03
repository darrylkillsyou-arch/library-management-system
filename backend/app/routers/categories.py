from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from ..database import get_db
from .. import models, schemas
from ..auth import require_admin, get_current_member

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[schemas.CategoryOut])
def list_categories(
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.Member = Depends(get_current_member),
):
    query = db.query(models.Category)
    if q:
        query = query.filter(models.Category.name.ilike(f"%{q}%"))
    categories = query.order_by(models.Category.name).all()
    result = []
    for c in categories:
        book_count = db.query(func.count(models.Book.id)).filter(models.Book.category_id == c.id).scalar()
        out = schemas.CategoryOut(id=c.id, name=c.name, book_count=book_count or 0)
        result.append(out)
    return result


@router.post("", response_model=schemas.CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    data: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    existing = db.query(models.Category).filter(models.Category.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category already exists")
    cat = models.Category(name=data.name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return schemas.CategoryOut(id=cat.id, name=cat.name, book_count=0)


@router.put("/{category_id}", response_model=schemas.CategoryOut)
def update_category(
    category_id: int,
    data: schemas.CategoryUpdate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = data.name
    db.commit()
    db.refresh(cat)
    book_count = db.query(func.count(models.Book.id)).filter(models.Book.category_id == cat.id).scalar()
    return schemas.CategoryOut(id=cat.id, name=cat.name, book_count=book_count or 0)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    cat = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    book_count = db.query(func.count(models.Book.id)).filter(models.Book.category_id == category_id).scalar()
    if book_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with associated books")
    db.delete(cat)
    db.commit()
