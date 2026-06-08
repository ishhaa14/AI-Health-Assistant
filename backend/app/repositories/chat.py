from typing import List
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.chat import ChatHistory

class ChatHistoryRepository(BaseRepository[ChatHistory]):
    def get_by_document_id(self, db: Session, *, document_id: int, user_id: int) -> List[ChatHistory]:
        """Fetch all chat message logs relating to a document and user."""
        return (
            db.query(self.model)
            .filter(self.model.document_id == document_id, self.model.user_id == user_id)
            .order_by(self.model.created_at.asc())
            .all()
        )

chat_repo = ChatHistoryRepository(ChatHistory)
