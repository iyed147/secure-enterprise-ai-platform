import base64

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import (
    FACE_MATCH_THRESHOLD,
    create_access_token,
    euclidean_distance,
    generate_face_embedding,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    FaceEnrollRequest,
    FaceEnrollResponse,
    FaceLoginRequest,
    FaceLoginResponse,
    LoginRequest,
    MockLoginRequest,
    MockLoginResponse,
    RegisterRequest,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    role = db.scalar(select(Role).where(Role.name == payload.role))
    if not role:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    user = User(
        full_name=payload.full_name,
        email=email,
        password_hash=hash_password(payload.password),
        role_id=role.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id), role=role.name)
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=role.name,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    user = db.scalar(select(User).options(joinedload(User.role)).where(User.email == email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    token = create_access_token(subject=str(user.id), role=user.role.name)
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.name,
    )


@router.post("/mock-login", response_model=MockLoginResponse)
def mock_login(payload: MockLoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    user = db.scalar(select(User).options(joinedload(User.role)).where(User.email == email))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email")

    return MockLoginResponse(
        access_token=f"mock-token-user-{user.id}",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role.name,
    )


@router.post("/enroll-face", response_model=FaceEnrollResponse)
def enroll_face(
    payload: FaceEnrollRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        image_bytes = base64.b64decode(payload.image_base64)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base64 image")

    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image data")

    current_user.face_embedding = generate_face_embedding(image_bytes)  # bytes -> LargeBinary OK
    db.add(current_user)
    db.commit()

    return FaceEnrollResponse(
        success=True,
        message=f"Face enrolled successfully for {current_user.full_name}",
    )


@router.post("/login-face", response_model=FaceLoginResponse)
def login_face(payload: FaceLoginRequest, db: Session = Depends(get_db)):
    try:
        image_bytes = base64.b64decode(payload.image_base64)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base64 image")

    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty image data")

    probe_embedding = generate_face_embedding(image_bytes)

    candidates = db.scalars(
        select(User).options(joinedload(User.role)).where(User.face_embedding.isnot(None))
    ).all()

    if not candidates:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No enrolled faces found")

    best_match: User | None = None
    best_distance = float("inf")

    for candidate in candidates:
        try:
            distance = euclidean_distance(probe_embedding, candidate.face_embedding)
        except Exception:
            continue
        if distance < best_distance:
            best_distance = distance
            best_match = candidate

    if best_match is None or best_distance > FACE_MATCH_THRESHOLD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Face not recognized")

    if not best_match.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    token = create_access_token(subject=str(best_match.id), role=best_match.role.name)

    return FaceLoginResponse(
        access_token=token,
        user_id=best_match.id,
        full_name=best_match.full_name,
        email=best_match.email,
        role=best_match.role.name,
        match_distance=best_distance,
    )