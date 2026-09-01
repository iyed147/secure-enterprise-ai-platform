from pydantic import BaseModel


class MeResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    is_active: bool