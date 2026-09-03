from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chunk import DocumentChunk
from app.models.document import Document
from app.services.embeddings import embed_query


def retrieve_relevant_chunks(
    question: str,
    owner_user_id: int,
    db: Session,
    top_k: int = 5,
    document_ids: list[int] | None = None,
) -> list[DocumentChunk]:
    """
    Retourne les top_k chunks les plus pertinents pour la question,
    filtrés strictement par utilisateur AVANT la recherche vectorielle.
    Si document_ids est fourni, la recherche est en plus restreinte
    à ces documents précis.
    """
    query_embedding = embed_query(question)
    stmt = select(DocumentChunk).where(DocumentChunk.owner_user_id == owner_user_id)

    if document_ids:
        stmt = stmt.where(DocumentChunk.document_id.in_(document_ids))

    stmt = stmt.order_by(DocumentChunk.embedding.cosine_distance(query_embedding)).limit(top_k)
    chunks = db.scalars(stmt).all()
    return chunks


def format_chunks_with_sources(chunks: list[DocumentChunk], db: Session) -> list[dict]:
    if not chunks:
        return []

    document_ids = list({c.document_id for c in chunks})
    documents = db.scalars(
        select(Document).where(Document.id.in_(document_ids))
    ).all()
    doc_map = {d.id: d for d in documents}

    results = []
    for chunk in chunks:
        doc = doc_map.get(chunk.document_id)
        results.append({
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "document_title": doc.title if doc else "Unknown",
            "file_name": doc.file_name if doc else "Unknown",
            "page": chunk.page,
            "content": chunk.content,
        })
    return results


def verify_documents_ownership(document_ids: list[int], owner_user_id: int, db: Session) -> bool:
    """
    Sécurité : vérifie que TOUS les document_ids demandés appartiennent bien
    à owner_user_id, avant de les utiliser dans une recherche scopée.
    """
    if not document_ids:
        return True

    unique_ids = set(document_ids)
    matching = db.scalars(
        select(Document.id).where(
            Document.id.in_(unique_ids),
            Document.owner_user_id == owner_user_id
        )
    ).all()

    return len(matching) == len(unique_ids)