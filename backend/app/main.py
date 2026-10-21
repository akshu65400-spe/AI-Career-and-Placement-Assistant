from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine

from .routes import auth
from .routes import profile
from .routes import jobs
from .routes import applications
from .routes import resume
from app.routes import interview
from app.routes import resume_interview

# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI Career & Placement Assistant",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTES
# ============================================================

app.include_router(auth.router)

app.include_router(profile.router)

app.include_router(jobs.router)

app.include_router(applications.router)

app.include_router(resume.router)

app.include_router(interview.router)

app.include_router(resume_interview.router)

# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AI Career & Placement Assistant API is running"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# ============================================================
# API TEST
# ============================================================

@app.get("/api/test")
def test_api():
    return {
        "message": "API is working successfully"
    }