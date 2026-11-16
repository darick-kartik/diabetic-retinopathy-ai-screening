
"""create document embeddings table

Revision ID: f1f065b03553
Revises: e30b12491a10
Create Date: 2026-11-16 14:45:02.173144

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import VECTOR


# revision identifiers, used by Alembic.
revision: str = "f1f065b03553"
down_revision: Union[str, Sequence[str], None] = "e30b12491a10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create document_embeddings table."""

    op.create_table(
        "document_embeddings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("knowledge_document_id", sa.UUID(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("chunk_text", sa.Text(), nullable=False),
        sa.Column("embedding", VECTOR(dim=384), nullable=False),
        sa.Column("embedding_model", sa.String(length=150), nullable=False),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column("chunk_metadata", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),

        sa.CheckConstraint(
            "chunk_index >= 0",
            name="ck_document_embeddings_valid_chunk_index",
        ),
        sa.CheckConstraint(
            "token_count IS NULL OR token_count > 0",
            name="ck_document_embeddings_valid_token_count",
        ),
        sa.ForeignKeyConstraint(
            ["knowledge_document_id"],
            ["knowledge_documents.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "knowledge_document_id",
            "chunk_index",
            name="uq_document_embeddings_document_chunk",
        ),
    )

    op.create_index(
        "ix_document_embeddings_embedding_hnsw",
        "document_embeddings",
        ["embedding"],
        unique=False,
        postgresql_using="hnsw",
        postgresql_ops={"embedding": "vector_cosine_ops"},
    )

    op.create_index(
        op.f("ix_document_embeddings_knowledge_document_id"),
        "document_embeddings",
        ["knowledge_document_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove document_embeddings table."""

    op.drop_index(
        op.f("ix_document_embeddings_knowledge_document_id"),
        table_name="document_embeddings",
    )

    op.drop_index(
        "ix_document_embeddings_embedding_hnsw",
        table_name="document_embeddings",
    )

    op.drop_table("document_embeddings")
