from sqlalchemy import ForeignKey, Integer, Text, Float
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    page: Mapped[int] = mapped_column(Integer, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    allowed_roles: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False)

    # Temporaire Step 0.5 : ARRAY(Float). Step 1/2 => conversion vers pgvector(Vector)
    embedding: Mapped[list[float] | None] = mapped_column(ARRAY(Float), nullable=True)

    document = relationship("Document", back_populates="chunks")