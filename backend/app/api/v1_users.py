import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user, hash_password, verify_password
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.user import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    DeleteAccountRequest,
    MeResponse,
)

router = APIRouter(prefix="/api/v1", tags=["users"])


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return MeResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role.name,
        is_active=current_user.is_active,
    )


@router.post("/me/change-password", response_model=ChangePasswordResponse)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mot de passe actuel incorrect")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le nouveau mot de passe doit contenir au moins 6 caractères")

    current_user.password_hash = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()

    return ChangePasswordResponse(success=True, message="Mot de passe mis à jour avec succès")


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    payload: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mot de passe incorrect")

    # Supprime les fichiers physiques de l'utilisateur avant le cascade DB
    docs = db.scalars(select(Document).where(Document.owner_user_id == current_user.id)).all()
    for doc in docs:
        file_path = os.path.join(settings.upload_dir, doc.file_name)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(current_user)  # cascade supprime documents + chunks liés
    db.commit()