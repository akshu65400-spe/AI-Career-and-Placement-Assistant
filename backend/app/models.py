from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    ForeignKey,
    Date,
    DateTime
)

from sqlalchemy.orm import relationship

from .database import Base


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    # One user -> one profile
    profile = relationship(
        "StudentProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # One user -> many applications
    applications = relationship(
        "Application",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# ============================================================
# STUDENT PROFILE
# ============================================================

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    phone = Column(
        String(20)
    )

    education = Column(
        String(200)
    )

    university = Column(
        String(200)
    )

    branch = Column(
        String(100)
    )

    graduation_year = Column(
        Integer
    )

    skills = Column(
        Text
    )

    experience = Column(
        Text
    )

    resume_path = Column(
        String(500)
    )

    user = relationship(
        "User",
        back_populates="profile"
    )


# ============================================================
# JOB
# ============================================================

class Job(Base):
    __tablename__ = "jobs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    company = Column(
        String(200),
        nullable=False
    )

    location = Column(
        String(200)
    )

    description = Column(
        Text
    )

    required_skills = Column(
        Text
    )

    salary = Column(
        String(100)
    )


# ============================================================
# JOB MATCH
# ============================================================

class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False
    )

    match_percentage = Column(
        Float
    )

    missing_skills = Column(
        Text
    )


# ============================================================
# APPLICATION
# ============================================================

class Application(Base):
    __tablename__ = "applications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    company = Column(
        String(200),
        nullable=False
    )

    position = Column(
        String(200),
        nullable=False
    )

    status = Column(
        String(50),
        nullable=False,
        default="Applied"
    )

    applied_date = Column(
        Date,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship(
        "User",
        back_populates="applications"
    )