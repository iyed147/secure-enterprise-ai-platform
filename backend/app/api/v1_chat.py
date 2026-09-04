import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, ChatSource
from app.services.retrieval import (
    retrieve_relevant_chunks,
    format_chunks_with_sources,
    verify_documents_ownership,
)
from app.services.generation import generate_answer, stream_answer

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


def _resolve_chunks(payload: ChatRequest, current_user: User, db: Session):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty")

    if payload.document_ids:
        if not verify_documents_ownership(payload.document_ids, current_user.id, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="One or more selected documents do not belong to you",
            )

    # 5 chunks/doc en comparaison multi-documents, 5 aussi en single-doc pour mieux couvrir le contenu
    top_k = 5

    chunks = retrieve_relevant_chunks(
        question=question,
        owner_user_id=current_user.id,
        db=db,
        top_k=top_k,
        document_ids=payload.document_ids,
    )
    results = format_chunks_with_sources(chunks, db)
    return question, results

@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question, results = _resolve_chunks(payload, current_user, db)
    answer = generate_answer(question, results)

    sources = [
        ChatSource(
            document_id=r["document_id"],
            document_title=r["document_title"],
            file_name=r["file_name"],
            page=r["page"],
        )
        for r in results
    ]
    return ChatResponse(answer=answer, sources=sources)


@router.post("/stream")
def chat_stream(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question, results = _resolve_chunks(payload, current_user, db)

    sources = [
        {
            "document_id": r["document_id"],
            "document_title": r["document_title"],
            "file_name": r["file_name"],
            "page": r["page"],
        }
        for r in results
    ]

    def event_generator():
        # Premier événement : les sources (affichables immédiatement)
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

        # Puis le texte, token par token
        for token in stream_answer(question, results):
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")