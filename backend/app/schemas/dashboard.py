from pydantic import BaseModel
from typing import List, Dict, Any
from app.schemas.document import DocumentResponse

class DashboardStats(BaseModel):
    total_documents: int
    total_patients: int
    recent_documents: List[DocumentResponse]
    category_distribution: Dict[str, int]
    processing_status: Dict[str, int]
    latest_prescriptions: List[Dict[str, Any]]
