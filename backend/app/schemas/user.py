from pydantic import BaseModel, EmailStr


class MeResponse(BaseModel):
    user_id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool