from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from . import models  # ensure models are registered
from .routers import auth, authors, categories, books, members, loans, dashboard

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LibraNest API",
    description="University Library Management System — SGT University DBMS Project",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(authors.router)
app.include_router(categories.router)
app.include_router(books.router)
app.include_router(members.router)
app.include_router(loans.router)
app.include_router(dashboard.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "LibraNest API", "version": "1.0.0"}


@app.get("/")
def root():
    return {"message": "LibraNest API — visit /docs for API documentation"}
