
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.patient import Patient
from backend.app.models.retinal_image import RetinalImage
from backend.app.services.image_storage import validate_and_store_image


ALLOWED_EYE_SIDES = {"LEFT", "RIGHT", "UNKNOWN"}


async def upload_retinal_image(
    db: Session,
    user_id: UUID,
    upload_file,
    eye_side: str = "UNKNOWN"
) -> RetinalImage:

    eye_side = eye_side.strip().upper()

    if eye_side not in ALLOWED_EYE_SIDES:
        raise ValueError("Eye side must be LEFT, RIGHT, or UNKNOWN.")

    patient = db.scalar(
        select(Patient).where(Patient.user_id == user_id)
    )

    if patient is None:
        raise ValueError("Patient profile not found.")

    stored_image = await validate_and_store_image(upload_file)
    stored_path = Path(stored_image["storage_path"])

    try:
        # Check whether this patient has already uploaded this image.
        existing_image = db.scalar(
            select(RetinalImage).where(
                RetinalImage.patient_id == patient.id,
                RetinalImage.checksum_sha256 == stored_image["checksum"]
            )
        )

        if existing_image is not None:
            raise ValueError(
                "This retinal image has already been uploaded to your account."
            )

        original_filename = (
            upload_file.filename.replace("\\", "/").rsplit("/", 1)[-1][:255]
        )

        image_record = RetinalImage(
            patient_id=patient.id,
            uploaded_by_user_id=user_id,
            original_filename=original_filename,
            storage_path=stored_image["storage_path"],
            content_type=stored_image["content_type"],
            file_size_bytes=stored_image["file_size_bytes"],
            checksum_sha256=stored_image["checksum"],
            eye_side=eye_side,
            status="UPLOADED"
        )

        db.add(image_record)
        db.commit()
        db.refresh(image_record)

        return image_record

    except Exception:
        db.rollback()

        # Remove the newly stored file if registration fails.
        if stored_path.exists():
            stored_path.unlink()

        raise
