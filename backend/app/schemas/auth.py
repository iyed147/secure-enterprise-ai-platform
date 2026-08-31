import re
from pydantic import BaseModel, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class MockLoginRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        if not EMAIL_RE.match(v):
            raise ValueError("value is not a valid email address")
        return v


class MockLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    role: str