from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class PrescriptionBase(BaseModel):
    medicine_name: str
    purpose: Optional[str] = None
    dosage: Optional[str] = None
    precautions: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    document_id: int

class PrescriptionResponse(PrescriptionBase):
    id: int
    document_id: int
    created_at: datetime

    class Config:
        from_attributes = True
