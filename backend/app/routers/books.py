from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional
from ..database import get_db
from .. import models, schemas
from ..auth import require_admin, get_current_member

router = APIRouter(prefix="/api/books", tags=["books"])


def _enrich_book(book: models.Book, db: Session) -> schemas.BookOut:
    total = db.query(func.count(models.BookCopy.id)).filter(models.BookCopy.book_id == book.id).scalar() or 0
    available = db.query(func.count(models.BookCopy.id)).filter(
        models.BookCopy.book_id == book.id,
        models.BookCopy.status == "Available",
    ).scalar() or 0
    issued = db.query(func.count(models.BookCopy.id)).filter(
        models.BookCopy.book_id == book.id,
        models.BookCopy.status == "Issued",
    ).scalar() or 0

    author_out = None
    if book.author:
        author_out = schemas.AuthorOut(id=book.author.id, name=book.author.name, book_count=0)
    category_out = None
    if book.category:
        category_out = schemas.CategoryOut(id=book.category.id, name=book.category.name, book_count=0)

    return schemas.BookOut(
        id=book.id,
        isbn=book.isbn,
        title=book.title,
        author_id=book.author_id,
        category_id=book.category_id,
        publisher=book.publisher,
        publication_year=book.publication_year,
        description=book.description,
        cover_url=book.cover_url,
        is_archived=book.is_archived,
        created_at=book.created_at,
        author=author_out,
        category=category_out,
        total_copies=total,
        available_copies=available,
        issued_copies=issued,
    )


@router.get("", response_model=dict)
def list_books(
    q: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    author_id: Optional[int] = Query(None),
    available_only: Optional[bool] = Query(None),
    archived: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: models.Member = Depends(get_current_member),
):
    query = db.query(models.Book).options(
        joinedload(models.Book.author),
        joinedload(models.Book.category),
    )
    query = query.filter(models.Book.is_archived == archived)
    if q:
        query = query.filter(
            or_(
                models.Book.title.ilike(f"%{q}%"),
                models.Book.isbn.ilike(f"%{q}%"),
                models.Book.author.has(models.Author.name.ilike(f"%{q}%")),
            )
        )
    if category_id:
        query = query.filter(models.Book.category_id == category_id)
    if author_id:
        query = query.filter(models.Book.author_id == author_id)

    total = query.count()
    books = query.order_by(models.Book.title).offset((page - 1) * page_size).limit(page_size).all()

    items = [_enrich_book(b, db) for b in books]

    # Filter available_only post-enrichment
    if available_only:
        items = [b for b in items if b.available_copies > 0]
        total = len(items)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, -(-total // page_size)),
    }


@router.get("/{book_id}", response_model=schemas.BookOut)
def get_book(
    book_id: int,
    db: Session = Depends(get_db),
    _: models.Member = Depends(get_current_member),
):
    book = db.query(models.Book).options(
        joinedload(models.Book.author),
        joinedload(models.Book.category),
    ).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return _enrich_book(book, db)


@router.post("", response_model=schemas.BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    data: schemas.BookCreate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    if db.query(models.Book).filter(models.Book.isbn == data.isbn).first():
        raise HTTPException(status_code=409, detail="ISBN already exists")
    if not db.query(models.Author).filter(models.Author.id == data.author_id).first():
        raise HTTPException(status_code=404, detail="Author not found")
    if not db.query(models.Category).filter(models.Category.id == data.category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")
    book = models.Book(**data.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    # eager load
    book = db.query(models.Book).options(
        joinedload(models.Book.author), joinedload(models.Book.category)
    ).filter(models.Book.id == book.id).first()
    return _enrich_book(book, db)


@router.put("/{book_id}", response_model=schemas.BookOut)
def update_book(
    book_id: int,
    data: schemas.BookUpdate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(book, k, v)
    db.commit()
    db.refresh(book)
    book = db.query(models.Book).options(
        joinedload(models.Book.author), joinedload(models.Book.category)
    ).filter(models.Book.id == book.id).first()
    return _enrich_book(book, db)


# ─── Copies ───────────────────────────────────────────────────────────────────
@router.get("/{book_id}/copies", response_model=list[schemas.BookCopyOut])
def list_copies(
    book_id: int,
    db: Session = Depends(get_db),
    _: models.Member = Depends(get_current_member),
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    copies = db.query(models.BookCopy).filter(models.BookCopy.book_id == book_id).all()
    return copies


@router.post("/{book_id}/copies", response_model=schemas.BookCopyOut, status_code=status.HTTP_201_CREATED)
def add_copy(
    book_id: int,
    data: schemas.BookCopyCreate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if db.query(models.BookCopy).filter(models.BookCopy.accession_number == data.accession_number).first():
        raise HTTPException(status_code=409, detail="Accession number already exists")
    copy = models.BookCopy(
        book_id=book_id,
        accession_number=data.accession_number,
        status=data.status.value,
        shelf_location=data.shelf_location,
    )
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return copy


@router.put("/copies/{copy_id}", response_model=schemas.BookCopyOut)
def update_copy(
    copy_id: int,
    data: schemas.BookCopyUpdate,
    db: Session = Depends(get_db),
    admin: models.Member = Depends(require_admin),
):
    copy = db.query(models.BookCopy).filter(models.BookCopy.id == copy_id).first()
    if not copy:
        raise HTTPException(status_code=404, detail="Copy not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        if k == "status" and v:
            setattr(copy, k, v.value)
        else:
            setattr(copy, k, v)
    db.commit()
    db.refresh(copy)
    return copy
