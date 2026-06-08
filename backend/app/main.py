import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.models.user import User
from app.models.patient import Patient
from app.models.document import Document
from app.models.analysis import DocumentAnalysis
from app.models.prescription import Prescription
from app.models.chat import ChatHistory

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import AppBaseException
from app.api.v1 import api_router
from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.core import security
import traceback



# Seeding function to initialize database tables and seed superuser
def seed_database():
    """Initializes tables and seeds the primary superuser configuration."""
    db = SessionLocal()
    try:
        # Create tables automatically on startup
        Base.metadata.create_all(bind=engine)
        
        # Seed default superuser
        admin = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not admin:
            admin_user = User(
                email=settings.FIRST_SUPERUSER_EMAIL,
                hashed_password=security.get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                full_name="Administrator",
                is_admin=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logger.info(f"System seeded initial superuser successfully: {settings.FIRST_SUPERUSER_EMAIL}")
    except Exception as e:
        logger.error(f"Error during database initialization: {str(e)}")
    finally:
        db.close()

# Start database initialization
seed_database()

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Clean Architecture API for OCR processing and AI medical report simplification.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.exception_handler(Exception)
def global_exception_handler(request, exc):
    print("\n🔥 FULL ERROR TRACEBACK:\n")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads folder as static path to serve uploaded files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

# Register global exception handler
@app.exception_handler(AppBaseException)
def app_exception_handler(request: Request, exc: AppBaseException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

# Include APIs
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API. Access interactive documentation at /docs"
    }
