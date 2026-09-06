from datetime import datetime, timedelta, timezone
import struct
from typing import Iterable

import cv2
import mediapipe as mp
import numpy as np
from deepface import DeepFace
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_mp_face_detection = mp.solutions.face_detection


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


def _detect_and_crop_face(image_bytes: bytes) -> np.ndarray:
    """
    Décode l'image et détecte/cadre le visage via MediaPipe.
    Lève ValueError si aucun visage n'est détecté.
    """
    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Image invalide ou illisible")

    with _mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.6) as detector:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = detector.process(rgb_image)

        if not results.detections:
            raise ValueError("Aucun visage détecté dans l'image")

        # On prend la détection avec la plus haute confiance si plusieurs visages
        detection = max(results.detections, key=lambda d: d.score[0])
        bbox = detection.location_data.relative_bounding_box
        h, w, _ = image.shape

        x = max(0, int(bbox.xmin * w))
        y = max(0, int(bbox.ymin * h))
        bw = max(1, int(bbox.width * w))
        bh = max(1, int(bbox.height * h))

        face_crop = image[y:y + bh, x:x + bw]

        if face_crop.size == 0:
            raise ValueError("Visage détecté mais recadrage invalide")

        return face_crop


def generate_face_embedding(image_bytes: bytes) -> bytes:
    """
    Détecte le visage (MediaPipe) et génère son embedding d'identité (DeepFace/Facenet).
    Retourne l'embedding sérialisé en bytes (pour stockage dans LargeBinary).
    Lève ValueError si aucun visage exploitable n'est trouvé.
    """
    face_crop = _detect_and_crop_face(image_bytes)

    result = DeepFace.represent(
        img_path=face_crop,
        model_name="Facenet",
        enforce_detection=False,  # déjà détecté/cadré par MediaPipe
    )
    embedding = np.array(result[0]["embedding"], dtype=np.float32)

    if len(embedding) != settings.face_embedding_dimension:
        raise ValueError(
            f"Dimension d'embedding inattendue: {len(embedding)} (attendu {settings.face_embedding_dimension})"
        )

    return embedding.tobytes()


def euclidean_distance(a: bytes, b: bytes) -> float:
    """
    Distance euclidienne entre deux embeddings faciaux sérialisés en bytes (float32).
    """
    if not isinstance(a, (bytes, bytearray)) or not isinstance(b, (bytes, bytearray)):
        raise ValueError("Embeddings must be bytes")

    vec_a = np.frombuffer(a, dtype=np.float32)
    vec_b = np.frombuffer(b, dtype=np.float32)

    if vec_a.shape != vec_b.shape:
        raise ValueError("Embedding size mismatch")

    return float(np.linalg.norm(vec_a - vec_b))


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