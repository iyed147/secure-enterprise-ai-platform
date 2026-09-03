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
            temperature=0.2,
        )
    return _llm_client


SYSTEM_PROMPT = """You are an internal enterprise AI assistant.
Answer the user's question using ONLY the context provided below.
If the answer is not contained in the context, say clearly that you cannot find this information in the available documents.
Do not invent information. Do not use outside knowledge.
Always answer in the same language as the question."""


def build_context(chunks: list[dict]) -> str:
    """
    chunks : liste de dicts issus de format_chunks_with_sources() (Step 4.1)
    """
    if not chunks:
        return "(no relevant documents found)"

    parts = []
    for c in chunks:
        parts.append(
            f"[Source: {c['document_title']} — Page {c['page']}]\n{c['content']}"
        )
    return "\n\n---\n\n".join(parts)


def generate_answer(question: str, chunks: list[dict]) -> str:
    context = build_context(chunks)

    user_message = f"""Context:
{context}

Question: {question}"""

    llm = get_llm_client()
    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_message),
    ])

    return response.content