from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, StudentProfile

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"]
)


@router.post("/")
def create_job(
    title: str,
    company: str,
    required_skills: str,
    location: str = "",
    description: str = "",
    salary: str = "",
    db: Session = Depends(get_db)
):

    job = Job(
        title=title,
        company=company,
        required_skills=required_skills,
        location=location,
        description=description,
        salary=salary
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


@router.get("/")
def get_jobs(
    db: Session = Depends(get_db)
):

    return db.query(Job).all()


@router.get("/match/{user_id}")
def match_jobs(
    user_id: int,
    db: Session = Depends(get_db)
):

    profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == user_id
    ).first()

    jobs = db.query(Job).all()

    if not profile:
        return []

    student_skills = set(
        skill.strip().lower()
        for skill in (profile.skills or "").split(",")
        if skill.strip()
    )

    results = []

    for job in jobs:

        required_skills = set(
            skill.strip().lower()
            for skill in (
                job.required_skills or ""
            ).split(",")
            if skill.strip()
        )

        if not required_skills:
            percentage = 0
            missing = []

        else:

            matched = (
                student_skills &
                required_skills
            )

            percentage = (
                len(matched) /
                len(required_skills)
            ) * 100

            missing = list(
                required_skills -
                student_skills
            )

        results.append({
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "match_percentage": round(
                percentage,
                2
            ),
            "missing_skills": missing
        })

    results = [job for job in results if job["match_percentage"] > 0]
    results.sort(
        key=lambda x: x["match_percentage"],
        reverse=True
    )

    return results