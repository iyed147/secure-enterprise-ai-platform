from fastapi import FastAPI
from app.core.config import settings
from app.api.health import router as health_router
from app.api.v1_auth import router as auth_router
from app.api.v1_users import router as users_router
from app.api.v1_documents import router as documents_router

app = FastAPI(title=settings.app_name)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(documents_router)


@app.get("/")
def root():
    return {
        "message": "Secure Enterprise AI API running",
        "environment": settings.app_env
    }