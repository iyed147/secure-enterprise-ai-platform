from pydantic import BaseModel


class MeResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    is_active: bool


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChangePasswordResponse(BaseModel):
    success: bool
    message: str


class DeleteAccountRequest(BaseModel):
    password: str