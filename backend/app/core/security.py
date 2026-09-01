from datetime import datetime, timedelta, timezone

from fastapi import Header, HTTPException, status, Depends
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> User:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    auth = authorization.strip()
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
    else:
        # tolérance dev: token brut sans Bearer
        token = auth

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

import hashlib
import math

FACE_EMBEDDING_DIM = 32
FACE_MATCH_THRESHOLD = 0.15  # euclidean distance threshold (placeholder scale)


def generate_face_embedding(image_bytes: bytes) -> list[float]:
    """
    PLACEHOLDER embedding generator.
    Produces a deterministic pseudo-vector from image bytes via hashing.
    This is NOT real face recognition — it only allows testing the full
    enroll/match/threshold pipeline before the real CV model (Episode 5)
    is integrated. Same image bytes -> same embedding, different bytes ->
    different embedding, but it does NOT capture actual facial features.
    """
    digest = hashlib.sha256(image_bytes).digest()
    values = []
    for i in range(FACE_EMBEDDING_DIM):
        byte_val = digest[i % len(digest)]
        values.append((byte_val / 255.0) * 2 - 1)  # normalize to [-1, 1]
    return values


def euclidean_distance(vec_a: list[float], vec_b: list[float]) -> float:
    if len(vec_a) != len(vec_b):
        raise ValueError("Embedding dimension mismatch")
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(vec_a, vec_b)))