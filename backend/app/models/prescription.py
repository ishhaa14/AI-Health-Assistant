from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String, nullable=False)
    purpose = Column(String, nullable=True)  # Purpose of this medicine (e.g. painkiller, blood pressure, etc)
    dosage = Column(String, nullable=True)   # Instructions like "1 tablet after meals twice a day"
    precautions = Column(Text, nullable=True) # Warnings or food interactions
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    document = relationship("Document", back_populates="prescriptions")
