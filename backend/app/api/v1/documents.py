from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api import deps
from app.schemas.document import DocumentResponse, DocumentDetailResponse
from app.models.user import User
from app.services.document import document_service
from app.repositories.document import document_repo

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    patient_id: Optional[int] = Form(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Upload a medical report (PDF or Image). File metadata is recorded and OCR/AI processing 
    runs asynchronously in the background.
    """
    return document_service.upload_document(
        db, 
        file=file, 
        user_id=current_user.id, 
        patient_id=patient_id, 
        background_tasks=background_tasks
    )

@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List all documents uploaded by the current user.
    """
    return document_repo.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Get detailed analysis, findings, and prescriptions for a specific document ID.
    """
    return document_service.get_document_details(db, document_id=document_id, user_id=current_user.id)

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a document and its parsed records.
    """
    document_service.delete_document(db, document_id=document_id, user_id=current_user.id)
    return {"detail": "Document and associated analysis data deleted successfully."}
