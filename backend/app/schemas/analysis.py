from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DocumentAnalysisBase(BaseModel):
    document_type: Optional[str] = None
    summary: Optional[str] = None
    abnormal_values: Optional[str] = None
    general_explanation: Optional[str] = None

class DocumentAnalysisCreate(DocumentAnalysisBase):
    document_id: int
    extracted_text: Optional[str] = None

class DocumentAnalysisResponse(DocumentAnalysisBase):
    id: int
    document_id: int
    extracted_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
