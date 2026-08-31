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