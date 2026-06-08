from pydantic import BaseModel, Field
from datetime import datetime

class ChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, description="Message text is required")

class ChatHistoryResponse(BaseModel):
    id: int
    document_id: int
    user_id: int
    sender: str  # "user" or "assistant"
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

# Response which contains the new reply from the assistant along with historical records
class ChatResponse(BaseModel):
    user_message: ChatHistoryResponse
    assistant_message: ChatHistoryResponse
