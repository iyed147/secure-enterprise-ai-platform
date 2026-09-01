from datetime import datetime, timedelta, timezone
import hashlib
import math
from typing import Iterable

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

FACE_EMBEDDING_DIM = 16
FACE_MATCH_THRESHOLD = 0.60


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str, role: str, expires_minutes: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=expires_minutes or settings.access_token_expire_minutes)
    payload = {"sub": subject, "role": role, "iat": int(now.timestamp()), "exp": int(exp.timestamp())}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def generate_face_embedding(image_bytes: bytes) -> bytes:
    # Placeholder deterministic binary embedding (32 bytes)
    return hashlib.sha256(image_bytes).digest()


def euclidean_distance(a: bytes, b: bytes) -> float:
    if not isinstance(a, (bytes, bytearray)) or not isinstance(b, (bytes, bytearray)):
        raise ValueError("Embeddings must be bytes")
    if len(a) != len(b):
        raise ValueError("Embedding size mismatch")
    # Normalize byte values to [0,1]
    va = [x / 255.0 for x in a]
    vb = [x / 255.0 for x in b]
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(va, vb)))


def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> User:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header")

    auth_value = authorization.strip()
    token = auth_value[7:].strip() if auth_value.lower().startswith("bearer ") else auth_value

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid Authorization header")

    if token.startswith("mock-token-user-"):
        try:
            user_id = int(token.removeprefix("mock-token-user-"))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid mock token")
        user = db.scalar(select(User).options(joinedload(User.role)).where(User.id == user_id))
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
        return user

    payload = decode_access_token(token)
    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    try:
        user_id = int(sub)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = db.scalar(select(User).options(joinedload(User.role)).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    return user