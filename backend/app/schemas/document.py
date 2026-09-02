from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    title: str
    file_name: str
    owner_role: str
    allowed_roles: list[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    id: int
    title: str
    file_name: str
    status: str
    message: str


class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    page: int | None
    content: str
    allowed_roles: list[str]
    embedding_dim: int | None  # on n'expose jamais le vecteur brut, juste sa dimension

    class Config:
        from_attributes = True