"""enable pgvector extension and convert embedding column to vector

Revision ID: ce1c01898e63
Revises: fbf0fd0183c8
Create Date: ...

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision = "ce1c01898e63"
down_revision = "fbf0fd0183c8"
branch_labels = None
depends_on = None

EMBEDDING_DIM = 768  # doit matcher settings.embedding_dimension


def upgrade() -> None:
    # 1) Activer l'extension pgvector
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2) Convertir la colonne ARRAY(Float) -> vector(768)
    # On droppe puis recrée car il n'y a pas de données critiques à préserver (dev/test uniquement)
    op.drop_column("document_chunks", "embedding")
    op.add_column(
        "document_chunks",
        sa.Column("embedding", Vector(EMBEDDING_DIM), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("document_chunks", "embedding")
    op.add_column(
        "document_chunks",
        sa.Column("embedding", sa.ARRAY(sa.Float()), nullable=True),
    )
    # On ne désactive pas l'extension au downgrade (peut être utilisée ailleurs)