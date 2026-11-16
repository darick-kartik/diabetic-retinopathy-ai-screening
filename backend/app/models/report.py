
import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    JSON,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.connection import Base


class Report(Base):
    __tablename__ = "reports"

    __table_args__ = (
        CheckConstraint(
            "status IN ('DRAFT', 'FINAL', 'ARCHIVED')",
            name="ck_reports_valid_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("predictions.id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
    )

    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="DRAFT",
        server_default="DRAFT",
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

    versions: Mapped[list["ReportVersion"]] = relationship(
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="ReportVersion.version_number",
    )

    def __repr__(self) -> str:
        return (
            f"<Report(id={self.id}, "
            f"prediction_id={self.prediction_id}, "
            f"status={self.status})>"
        )


class ReportVersion(Base):
    __tablename__ = "report_versions"

    __table_args__ = (
        UniqueConstraint(
            "report_id",
            "version_number",
            name="uq_report_versions_report_version",
        ),
        CheckConstraint(
            "version_number > 0",
            name="ck_report_versions_positive_version",
        ),
        CheckConstraint(
            "version_type IN ('AI_GENERATED', 'DOCTOR_EDITED', 'REGENERATED')",
            name="ck_report_versions_valid_type",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    version_number: Mapped[int] = mapped_column(
        nullable=False,
    )

    version_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        nullable=False,
    )

    structured_findings: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )

    cited_sources: Mapped[Optional[list[dict[str, Any]]]] = mapped_column(
        JSON,
        nullable=True,
    )

    pdf_storage_path: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    change_summary: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    report: Mapped["Report"] = relationship(
        back_populates="versions"
    )

    def __repr__(self) -> str:
        return (
            f"<ReportVersion(report_id={self.report_id}, "
            f"version_number={self.version_number})>"
        )
