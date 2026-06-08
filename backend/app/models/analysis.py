from sqlalchemy import Column, Integer, Text, ForeignKey, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class DocumentAnalysis(Base):
    __tablename__ = "document_analysis"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), unique=True, nullable=False)
    extracted_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)  # AI-generated simple summary
    abnormal_values = Column(Text, nullable=True)  # AI identified abnormal indicators and values
    general_explanation = Column(Text, nullable=True)  # Detailed simple explanations of jargon
    document_type = Column(String, nullable=True)  # lab_report, prescription, discharge_summary
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    document = relationship("Document", back_populates="analysis")
