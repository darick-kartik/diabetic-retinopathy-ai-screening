
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.core.dependencies import get_current_user
from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.models.patient import Patient
from backend.app.models.prediction import Prediction
from backend.app.models.retinal_image import RetinalImage

from backend.app.schemas.prediction import (
    PredictionResponse,
    PredictionListResponse,
)

from backend.app.services.prediction_service import create_prediction
from backend.app.services.gradcam_service import generate_and_save_gradcam

from ai_engine.explainability.gradcam import GRADCAM_STORAGE_DIR


router = APIRouter(
    prefix="/predictions",
    tags=["AI Predictions"]
)


# --------------------------------------------------
# 1. Generate AI prediction
# --------------------------------------------------

@router.post(
    "/{image_id}",
    response_model=PredictionResponse,
    status_code=status.HTTP_201_CREATED
)
def generate_prediction(
    image_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return create_prediction(
            db=db,
            user_id=current_user.id,
            image_id=image_id
        )

    except ValueError as error:
        message = str(error)

        if message in {
            "Patient profile not found.",
            "Retinal image not found.",
            "Stored retinal image file not found."
        }:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )


# --------------------------------------------------
# 2. Generate Grad-CAM for a prediction
# --------------------------------------------------

@router.post(
    "/{prediction_id}/gradcam",
    status_code=status.HTTP_200_OK
)
def create_gradcam(
    prediction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = generate_and_save_gradcam(
            db=db,
            user_id=current_user.id,
            prediction_id=prediction_id
        )

        gradcam = result["gradcam"]

        return {
            "message": "Grad-CAM generated successfully.",
            "prediction_id": str(prediction_id),
            "gradcam_url": f"/predictions/{prediction_id}/gradcam",
            "predicted_grade": gradcam["predicted_grade"],
            "target_grade": gradcam["target_grade"],
            "target_class": gradcam["target_class"],
            "class_probabilities": gradcam["class_probabilities"],
            "visualization_type": gradcam["visualization_type"],
            "research_only": True
        }

    except ValueError as error:
        message = str(error)

        if message in {
            "Prediction not found.",
            "Retinal image not found.",
            "Stored retinal image file not found."
        }:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )


# --------------------------------------------------
# 3. Retrieve saved Grad-CAM image
# --------------------------------------------------

@router.get(
    "/{prediction_id}/gradcam",
    status_code=status.HTTP_200_OK
)
def get_gradcam(
    prediction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.scalar(
        select(Patient).where(
            Patient.user_id == current_user.id
        )
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    prediction = db.scalar(
        select(Prediction)
        .join(
            RetinalImage,
            Prediction.retinal_image_id == RetinalImage.id
        )
        .where(
            Prediction.id == prediction_id,
            RetinalImage.patient_id == patient.id
        )
    )

    if prediction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found."
        )

    if not prediction.gradcam_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grad-CAM has not been generated for this prediction."
        )

    storage_root = GRADCAM_STORAGE_DIR.resolve()
    gradcam_path = Path(prediction.gradcam_path).resolve()

    if not gradcam_path.is_relative_to(storage_root):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Grad-CAM storage location."
        )

    if not gradcam_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grad-CAM image file not found."
        )

    return FileResponse(
        path=gradcam_path,
        media_type="image/png",
        filename=f"gradcam_{prediction_id}.png"
    )


# --------------------------------------------------
# 4. Get patient's prediction history
# --------------------------------------------------

@router.get(
    "/my-predictions",
    response_model=PredictionListResponse,
    status_code=status.HTTP_200_OK
)
def get_my_predictions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    patient = db.scalar(
        select(Patient).where(
            Patient.user_id == current_user.id
        )
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    total = db.scalar(
        select(func.count(Prediction.id))
        .join(
            RetinalImage,
            Prediction.retinal_image_id == RetinalImage.id
        )
        .where(RetinalImage.patient_id == patient.id)
    ) or 0

    predictions = db.scalars(
        select(Prediction)
        .join(
            RetinalImage,
            Prediction.retinal_image_id == RetinalImage.id
        )
        .where(RetinalImage.patient_id == patient.id)
        .order_by(Prediction.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "predictions": predictions
    }


# --------------------------------------------------
# 5. Get a specific prediction
# --------------------------------------------------

@router.get(
    "/{prediction_id}",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK
)
def get_prediction(
    prediction_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    patient = db.scalar(
        select(Patient).where(
            Patient.user_id == current_user.id
        )
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found."
        )

    prediction = db.scalar(
        select(Prediction)
        .join(
            RetinalImage,
            Prediction.retinal_image_id == RetinalImage.id
        )
        .where(
            Prediction.id == prediction_id,
            RetinalImage.patient_id == patient.id
        )
    )

    if prediction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found."
        )

    return prediction
