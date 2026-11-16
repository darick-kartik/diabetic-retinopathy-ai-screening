
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.core.dependencies import get_current_user
from backend.app.models.user import User
from backend.app.schemas.patient import (
    PatientProfileUpdate,
    PatientProfileResponse
)
from backend.app.services.patient_service import (
    get_patient_profile,
    update_patient_profile
)
from backend.app.database.session import get_db

from sqlalchemy.orm import Session


router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


@router.get(
    "/me",
    response_model=PatientProfileResponse,
    status_code=status.HTTP_200_OK
)
def read_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return get_patient_profile(
            db,
            current_user.id
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )


@router.patch(
    "/me",
    response_model=PatientProfileResponse,
    status_code=status.HTTP_200_OK
)
def update_my_profile(
    profile_data: PatientProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return update_patient_profile(
            db,
            current_user.id,
            profile_data
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        )
