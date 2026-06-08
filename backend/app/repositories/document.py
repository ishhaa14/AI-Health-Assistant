from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.document import Document

class DocumentRepository(BaseRepository[Document]):
    def get_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Document]:
        """Fetch all documents belonging directly to a user, ordered newest first."""
        return (
            db.query(self.model)
            .filter(self.model.user_id == user_id)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_patient(self, db: Session, *, patient_id: int) -> List[Document]:
        """Fetch all documents corresponding to a specific patient profile."""
        return (
            db.query(self.model)
            .filter(self.model.patient_id == patient_id)
            .order_by(self.model.created_at.desc())
            .all()
        )

    def get_total_count_for_user(self, db: Session, *, user_id: int) -> int:
        """Count total document uploads for a user."""
        return db.query(self.model).filter(self.model.user_id == user_id).count()

    def get_total_count_global(self, db: Session) -> int:
        """Count total global document uploads (for Admin dashboard)."""
        return db.query(self.model).count()

document_repo = DocumentRepository(Document)
