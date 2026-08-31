from fastapi import Header, HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.user import User


def create_mock_token(user_id: int) -> str:
    return f"mock-token-user-{user_id}"


def parse_mock_token(token: str) -> int:
    prefix = "mock-token-user-"
    if not token.startswith(prefix):
        raise ValueError("Invalid token format")
    return int(token.replace(prefix, ""))


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization scheme",
        )

    token = authorization.split(" ", 1)[1].strip()

    try:
        user_id = parse_mock_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = db.scalar(
        select(User)
        .options(joinedload(User.role))
        .where(User.id == user_id)
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user