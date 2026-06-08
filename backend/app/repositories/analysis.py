from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.analysis import DocumentAnalysis

class DocumentAnalysisRepository(BaseRepository[DocumentAnalysis]):
    def get_by_document_id(self, db: Session, *, document_id: int) -> Optional[DocumentAnalysis]:
        """Fetch analysis report by document ID."""
        return db.query(self.model).filter(self.model.document_id == document_id).first()

analysis_repo = DocumentAnalysisRepository(DocumentAnalysis)
