from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import Dict, List, Any
from app.models.user import User
from app.models.document import Document
from app.models.patient import Patient
import os

class AdminService:
    def get_users_list(self, db: Session) -> List[Dict[str, Any]]:
        """Fetch all registered users with their uploaded document count."""
        results = (
            db.query(
                User.id,
                User.email,
                User.full_name,
                User.is_active,
                User.is_admin,
                User.created_at,
                func.count(Document.id).label("doc_count")
            )
            .outerjoin(Document, User.id == Document.user_id)
            .group_by(User.id)
            .order_by(User.created_at.desc())
            .all()
        )
        
        return [
            {
                "id": r.id,
                "email": r.email,
                "full_name": r.full_name,
                "is_active": r.is_active,
                "is_admin": r.is_admin,
                "created_at": r.created_at.isoformat(),
                "doc_count": r.doc_count
            }
            for r in results
        ]

    def get_usage_statistics(self, db: Session) -> Dict[str, Any]:
        """Compile administrative dashboard metrics and graphs."""
        total_users = db.query(User).count()
        total_documents = db.query(Document).count()
        total_patients = db.query(Patient).count()

        # Group uploads by date
        daily_uploads_query = (
            db.query(
                cast(Document.created_at, Date).label("upload_date"),
                func.count(Document.id).label("count")
            )
            .group_by("upload_date")
            .order_by("upload_date")
            .limit(30)
            .all()
        )
        
        daily_uploads = [
            {"date": str(r.upload_date), "count": r.count}
            for r in daily_uploads_query
        ]

        # Categorize documents (types)
        from app.models.analysis import DocumentAnalysis
        type_distribution_query = (
            db.query(
                DocumentAnalysis.document_type,
                func.count(DocumentAnalysis.id).label("count")
            )
            .group_by(DocumentAnalysis.document_type)
            .all()
        )
        
        type_distribution = {}
        for r in type_distribution_query:
            t = r.document_type or "unknown"
            type_distribution[t] = r.count

        # Calculate file size totals on disk
        total_size_bytes = db.query(func.sum(Document.file_size)).scalar() or 0
        total_size_mb = round(total_size_bytes / (1024 * 1024), 2)

        return {
            "total_users": total_users,
            "total_documents": total_documents,
            "total_patients": total_patients,
            "total_size_mb": total_size_mb,
            "daily_uploads": daily_uploads,
            "type_distribution": type_distribution
        }

admin_service = AdminService()
