from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PatientBase(BaseModel):
    name: str = Field(..., min_length=1, description="Patient name is required")
    date_of_birth: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Birth date in YYYY-MM-DD format")
    gender: Optional[str] = None
    relationship: Optional[str] = Field("Self", description="Relationship of the patient profile to the user")
    blood_group: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    relationship: Optional[str] = None
    blood_group: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Extended patient profile detail response including all their documents
class PatientDetailResponse(PatientResponse):
    
    documents: list["DocumentResponse"] = Field(default_factory=list)

    class Config:
        from_attributes = True
        
from app.schemas.document import DocumentResponse

PatientDetailResponse.model_rebuild()
