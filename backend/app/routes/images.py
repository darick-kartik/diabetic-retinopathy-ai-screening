
from pathlib import Path
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status
)
from fastapi.responses import FileResponse
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_current_user
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.patient import Patient
from backend.app.models.retinal_image import RetinalImage
from backend.app.schemas.retinal_image import (
    RetinalImageResponse,
    RetinalImageListResponse
)
from backend.app.services.retinal_image_service import upload_retinal_image
from backend.app.services.image_storage import IMAGE_STORAGE_DIR


router = APIRouter(
    prefix="/images",
    tags=["Retinal Images"]
)


# --------------------------------------------------
# 1. Upload retinal image
# --------------------------------------------------

@router.post(
    "/upload",
    response_model=RetinalImageResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_image(
    file: UploadFile = File(...),
    eye_side: str = Form(default="UNKNOWN"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return await upload_retinal_image(
            db=db,
            user_id=current_user.id,
            upload_file=file,
            eye_side=eye_side
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    finally:
        await file.close()


# --------------------------------------------------
# 2. Get patient's retinal image history
# --------------------------------------------------

@router.get(
    "/my-images",
    response_model=RetinalImageListResponse,
    status_code=status.HTTP_200_OK
)
def get_my_images(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.scalar(
        select(Patient).where(Patient.user_id == current_user.id)
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    total = db.scalar(
        select(func.count(RetinalImage.id)).where(
            RetinalImage.patient_id == patient.id
        )
    ) or 0

    images = db.scalars(
        select(RetinalImage)
        .where(RetinalImage.patient_id == patient.id)
        .order_by(RetinalImage.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return {
        "total": total,
        "images": images
    }


# --------------------------------------------------
# 3. View original retinal image
# --------------------------------------------------

@router.get(
    "/{image_id}/file",
    response_class=FileResponse,
    status_code=status.HTTP_200_OK
)
def view_retinal_image(
    image_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.scalar(
        select(Patient).where(Patient.user_id == current_user.id)
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    # Find the image belonging to the authenticated patient
    image_record = db.scalar(
        select(RetinalImage).where(
            RetinalImage.id == image_id,
            RetinalImage.patient_id == patient.id
        )
    )

    if image_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Retinal image not found."
        )

    # Resolve and validate the storage location
    storage_root = IMAGE_STORAGE_DIR.resolve()
    image_path = Path(image_record.storage_path).resolve()

    if not image_path.is_relative_to(storage_root):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image storage location."
        )

    if not image_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored image file not found."
        )

    return FileResponse(
        path=image_path,
        media_type=image_record.content_type,
        filename=image_record.original_filename
    )
