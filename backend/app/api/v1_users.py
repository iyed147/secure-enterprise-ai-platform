from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import MeResponse

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