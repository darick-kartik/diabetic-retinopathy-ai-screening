
from pathlib import Path
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.patient import Patient
from backend.app.models.retinal_image import RetinalImage
from backend.app.models.prediction import Prediction
from backend.app.services.image_storage import IMAGE_STORAGE_DIR
from ai_engine.explainability.gradcam import generate_gradcam


def generate_and_save_gradcam(
    db: Session,
    user_id: UUID,
    prediction_id: UUID,
) -> dict:
    # Find the prediction only if it belongs to this patient.
    prediction = db.scalar(
        select(Prediction)
        .join(
            RetinalImage,
            Prediction.retinal_image_id == RetinalImage.id,
        )
        .join(
            Patient,
            RetinalImage.patient_id == Patient.id,
        )
        .where(
            Prediction.id == prediction_id,
            Patient.user_id == user_id,
        )
    )

    if prediction is None:
        raise ValueError("Prediction not found.")

    image_record = db.get(RetinalImage, prediction.retinal_image_id)

    if image_record is None:
        raise ValueError("Retinal image not found.")

    # Ensure the image path stays inside our retinal image storage folder.
    storage_root = IMAGE_STORAGE_DIR.resolve()
    image_path = Path(image_record.storage_path).resolve()

    if not image_path.is_relative_to(storage_root):
        raise ValueError("Invalid image storage location.")

    if not image_path.is_file():
        raise ValueError("Stored retinal image file not found.")

    # Generate the Grad-CAM visualization.
    result = generate_gradcam(image_path)

    # Save the generated file path against this prediction.
    prediction.gradcam_path = result["gradcam_path"]

    try:
        db.commit()
        db.refresh(prediction)
    except Exception:
        db.rollback()
        raise

    return {
        "prediction": prediction,
        "gradcam": result,
    }
