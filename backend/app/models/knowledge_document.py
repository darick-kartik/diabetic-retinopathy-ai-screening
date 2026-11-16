
import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.connection import Base


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    __table_args__ = (
        CheckConstraint(
            "source_type IN ('GUIDELINE', 'RESEARCH_PAPER', "
            "'MEDICAL_REFERENCE', 'OTHER')",
            name="ck_knowledge_documents_valid_source_type",
        ),
        CheckConstraint(
            "status IN ('PENDING', 'PROCESSING', 'PROCESSED', "
            "'FAILED', 'ARCHIVED')",
            name="ck_knowledge_documents_valid_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    source_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    publisher: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    source_url: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
    )

    publication_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
    )

    document_version: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )

    storage_path: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    checksum_sha256: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
    )

    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="PENDING",
        server_default="PENDING",
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<KnowledgeDocument(id={self.id}, "
            f"title={self.title}, status={self.status})>"
        )
