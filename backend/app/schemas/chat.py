from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" ou "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str
    document_ids: list[int] | None = None
    history: list[ChatMessage] | None = None  # historique de la conversation en cours


class ChatSource(BaseModel):
    document_id: int
    document_title: str
    file_name: str
    page: int | None


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]