from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.core import security
from app.core.exceptions import AuthException, AppBaseException
from app.models.user import User
from app.repositories.user import user_repo
from app.schemas.user import UserCreate, Token

class AuthService:
    def register_user(self, db: Session, *, user_in: UserCreate) -> User:
        """Register a new user in the database, checking for email uniqueness."""
        existing_user = user_repo.get_by_email(db, email=user_in.email)
        if existing_user:
            raise AppBaseException(message="Email address already registered")
        
        # Hash password and create record
        user_data = user_in.model_dump()
        raw_password = user_data.pop("password")
        user_data["hashed_password"] = security.get_password_hash(raw_password)
        
        return user_repo.create(db, obj_in=user_data)

    def authenticate_user(self, db: Session, *, form_data: OAuth2PasswordRequestForm) -> Token:
        user = user_repo.get_by_email(db, email=form_data.username)

        if not user:
            raise AuthException("Invalid credentials")

        try:
            password_valid = security.verify_password(
                form_data.password,
                user.hashed_password
            )
        except Exception as e:
            print("Password verification failed:", e)
            raise AuthException("Authentication error")

        if not password_valid:
            raise AuthException("Invalid credentials")

        if not user.is_active:
            raise AuthException("User account is disabled")

        access_token = security.create_access_token(subject=user.email)

        return Token(access_token=access_token, token_type="bearer")

auth_service = AuthService()
