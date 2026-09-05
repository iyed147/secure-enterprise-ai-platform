from collections.abc import Iterator

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.core.config import settings

_llm_client: ChatOllama | None = None


def get_llm_client() -> ChatOllama:
    global _llm_client
    if _llm_client is None:
        _llm_client = ChatOllama(
            model=settings.ollama_llm_model,
            base_url=settings.ollama_base_url,
            temperature=0.1,
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
You may use the earlier conversation turns to understand follow-up questions (e.g., "he", "that project", "the other one" refer to something mentioned before). The factual grounding rules above still apply — never introduce a fact that isn't in the context below, even if it was mentioned earlier in the conversation.
Always answer in the same language as the question."""


def build_context(chunks: list[dict]) -> str:
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


MAX_HISTORY_MESSAGES = 6  # limite la fenêtre d'historique injectée (3 échanges), pour ne pas exploser num_ctx


def _build_messages(question: str, chunks: list[dict], history: list[dict] | None = None):
    context = build_context(chunks)

    messages = [SystemMessage(content=SYSTEM_PROMPT)]

    if history:
        recent_history = history[-MAX_HISTORY_MESSAGES:]
        for msg in recent_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))

    user_message = f"""Context:
{context}

Question: {question}"""
    messages.append(HumanMessage(content=user_message))

    return messages


def generate_answer(question: str, chunks: list[dict], history: list[dict] | None = None) -> str:
    llm = get_llm_client()
    response = llm.invoke(_build_messages(question, chunks, history))
    return response.content


def stream_answer(question: str, chunks: list[dict], history: list[dict] | None = None) -> Iterator[str]:
    llm = get_llm_client()
    for chunk in llm.stream(_build_messages(question, chunks, history)):
        if chunk.content:
            yield chunk.content