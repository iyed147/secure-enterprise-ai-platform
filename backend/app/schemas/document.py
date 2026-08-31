from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    title: str
    file_name: str
    owner_role: str
    allowed_roles: list[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True