from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from ..database import get_db
from .. import models, schemas
from ..auth import require_admin, get_current_member

router = APIRouter(prefix="/api/authors", tags=["authors"])


@router.get("", response_model=list[schemas.AuthorOut])
def list_authors(
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: models.Member = Depends(get_current_member),
):
    query = db.query(models.Author)
    if q:
        query = query.filter(models.Author.name.ilike(f"%{q}%"))
    authors = query.order_by(models.Author.name).all()
    result = []
    for a in authors:
        book_count = db.query(func.count(models.Book.id)).filter(models.Book.author_id == a.id).scalar()
        out = schemas.AuthorOut(id=a.id, name=a.name, book_count=book_count or 0)
        result.append(out)
    return result


@router.post("", response_model=schemas.AuthorOut, status_code=status.HTTP_201_CREATED)
def create_author(
    data: schemas.AuthorCreate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    existing = db.query(models.Author).filter(models.Author.name == data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Author already exists")
    author = models.Author(name=data.name)
    db.add(author)
    db.commit()
    db.refresh(author)
    return schemas.AuthorOut(id=author.id, name=author.name, book_count=0)


@router.put("/{author_id}", response_model=schemas.AuthorOut)
def update_author(
    author_id: int,
    data: schemas.AuthorUpdate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    author = db.query(models.Author).filter(models.Author.id == author_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    author.name = data.name
    db.commit()
    db.refresh(author)
    book_count = db.query(func.count(models.Book.id)).filter(models.Book.author_id == author.id).scalar()
    return schemas.AuthorOut(id=author.id, name=author.name, book_count=book_count or 0)


@router.delete("/{author_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_author(
    author_id: int,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    author = db.query(models.Author).filter(models.Author.id == author_id).first()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    book_count = db.query(func.count(models.Book.id)).filter(models.Book.author_id == author_id).scalar()
    if book_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete author with associated books")
    db.delete(author)
    db.commit()
