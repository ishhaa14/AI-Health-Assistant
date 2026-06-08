from typing import Generic, Type, TypeVar, List, Optional, Any
from sqlalchemy.orm import Session
from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        """
        Base repository constructor.
        Takes a SQLAlchemy model class.
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """Fetch a single record by primary key ID."""
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Fetch multiple records with offset and limit."""
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: Any) -> ModelType:
        try:
            print("CREATE INPUT TYPE:", type(obj_in))

            if hasattr(obj_in, "model_dump"):
                obj_data = obj_in.model_dump()
            elif isinstance(obj_in, dict):
                obj_data = obj_in
            else:
                obj_data = dict(obj_in)

            print("CREATE DATA:", obj_data)

            db_obj = self.model(**obj_data)

            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)

            print("USER CREATED SUCCESSFULLY")

            return db_obj

        except Exception as e:
            print("CREATE ERROR:", repr(e))
            raise

    def update(
        self, db: Session, *, db_obj: ModelType, obj_in: Any
    ) -> ModelType:
        """Update a model record with new values."""
        if hasattr(obj_in, "model_dump"):
            update_data = obj_in.model_dump(exclude_unset=True)
        elif isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = dict(obj_in)

        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: Any) -> Optional[ModelType]:
        """Delete a record by primary key ID."""
        obj = db.query(self.model).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
