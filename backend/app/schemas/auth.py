from pydantic import BaseModel


class MockLoginRequest(BaseModel):
    email: str


class MockLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str  # developer | hr | finance


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str