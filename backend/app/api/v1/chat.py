from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.schemas.chat import ChatMessageCreate, ChatHistoryResponse, ChatResponse
from app.models.user import User
from app.models.chat import ChatHistory
from app.models.document import Document
from app.repositories.chat import chat_repo
from app.services.ai import ai_service

router = APIRouter()

@router.get("/{document_id}", response_model=List[ChatHistoryResponse])
def get_chat_history(
    document_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Retrieve previous chat dialogue for a specific medical document.
    """
    # Verify document ownership
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    return chat_repo.get_by_document_id(db, document_id=document_id, user_id=current_user.id)

@router.post("/{document_id}", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def ask_question(
    document_id: int,
    message_in: ChatMessageCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Ask a question regarding the contents of an uploaded report.
    Returns both the stored user query and AI's answer.
    """
    # 1. Fetch and verify document
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    if doc.status != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Document processing must be complete to support questions."
        )

    # 2. Extract context text from analysis
    doc_text = doc.analysis.extracted_text if doc.analysis else ""
    
    # 3. Retrieve recent logs for conversational context
    history_logs = chat_repo.get_by_document_id(db, document_id=document_id, user_id=current_user.id)
    chat_history_formatted = [
        {
            "role": "user" if item.sender == "user" else "assistant",
            "content": item.message
        }
        for item in history_logs
    ]

    # 4. Invoke LLM Response
    ai_reply = ai_service.generate_chat_response(
        document_text=doc_text,
        history=chat_history_formatted,
        user_message=message_in.message
    )

    # 5. Commit dialogue records
    user_chat = ChatHistory(
        document_id=document_id,
        user_id=current_user.id,
        sender="user",
        message=message_in.message
    )
    assistant_chat = ChatHistory(
        document_id=document_id,
        user_id=current_user.id,
        sender="assistant",
        message=ai_reply
    )
    
    db.add(user_chat)
    db.add(assistant_chat)
    db.commit()
    
    db.refresh(user_chat)
    db.refresh(assistant_chat)

    return ChatResponse(
        user_message=ChatHistoryResponse.model_validate(user_chat),
        assistant_message=ChatHistoryResponse.model_validate(assistant_chat)
    )
