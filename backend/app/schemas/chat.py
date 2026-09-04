from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str
    document_ids: list[int] | None = None  # scoping optionnel


class ChatSource(BaseModel):
    document_id: int
    document_title: str
    file_name: str
    page: int | None


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]