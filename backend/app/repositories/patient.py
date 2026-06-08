from typing import List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.patient import Patient

class PatientRepository(BaseRepository[Patient]):
    def get_by_user(self, db: Session, *, user_id: int) -> List[Patient]:
        """Fetch all patient profiles registered by a specific user."""
        return db.query(self.model).filter(self.model.user_id == user_id).order_by(self.model.name.asc()).all()

patient_repo = PatientRepository(Patient)
