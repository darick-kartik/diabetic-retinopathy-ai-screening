
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.connection import Base


class RetinalImage(Base):
    __tablename__ = "retinal_images"

    __table_args__ = (
        CheckConstraint(
            "eye_side IN ('LEFT', 'RIGHT', 'UNKNOWN')",
            name="ck_retinal_images_valid_eye_side",
        ),
        CheckConstraint(
            "status IN ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED')",
            name="ck_retinal_images_valid_status",
        ),
        CheckConstraint(
            "file_size_bytes > 0",
            name="ck_retinal_images_positive_file_size",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    uploaded_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    storage_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    content_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    file_size_bytes: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    checksum_sha256: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
    )

    eye_side: Mapped[str] = mapped_column(
        String(10),
        default="UNKNOWN",
        server_default="UNKNOWN",
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="UPLOADED",
        server_default="UPLOADED",
        nullable=False,
    )

    captured_at: Mapped[Optional[datetime]] = mapped_column(
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
            f"<RetinalImage(id={self.id}, "
            f"patient_id={self.patient_id}, "
            f"status={self.status})>"
        )
