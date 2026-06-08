from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.user import User

class UserRepository(BaseRepository[User]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """Fetch user by email address."""
        return db.query(self.model).filter(self.model.email == email).first()

user_repo = UserRepository(User)
