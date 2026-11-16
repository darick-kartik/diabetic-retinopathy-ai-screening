
import uuid
from datetime import datetime
from typing import Any, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.connection import Base


EMBEDDING_DIMENSION = 384


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    __table_args__ = (
        UniqueConstraint(
            "knowledge_document_id",
            "chunk_index",
            name="uq_document_embeddings_document_chunk",
        ),
        CheckConstraint(
            "chunk_index >= 0",
            name="ck_document_embeddings_valid_chunk_index",
        ),
        CheckConstraint(
            "token_count IS NULL OR token_count > 0",
            name="ck_document_embeddings_valid_token_count",
        ),
        Index(
            "ix_document_embeddings_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    knowledge_document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    chunk_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    embedding: Mapped[list[float]] = mapped_column(
        Vector(EMBEDDING_DIMENSION),
        nullable=False,
    )

    embedding_model: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    token_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    chunk_metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return (
            f"<DocumentEmbedding("
            f"document_id={self.knowledge_document_id}, "
            f"chunk_index={self.chunk_index})>"
        )
