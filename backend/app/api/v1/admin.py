from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.api import deps
from app.services.admin import admin_service
from app.models.user import User

router = APIRouter()

@router.get("/users", response_model=List[Any])
def list_users(
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.get_current_admin)
):
    """
    Admin only: Retrieve list of registered users, their creation date, and total uploads.
    """
    return admin_service.get_users_list(db)

@router.get("/stats", response_model=Any)
def get_system_stats(
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.get_current_admin)
):
    """
    Admin only: Retrieve total registration counts, uploads, daily usage charts, and disk storage stats.
    """
    return admin_service.get_usage_statistics(db)

@router.put("/users/{user_id}/toggle-active", response_model=Any)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.get_current_admin)
):
    """
    Admin only: Toggle a user's active status (enabling/disabling login).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot disable their own accounts")

    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "email": user.email, "is_active": user.is_active}

@router.put("/users/{user_id}/toggle-admin", response_model=Any)
def toggle_user_admin(
    user_id: int,
    db: Session = Depends(deps.get_db),
    admin_user: User = Depends(deps.get_current_admin)
):
    """
    Admin only: Toggle user administrative permissions.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot revoke their own admin permissions")

    user.is_admin = not user.is_admin
    db.commit()
    return {"id": user.id, "email": user.email, "is_admin": user.is_admin}
