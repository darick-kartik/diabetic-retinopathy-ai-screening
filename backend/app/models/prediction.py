
import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    JSON,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.connection import Base


class Prediction(Base):
    __tablename__ = "predictions"

    __table_args__ = (
        CheckConstraint(
            "predicted_grade IS NULL OR predicted_grade BETWEEN 0 AND 4",
            name="ck_predictions_valid_predicted_grade",
        ),
        CheckConstraint(
            "reviewed_grade IS NULL OR reviewed_grade BETWEEN 0 AND 4",
            name="ck_predictions_valid_reviewed_grade",
        ),
        CheckConstraint(
            "confidence_score IS NULL OR "
            "(confidence_score >= 0 AND confidence_score <= 1)",
            name="ck_predictions_valid_confidence",
        ),
        CheckConstraint(
            "uncertainty_score IS NULL OR "
            "(uncertainty_score >= 0 AND uncertainty_score <= 1)",
            name="ck_predictions_valid_uncertainty",
        ),
        CheckConstraint(
            "status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')",
            name="ck_predictions_valid_status",
        ),
        CheckConstraint(
            "review_status IN "
            "('UNREVIEWED', 'IN_REVIEW', 'REVIEWED', 'NOT_REQUIRED')",
            name="ck_predictions_valid_review_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    retinal_image_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("retinal_images.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    requested_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    reviewed_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    model_version: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    predicted_grade: Mapped[Optional[int]] = mapped_column(
        SmallInteger,
        nullable=True,
    )

    confidence_score: Mapped[Optional[float]] = mapped_column(
        Numeric(6, 5),
        nullable=True,
    )

    uncertainty_score: Mapped[Optional[float]] = mapped_column(
        Numeric(6, 5),
        nullable=True,
    )

    class_probabilities: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )

    gradcam_path: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    human_review_required: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default="true",
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="QUEUED",
        server_default="QUEUED",
        nullable=False,
    )

    review_status: Mapped[str] = mapped_column(
        String(20),
        default="UNREVIEWED",
        server_default="UNREVIEWED",
        nullable=False,
    )

    reviewed_grade: Mapped[Optional[int]] = mapped_column(
        SmallInteger,
        nullable=True,
    )

    review_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    processing_started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<Prediction(id={self.id}, "
            f"predicted_grade={self.predicted_grade}, "
            f"status={self.status})>"
        )
