import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.chunk import DocumentChunk
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentChunkResponse, DocumentResponse, DocumentUploadResponse
from app.services.ingestion import ingest_document

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])

MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Isolation par utilisateur : chacun ne voit que ses propres documents
    docs = db.scalars(
        select(Document)
        .where(Document.owner_user_id == current_user.id)
        .order_by(Document.created_at.desc())
    ).all()

    return docs


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.scalar(select(Document).where(Document.id == document_id))
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied for this document",
        )

    return doc


@router.get("/{document_id}/chunks", response_model=list[DocumentChunkResponse])
def get_document_chunks(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.scalar(select(Document).where(Document.id == document_id))
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied for this document",
        )

    chunks = db.scalars(
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.chunk_index)
    ).all()

    return [
        DocumentChunkResponse(
            id=c.id,
            document_id=c.document_id,
            chunk_index=c.chunk_index,
            page=c.page,
            content=c.content,
            allowed_roles=c.allowed_roles,
            embedding_dim=len(c.embedding) if c.embedding is not None else None,
        )
        for c in chunks
    ]


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type != "application/pdf" or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

    file_bytes = file.file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds 20MB limit")

    original_name = file.filename
    safe_suffix = uuid.uuid4().hex[:8]
    stored_file_name = f"{safe_suffix}_{original_name}"

    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, stored_file_name)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    role_name = current_user.role.name

    doc = Document(
        title=title or original_name,
        file_name=stored_file_name,
        owner_role=role_name,
        owner_user_id=current_user.id,  # <-- isolation individuelle
        allowed_roles=[role_name],
        status="uploaded",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        chunk_count = ingest_document(doc, db, owner_user_id=current_user.id)
        db.refresh(doc)
        message = f"Document traité avec succès — {chunk_count} chunks indexés."
    except Exception:
        db.refresh(doc)
        message = "Upload OK mais le traitement a échoué (status: failed)."

    return DocumentUploadResponse(
        id=doc.id,
        title=doc.title,
        file_name=doc.file_name,
        status=doc.status,
        message=message,
    )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.scalar(select(Document).where(Document.id == document_id))
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if doc.owner_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied for this document",
        )

    # Supprime le fichier physique s'il existe
    file_path = os.path.join(settings.upload_dir, doc.file_name)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Les chunks associés sont supprimés automatiquement via cascade="all, delete-orphan"
    db.delete(doc)
    db.commit()