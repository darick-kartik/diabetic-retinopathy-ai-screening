
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.patient import Patient
from backend.app.models.retinal_image import RetinalImage
from backend.app.models.prediction import Prediction
from backend.app.services.image_storage import IMAGE_STORAGE_DIR

from ai_engine.inference.predictor import predict_retinal_image


def create_prediction(
    db: Session,
    user_id: UUID,
    image_id: UUID,
) -> Prediction:
    """
    Generate and store an AI prediction for an image
    belonging to the authenticated patient's account.
    """

    # 1. Find the authenticated user's patient profile.
    patient = db.scalar(
        select(Patient).where(Patient.user_id == user_id)
    )

    if patient is None:
        raise ValueError("Patient profile not found.")

    # 2. Retrieve only an image belonging to this patient.
    image_record = db.scalar(
        select(RetinalImage).where(
            RetinalImage.id == image_id,
            RetinalImage.patient_id == patient.id,
        )
    )

    if image_record is None:
        raise ValueError("Retinal image not found.")

    # 3. Validate the image storage path.
    storage_root = IMAGE_STORAGE_DIR.resolve()
    image_path = Path(image_record.storage_path).resolve()

    if not image_path.is_relative_to(storage_root):
        raise ValueError("Invalid image storage location.")

    if not image_path.is_file():
        raise ValueError("Stored retinal image file not found.")

    # 4. Run EfficientNet-B0 V2 inference.
    started_at = datetime.now(timezone.utc)

    result = predict_retinal_image(image_path)

    completed_at = datetime.now(timezone.utc)

    # 5. Save the AI prediction in PostgreSQL.
    prediction = Prediction(
        retinal_image_id=image_record.id,
        requested_by_user_id=user_id,

        model_name=result["model_name"],
        model_version=result["model_version"],

        predicted_grade=result["predicted_grade"],
        confidence_score=result["confidence"],

        # No validated uncertainty estimation yet.
        uncertainty_score=None,

        class_probabilities=result["class_probabilities"],

        gradcam_path=None,

        human_review_required=True,

        status="COMPLETED",
        review_status="UNREVIEWED",

        # Doctor review remains separate.
        reviewed_grade=None,
        reviewed_by_user_id=None,
        review_notes=None,
        reviewed_at=None,

        processing_started_at=started_at,
        completed_at=completed_at,
    )

    try:
        db.add(prediction)
        db.commit()
        db.refresh(prediction)

    except Exception:
        db.rollback()
        raise

    return prediction
