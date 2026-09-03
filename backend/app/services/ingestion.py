import logging
from sqlalchemy.orm import Session

from app.models.chunk import DocumentChunk
from app.models.document import Document
from app.services.document_processing import load_and_split_pdf
from app.services.embeddings import embed_texts

logger = logging.getLogger(__name__)


def ingest_document(document: Document, db: Session, owner_user_id: int | None = None) -> int:
    """
    Pipeline complet : PDF → chunks → embeddings → DB.
    Retourne le nombre de chunks insérés.
    Met à jour document.status en 'processed' ou 'failed'.
    """
    file_path = f"uploaded_documents/{document.file_name}"

    try:
        raw_chunks = load_and_split_pdf(file_path)

        # Nettoyer les caractères NUL (0x00) incompatibles avec PostgreSQL et filtrer les chunks vides
        cleaned_chunks = []
        for c in raw_chunks:
            cleaned_content = c.page_content.replace("\x00", "").strip() if c.page_content else ""
            if cleaned_content:
                c.page_content = cleaned_content
                cleaned_chunks.append(c)

        chunks = cleaned_chunks

        if not chunks:
            logger.warning(f"Aucun contenu valide extrait pour le document ID {document.id}")
            document.status = "failed"
            db.add(document)
            db.commit()
            return 0

        texts = [c.page_content for c in chunks]
        vectors = embed_texts(texts)

        for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
            db_chunk = DocumentChunk(
                document_id=document.id,
                owner_user_id=owner_user_id if owner_user_id is not None else document.owner_user_id,
                chunk_index=i,
                page=chunk.metadata.get("page", 0),
                content=chunk.page_content,
                embedding=vector,
                allowed_roles=document.allowed_roles,
            )
            db.add(db_chunk)

        document.status = "processed"
        db.add(document)
        db.commit()

        return len(chunks)

    except Exception as e:
        db.rollback()
        logger.error(f"Erreur d'ingestion pour le document {document.file_name} (ID: {document.id}): {str(e)}", exc_info=True)
        document.status = "failed"
        db.add(document)
        db.commit()
        raise e