
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RetinalImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    original_filename: str
    content_type: str
    file_size_bytes: int
    eye_side: str
    status: str
    captured_at: datetime | None
    created_at: datetime


class RetinalImageListResponse(BaseModel):
    total: int = Field(ge=0)
    images: list[RetinalImageResponse]
