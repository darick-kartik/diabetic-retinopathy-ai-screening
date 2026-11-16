
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.patient import Patient
from backend.app.schemas.patient import PatientProfileUpdate


def get_patient_profile(
    db: Session,
    user_id: UUID
) -> Patient:

    patient = db.scalar(
        select(Patient).where(Patient.user_id == user_id)
    )

    if patient is None:
        raise ValueError("Patient profile not found.")

    return patient


def update_patient_profile(
    db: Session,
    user_id: UUID,
    profile_data: PatientProfileUpdate
) -> Patient:

    patient = get_patient_profile(db, user_id)

    try:
        update_data = profile_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(patient, field, value)

        db.commit()
        db.refresh(patient)

        return patient

    except Exception:
        db.rollback()
        raise
