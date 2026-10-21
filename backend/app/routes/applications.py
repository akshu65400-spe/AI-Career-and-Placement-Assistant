from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Application
from ..schemas import (
    ApplicationCreate,
    ApplicationUpdate
)


router = APIRouter(
    prefix="/applications",
    tags=["Applications"]
)


# ============================================================
# GET ALL APPLICATIONS
# ============================================================

@router.get("/{user_id}")
def get_applications(
    user_id: int,
    db: Session = Depends(get_db)
):

    applications = (
        db.query(Application)
        .filter(
            Application.user_id == user_id
        )
        .order_by(
            Application.applied_date.desc()
        )
        .all()
    )

    return applications


# ============================================================
# CREATE APPLICATION
# ============================================================

@router.post("/{user_id}")
def create_application(
    user_id: int,
    application: ApplicationCreate,
    db: Session = Depends(get_db)
):

    new_application = Application(
        user_id=user_id,
        company=application.company,
        position=application.position,
        status=application.status,
        applied_date=application.applied_date
    )

    db.add(new_application)

    db.commit()

    db.refresh(new_application)

    return new_application


# ============================================================
# UPDATE APPLICATION
# ============================================================

@router.put("/{application_id}")
def update_application(
    application_id: int,
    application: ApplicationUpdate,
    db: Session = Depends(get_db)
):

    existing = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    if application.company is not None:
        existing.company = application.company

    if application.position is not None:
        existing.position = application.position

    if application.status is not None:
        existing.status = application.status

    if application.applied_date is not None:
        existing.applied_date = application.applied_date

    db.commit()

    db.refresh(existing)

    return existing


# ============================================================
# DELETE APPLICATION
# ============================================================

@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_db)
):

    existing = (
        db.query(Application)
        .filter(
            Application.id == application_id
        )
        .first()
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Application not found"
        )

    db.delete(existing)

    db.commit()

    return {
        "message": "Application deleted successfully"
    }


# ============================================================
# APPLICATION STATISTICS
# ============================================================

@router.get("/stats/{user_id}")
def get_application_stats(
    user_id: int,
    db: Session = Depends(get_db)
):

    applications = (
        db.query(Application)
        .filter(
            Application.user_id == user_id
        )
        .all()
    )

    total = len(applications)

    applied = sum(
        1
        for app in applications
        if app.status.lower() == "applied"
    )

    shortlisted = sum(
        1
        for app in applications
        if app.status.lower() == "shortlisted"
    )

    interviews = sum(
        1
        for app in applications
        if app.status.lower() == "interview"
    )

    selected = sum(
        1
        for app in applications
        if app.status.lower() == "selected"
    )

    rejected = sum(
        1
        for app in applications
        if app.status.lower() == "rejected"
    )

    return {
        "total": total,
        "applied": applied,
        "shortlisted": shortlisted,
        "interviews": interviews,
        "selected": selected,
        "rejected": rejected
    }