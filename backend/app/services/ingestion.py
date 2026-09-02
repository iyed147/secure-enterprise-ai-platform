from sqlalchemy.orm import Session

from app.models.chunk import DocumentChunk
from app.models.document import Document
from app.services.document_processing import load_and_split_pdf
from app.services.embeddings import embed_texts


def ingest_document(document: Document, db: Session) -> int:
    """
    Pipeline complet : PDF → chunks → embeddings → DB.
    Retourne le nombre de chunks insérés.
    Met à jour document.status en 'processed' ou 'failed'.
    """
    file_path = f"uploaded_documents/{document.file_name}"

    try:
        chunks = load_and_split_pdf(file_path)

        if not chunks:
            document.status = "failed"
            db.add(document)
            db.commit()
            return 0

        texts = [c.page_content for c in chunks]
        vectors = embed_texts(texts)

        for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
            db_chunk = DocumentChunk(
                document_id=document.id,
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
        document.status = "failed"
        db.add(document)
        db.commit()
        raise e