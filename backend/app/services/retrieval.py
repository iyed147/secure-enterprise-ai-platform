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
    Retourne les chunks les plus pertinents pour la question,
    filtrés strictement par utilisateur AVANT la recherche vectorielle.

    Si document_ids contient PLUSIEURS documents, le retrieval est équilibré :
    top_k chunks sont récupérés PAR document (pas top_k au total), pour garantir
    que chaque document sélectionné est représenté dans le contexte envoyé au LLM.
    Essentiel pour les questions comparatives ("lequel des deux a le plus de X ?").

    Si document_ids contient un seul document (ou aucun), comportement inchangé :
    top_k global.
    """
    query_embedding = embed_query(question)

    # Cas multi-documents explicite : équilibrage par document
    if document_ids and len(document_ids) > 1:
        all_chunks: list[DocumentChunk] = []
        for doc_id in document_ids:
            stmt = (
                select(DocumentChunk)
                .where(
                    DocumentChunk.owner_user_id == owner_user_id,
                    DocumentChunk.document_id == doc_id,
                )
                .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
                .limit(top_k)
            )
            all_chunks.extend(db.scalars(stmt).all())
        return all_chunks

    # Cas normal : un seul document ou recherche globale (comportement Step 4.1/4.2 inchangé)
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