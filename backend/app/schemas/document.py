from pydantic import BaseModel,Field
from datetime import datetime
from typing import Optional, List
from app.schemas.patient import PatientResponse
from app.schemas.analysis import DocumentAnalysisResponse
from app.schemas.prescription import PrescriptionResponse


class DocumentBase(BaseModel):
    file_name: str
    file_type: str
    file_size: int
    status: str

class DocumentCreate(BaseModel):
    patient_id: Optional[int] = None

class DocumentUpdate(BaseModel):
    status: Optional[str] = None
    patient_id: Optional[int] = None

class DocumentResponse(DocumentBase):
    id: int
    user_id: int
    patient_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True

# Response for full document detailed information (analysis, prescriptions)
class DocumentDetailResponse(DocumentResponse):

    analysis: Optional[DocumentAnalysisResponse] = None
    prescriptions: List[PrescriptionResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
