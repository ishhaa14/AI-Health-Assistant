from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.api import deps
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.models.user import User
from app.services.patient import patient_service

router = APIRouter()

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PatientCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Create a new patient profile. Useful for grouping family members' reports.
    """
    return patient_service.create_patient(
        db, obj_in=patient_in.model_dump(), user_id=current_user.id
    )

@router.get("/", response_model=List[PatientResponse])
def list_patients(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    List all patient profiles belonging to the current user.
    """
    return patient_service.list_patients(db, user_id=current_user.id)

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve details of a specific patient profile.
    """
    return patient_service.get_patient(db, patient_id=patient_id, user_id=current_user.id)

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient_in: PatientUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update biographical details for a patient profile.
    """
    return patient_service.update_patient(
        db, patient_id=patient_id, obj_in=patient_in.model_dump(exclude_unset=True), user_id=current_user.id
    )

@router.delete("/{patient_id}", status_code=status.HTTP_200_OK)
def delete_patient(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Delete a patient profile and all their uploaded documents.
    """
    patient_service.delete_patient(db, patient_id=patient_id, user_id=current_user.id)
    return {"detail": "Patient profile and associated documents deleted successfully."}

@router.get("/{patient_id}/report", response_model=Any)
def get_patient_health_report(
    patient_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Compile chronological history and synthesize a markdown health report for a patient profile.
    """
    return patient_service.generate_patient_health_report(
        db, patient_id=patient_id, user_id=current_user.id
    )
