from collections.abc import Iterator

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

from app.core.config import settings

_llm_client: ChatOllama | None = None


def get_llm_client() -> ChatOllama:
    global _llm_client
    if _llm_client is None:
        _llm_client = ChatOllama(
            model=settings.ollama_llm_model,
            base_url=settings.ollama_base_url,
            temperature=0.1,  # réduit de 0.2, plus déterministe pour usage factuel strict
            num_predict=512,
            num_ctx=2048,
            keep_alive="30m",
        )
    return _llm_client


SYSTEM_PROMPT = """You are an internal enterprise AI assistant.
Answer the user's question using ONLY the information contained in the context below.
The context is organized into clearly separated documents, each under its own "=== DOCUMENT: <title> ===" header.
You MAY reason, compare, and draw conclusions across multiple documents — for example, comparing two people's backgrounds.
However, you MUST NEVER attribute a fact, skill, project, or detail to a document/person unless it appears under THAT SPECIFIC document's own header.
Do not blend or transfer information between documents.
You MUST NOT introduce any fact, name, date, or skill that is not present in the context.
If the context genuinely does not contain enough information to answer, say clearly that you cannot find this information in the available documents.
Always answer in the same language as the question."""



def build_context(chunks: list[dict]) -> str:
    """
    Regroupe les chunks PAR DOCUMENT, avec un en-tête fort par document,
    pour empêcher le LLM de mélanger les informations entre plusieurs sources
    (ex: attribuer une compétence d'une personne à une autre).
    """
    if not chunks:
        return "(no relevant documents found)"

    grouped: dict[str, list[dict]] = {}
    for c in chunks:
        grouped.setdefault(c["document_title"], []).append(c)

    sections = []
    for doc_title, doc_chunks in grouped.items():
        doc_chunks_sorted = sorted(doc_chunks, key=lambda c: c["page"] or 0)
        content_blocks = "\n\n".join(
            f"(Page {c['page']}) {c['content']}" for c in doc_chunks_sorted
        )
        sections.append(f"=== DOCUMENT: {doc_title} ===\n{content_blocks}\n=== END OF {doc_title} ===")

    return "\n\n".join(sections)


def _build_messages(question: str, chunks: list[dict]):
    context = build_context(chunks)
    user_message = f"""Context:
{context}

Question: {question}"""
    return [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_message),
    ]


def generate_answer(question: str, chunks: list[dict]) -> str:
    """Non-streamé — gardé pour les scripts de test (test_rag.py)."""
    llm = get_llm_client()
    response = llm.invoke(_build_messages(question, chunks))
    return response.content


def stream_answer(question: str, chunks: list[dict]) -> Iterator[str]:
    """Streamé — utilisé par l'endpoint /chat/stream."""
    llm = get_llm_client()
    for chunk in llm.stream(_build_messages(question, chunks)):
        if chunk.content:
            yield chunk.content