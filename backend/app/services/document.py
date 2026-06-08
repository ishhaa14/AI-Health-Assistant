import os
import shutil
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile, BackgroundTasks

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import AppBaseException, NotFoundException
from app.models.document import Document, DocumentStatus
from app.models.analysis import DocumentAnalysis
from app.models.prescription import Prescription
from app.repositories.document import document_repo
from app.repositories.analysis import analysis_repo
from app.repositories.prescription import prescription_repo
from app.services.ocr import ocr_service
from app.services.ai import ai_service

class DocumentService:
    def upload_document(
        self, 
        db: Session, 
        *, 
        file: UploadFile, 
        user_id: int, 
        patient_id: Optional[int],
        background_tasks: BackgroundTasks
    ) -> Document:
        """
        Saves document locally, records entry in DB as PENDING, 
        and queues background thread for OCR and AI analysis.
        """
        # Validate mime type
        if file.content_type not in settings.ALLOWED_MIME_TYPES:
            raise AppBaseException(
                f"File format {file.content_type} is not allowed. Choose from: {settings.ALLOWED_MIME_TYPES}"
            )

        # Validate file size (approximate stream check)
        file.file.seek(0, os.SEEK_END)
        size_bytes = file.file.tell()
        file.file.seek(0)  # Reset stream
        
        max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if size_bytes > max_size_bytes:
            raise AppBaseException(
                f"File size exceeds the limit of {settings.MAX_FILE_SIZE_MB}MB."
            )

        # Secure local save
        file_uuid = uuid.uuid4().hex
        file_ext = os.path.splitext(file.filename)[1].lower()
        secure_filename = f"{file_uuid}{file_ext}"
        save_path = os.path.join(settings.UPLOAD_DIR, secure_filename)
        
        try:
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            logger.error(f"Failed to write file to disk: {str(e)}")
            raise AppBaseException("Failed to save uploaded file.")

        # Create Database Object
        doc_in = {
            "user_id": user_id,
            "patient_id": patient_id,
            "file_name": file.filename,
            "file_path": save_path,
            "file_type": file.content_type,
            "file_size": size_bytes,
            "status": DocumentStatus.PENDING.value
        }
        
        db_doc = document_repo.create(db, obj_in=doc_in)
        
        # Dispatch background processing task
        background_tasks.add_task(self._process_document_task, db_doc.id)
        
        return db_doc

    def _process_document_task(self, document_id: int):
        """
        Background task to perform:
        1. OCR text extraction.
        2. LLM categorization.
        3. LLM medical explanation.
        4. Prescription item details parsing.
        """
        # We create a new DB session since this runs asynchronously
        from app.core.database import SessionLocal
        db = SessionLocal()
        
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if not doc:
                logger.error(f"Background task: Document ID {document_id} not found in DB.")
                return

            # Update state -> EXTRACTING
            doc.status = DocumentStatus.EXTRACTING.value
            db.commit()
            
            logger.info(f"Background OCR starting for document {document_id} ({doc.file_name})")
            extracted_text = ocr_service.extract_text(doc.file_path)
            
            # Update state -> ANALYZING
            doc.status = DocumentStatus.ANALYZING.value
            db.commit()
            
            # Detect Document Type
            logger.info(f"Classifying document {document_id} via AI...")
            doc_type = ai_service.detect_document_type(extracted_text)
            
            # Simplify medical contents
            logger.info(f"Simplifying report contents for document {document_id}...")
            simplified_data = ai_service.simplify_report(extracted_text, doc_type)
            
            # Save Document Analysis Report
            analysis_data = {
                "document_id": doc.id,
                "extracted_text": extracted_text,
                "document_type": doc_type,
                "summary": simplified_data.get("summary"),
                "abnormal_values": simplified_data.get("abnormal_values"),
                "general_explanation": simplified_data.get("general_explanation")
            }
            
            analysis_obj = DocumentAnalysis(**analysis_data)
            db.add(analysis_obj)
            
            # If the document is a prescription, extract medications
            if doc_type == "prescription":
                logger.info(f"Extracting medicine schedules for prescription document {document_id}...")
                medicines = ai_service.explain_prescription(extracted_text)
                for med in medicines:
                    prescription_item = Prescription(
                        document_id=doc.id,
                        medicine_name=med.get("medicine_name"),
                        purpose=med.get("purpose"),
                        dosage=med.get("dosage"),
                        precautions=med.get("precautions")
                    )
                    db.add(prescription_item)

            # Update state -> COMPLETED
            doc.status = DocumentStatus.COMPLETED.value
            db.commit()
            logger.info(f"Completed processing for document {document_id} successfully.")
            
        except Exception as e:
            logger.error(f"Failed background processing for document {document_id}: {str(e)}", exc_info=True)
            try:
                doc = db.query(Document).filter(Document.id == document_id).first()
                if doc:
                    doc.status = DocumentStatus.FAILED.value
                    db.commit()
            except Exception as db_err:
                logger.error(f"Failed updating document state to FAILED: {str(db_err)}")
        finally:
            db.close()

    def get_document_details(self, db: Session, *, document_id: int, user_id: int) -> Document:
        """Fetches document metadata, related analyses, and prescription list."""
        doc = document_repo.get(db, id=document_id)
        if not doc or doc.user_id != user_id:
            raise NotFoundException("Document", str(document_id))
        return doc

    def delete_document(self, db: Session, *, document_id: int, user_id: int) -> Document:
        """Deletes database records and deletes physical file from storage."""
        doc = document_repo.get(db, id=document_id)
        if not doc or doc.user_id != user_id:
            raise NotFoundException("Document", str(document_id))
            
        # Delete local file
        if os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception as e:
                logger.error(f"Error removing physical file '{doc.file_path}': {str(e)}")

        return document_repo.remove(db, id=document_id)

document_service = DocumentService()
