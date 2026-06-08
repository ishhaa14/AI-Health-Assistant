from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.dashboard import DashboardStats
from app.models.user import User
from app.models.document import Document
from app.models.patient import Patient
from app.models.analysis import DocumentAnalysis
from app.models.prescription import Prescription
from app.repositories.document import document_repo
from app.repositories.patient import patient_repo

router = APIRouter()

@router.get("/", response_model=DashboardStats)
def get_user_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get aggregated dashboard stats for the authenticated user, 
    including recent uploads, counts, and category ratios.
    """
    total_docs = document_repo.get_total_count_for_user(db, user_id=current_user.id)
    patients = patient_repo.get_by_user(db, user_id=current_user.id)
    total_patients = len(patients)
    
    # Recent documents (newest 5)
    recent_docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .limit(5)
        .all()
    )
    
    # Document type distribution
    categories = (
        db.query(DocumentAnalysis.document_type)
        .join(Document, Document.id == DocumentAnalysis.document_id)
        .filter(Document.user_id == current_user.id)
        .all()
    )
    
    category_distribution = {"lab_report": 0, "prescription": 0, "discharge_summary": 0}
    for item in categories:
        t = item[0] or "lab_report"
        if t in category_distribution:
            category_distribution[t] += 1

    # Processing status distributions
    statuses = (
        db.query(Document.status)
        .filter(Document.user_id == current_user.id)
        .all()
    )
    status_distribution = {"PENDING": 0, "EXTRACTING": 0, "ANALYZING": 0, "COMPLETED": 0, "FAILED": 0}
    for item in statuses:
        s = item[0]
        if s in status_distribution:
            status_distribution[s] += 1

    # Latest prescribed medicines
    latest_presc_items = (
        db.query(Prescription.medicine_name, Prescription.purpose, Prescription.dosage, Document.created_at)
        .join(Document, Document.id == Prescription.document_id)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .limit(5)
        .all()
    )
    
    latest_prescriptions = [
        {
            "medicine_name": item[0],
            "purpose": item[1],
            "dosage": item[2],
            "date": item[3].strftime("%Y-%m-%d")
        }
        for item in latest_presc_items
    ]

    return DashboardStats(
        total_documents=total_docs,
        total_patients=total_patients,
        recent_documents=recent_docs,
        category_distribution=category_distribution,
        processing_status=status_distribution,
        latest_prescriptions=latest_prescriptions
    )
