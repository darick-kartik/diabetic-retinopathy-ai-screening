
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    retinal_image_id: UUID
    requested_by_user_id: UUID | None

    model_name: str
    model_version: str

    predicted_grade: int | None
    confidence_score: float | None
    uncertainty_score: float | None

    class_probabilities: dict[str, float] | None
    gradcam_path: str | None

    human_review_required: bool
    status: str
    review_status: str

    reviewed_grade: int | None
    review_notes: str | None

    processing_started_at: datetime | None
    completed_at: datetime | None
    reviewed_at: datetime | None
    created_at: datetime


class PredictionListResponse(BaseModel):
    total: int = Field(ge=0)
    skip: int = Field(ge=0)
    limit: int = Field(ge=1, le=100)
    predictions: list[PredictionResponse]
