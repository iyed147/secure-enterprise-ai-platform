"""add owner_user_id to documents and document_chunks

Revision ID: b716f280f2b3
Revises: ce1c01898e63
Create Date: ...

"""
from alembic import op
import sqlalchemy as sa

revision = "b716f280f2b3"
down_revision = "ce1c01898e63"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("owner_user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_documents_owner_user_id", "documents", "users", ["owner_user_id"], ["id"], ondelete="CASCADE"
    )
    op.create_index("ix_documents_owner_user_id", "documents", ["owner_user_id"])

    op.add_column("document_chunks", sa.Column("owner_user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_document_chunks_owner_user_id", "document_chunks", "users", ["owner_user_id"], ["id"], ondelete="CASCADE"
    )
    op.create_index("ix_document_chunks_owner_user_id", "document_chunks", ["owner_user_id"])


def downgrade() -> None:
    op.drop_index("ix_document_chunks_owner_user_id", table_name="document_chunks")
    op.drop_constraint("fk_document_chunks_owner_user_id", "document_chunks", type_="foreignkey")
    op.drop_column("document_chunks", "owner_user_id")

    op.drop_index("ix_documents_owner_user_id", table_name="documents")
    op.drop_constraint("fk_documents_owner_user_id", "documents", type_="foreignkey")
    op.drop_column("documents", "owner_user_id")