from fastapi import APIRouter
from app.api.v1 import auth, patients, documents, chat, dashboard, admin

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(patients.router, prefix="/patients", tags=["Patient Profiles"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Document Chat"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["User Dashboard"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Portal"])
