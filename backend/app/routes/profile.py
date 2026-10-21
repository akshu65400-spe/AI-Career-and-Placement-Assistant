from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import StudentProfile
from ..schemas import ProfileCreate

router = APIRouter(
    prefix="/profile",
    tags=["Student Profile"]
)


@router.post("/{user_id}")
def create_profile(
    user_id: int,
    profile: ProfileCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(StudentProfile).filter(
        StudentProfile.user_id == user_id
    ).first()

    if existing:
        for field, value in {
            "phone": profile.phone,
            "education": profile.education,
            "university": profile.university,
            "branch": profile.branch,
            "graduation_year": profile.graduation_year,
            "skills": profile.skills,
            "experience": profile.experience,
        }.items():
            if value is not None:
                setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing

    new_profile = StudentProfile(
        user_id=user_id,
        phone=profile.phone,
        education=profile.education,
        university=profile.university,
        branch=profile.branch,
        graduation_year=profile.graduation_year,
        skills=profile.skills,
        experience=profile.experience
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@router.put("/{user_id}")
def update_profile(
    user_id: int,
    profile: ProfileCreate,
    db: Session = Depends(get_db)
):
    return create_profile(user_id, profile, db)


@router.get("/{user_id}")
def get_profile(
    user_id: int,
    db: Session = Depends(get_db)
):

    profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return profile