from typing import List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.prescription import Prescription

class PrescriptionRepository(BaseRepository[Prescription]):
    def get_by_document_id(self, db: Session, *, document_id: int) -> List[Prescription]:
        """Fetch all identified prescriptions for a document."""
        return db.query(self.model).filter(self.model.document_id == document_id).all()

prescription_repo = PrescriptionRepository(Prescription)
