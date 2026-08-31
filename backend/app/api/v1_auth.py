from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import MockLoginRequest, MockLoginResponse
from app.core.security import create_mock_token

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/mock-login", response_model=MockLoginResponse)
def mock_login(payload: MockLoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(
        select(User)
        .options(joinedload(User.role))
        .where(User.email == payload.email)
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_mock_token(user.id)

    return MockLoginResponse(
        access_token=token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.name,
    )