from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.user import UserCreate, UserResponse, Token
from app.models.user import User
from app.services.auth import auth_service

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
def register(user_in: UserCreate, db: Session = Depends(deps.get_db)):
    """
    Register a new user in the system.
    """
    return auth_service.register_user(db, user_in=user_in)

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(deps.get_db)
):
    """
    OAuth2 compatible token login, retrieve a JWT access token for future requests.
    """
    return auth_service.authenticate_user(db, form_data=form_data)

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(deps.get_current_user)):
    """
    Get details of the currently authenticated user session.
    """
    return current_user
