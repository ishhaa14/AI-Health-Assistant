from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.repositories.patient import patient_repo
from app.repositories.document import document_repo
from app.models.patient import Patient
from app.models.document import Document
from app.models.analysis import DocumentAnalysis
from app.models.prescription import Prescription
from app.core.exceptions import NotFoundException
from app.services.ai import ai_service
from app.core.logging import logger

class PatientService:
    def create_patient(self, db: Session, *, obj_in: Dict[str, Any], user_id: int) -> Patient:
        """Create a new patient profile associated with the user."""

        print(obj_in)

        obj_in["user_id"] = user_id

    # Convert schema field name to database column name
        if "relationship" in obj_in:
            obj_in["relation"] = obj_in.pop("relationship")

        return patient_repo.create(db, obj_in=obj_in)

    def list_patients(self, db: Session, *, user_id: int) -> List[Patient]:
        print("list_patients called")
        return patient_repo.get_by_user(db, user_id=user_id)

    def get_patient(self, db: Session, *, patient_id: int, user_id: int) -> Patient:
        """Get patient profile by ID, verifying ownership."""
        patient = patient_repo.get(db, id=patient_id)
        if not patient or patient.user_id != user_id:
            raise NotFoundException("Patient Profile", str(patient_id))
        return patient

    def update_patient(self, db: Session, *, patient_id: int, obj_in: Dict[str, Any], user_id: int) -> Patient:
        """Update patient details."""
        patient = self.get_patient(db, patient_id=patient_id, user_id=user_id)
        return patient_repo.update(db, db_obj=patient, obj_in=obj_in)

    def delete_patient(self, db: Session, *, patient_id: int, user_id: int) -> Patient:
        """Delete patient profile and cascade deletes to their documents."""
        patient = self.get_patient(db, patient_id=patient_id, user_id=user_id)
        return patient_repo.remove(db, id=patient_id)

    def generate_patient_health_report(self, db: Session, *, patient_id: int, user_id: int) -> Dict[str, Any]:
        """
        Gathers all processed documents for the patient, compiles their medical timeline,
        and generates an AI-aggregated health summary explaining tests, active medications, and trends.
        """
        patient = self.get_patient(db, patient_id=patient_id, user_id=user_id)
        
        # Get patient's documents
        documents = db.query(Document).filter(
            Document.patient_id == patient_id,
            Document.status == "COMPLETED"
        ).order_by(Document.created_at.asc()).all()

        if not documents:
            return {
                "patient_name": patient.name,
                "relationship": patient.relation,
                "report_markdown": (
                    f"# Health Status Report: {patient.name}\n\n"
                    "No processed medical documents are available yet for this patient. "
                    "Please upload lab reports, prescriptions, or discharge summaries to view a synthesized report."
                ),
                "medications": [],
                "timeline": []
            }

        # Build raw text history to feed LLM
        history_blocks = []
        all_meds = []
        timeline = []

        for index, doc in enumerate(documents):
            analysis: DocumentAnalysis = doc.analysis
            prescriptions: List[Prescription] = doc.prescriptions
            
            doc_date = doc.created_at.strftime("%Y-%m-%d")
            doc_type_display = doc.file_type
            if analysis:
                doc_type_display = analysis.document_type or "report"
            
            # Timeline entry
            timeline.append({
                "document_id": doc.id,
                "file_name": doc.file_name,
                "date": doc_date,
                "type": doc_type_display,
                "summary": analysis.summary if analysis else "No summary available"
            })

            # Format block for AI compilation
            block = f"Record #{index+1} (Date: {doc_date}, Type: {doc_type_display})\n"
            if analysis:
                block += f"Summary: {analysis.summary}\n"
                if analysis.abnormal_values:
                    block += f"Abnormal/Out-of-range indicators: {analysis.abnormal_values}\n"
            
            # List medications if any
            med_details = []
            for p in prescriptions:
                med_details.append(f"- {p.medicine_name} (dosage: {p.dosage}, purpose: {p.purpose})")
                all_meds.append({
                    "medicine_name": p.medicine_name,
                    "purpose": p.purpose,
                    "dosage": p.dosage,
                    "precautions": p.precautions,
                    "date_prescribed": doc_date
                })
            
            if med_details:
                block += "Prescribed Medications:\n" + "\n".join(med_details) + "\n"
            
            history_blocks.append(block)

        raw_history_text = "\n\n=== Medical Entry ===\n\n".join(history_blocks)

        # Call LLM to synthesize report
        prompt_messages = [
            {
                "role": "system",
                "content": (
                    "You are a clinical coordinator AI. You synthesize multiple medical records (lab results, summaries, medicines) "
                    "for a patient into a single, comprehensive patient health summary report written in Markdown.\n\n"
                    "Structure the report with the following sections:\n"
                    "1. ## Patient Profile Summary (age/gender/basic info)\n"
                    "2. ## Medical Progress Timeline (narrative of their documents chronologically)\n"
                    "3. ## Consolidated Medication List (list all currently prescribed medicines, their purposes, and dosages)\n"
                    "4. ## Key Health Indicators & Trends (synthesize values across reports: e.g. blood sugar over time, cholesterol updates)\n"
                    "5. ## Health and Wellness Recommendations (simple advice based on their clinical findings, diet, lifestyle, and alert criteria)\n\n"
                    "Keep the tone reassuring, professional, and clear. Avoid high-level medical jargon where possible."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Patient Name: {patient.name}\n"
                    f"Gender: {patient.gender or 'Not Specified'}\n"
                    f"DOB: {patient.date_of_birth or 'Not Specified'}\n"
                    f"Relationship: {patient.relation or 'Self'}"
                    f"Blood Group: {patient.blood_group or 'Not Specified'}\n\n"
                    f"Historical Records Summary:\n{raw_history_text}"
                )
            }
        ]

        report_markdown = ""
        if ai_service.client:
            try:
                report_markdown = ai_service._call_llm(prompt_messages, json_mode=False)
            except Exception as e:
                logger.error(f"Error compiling patient health report via LLM: {str(e)}")

        # Fallback to local compiler if LLM fails or is missing key
        if not report_markdown:
            report_markdown = self._generate_fallback_markdown(patient, timeline, all_meds)

        return {
            "patient_name": patient.name,
            "relationship": patient.relationship,
            "report_markdown": report_markdown,
            "medications": all_meds,
            "timeline": timeline
        }

    def _generate_fallback_markdown(self, patient: Patient, timeline: List[Dict[str, Any]], medications: List[Dict[str, Any]]) -> str:
        """Generates a standard formatted report when LLM is unavailable."""
        md = f"# Patient Health Progress Report: {patient.name}\n\n"
        md += f"**Relationship**: {patient.relationship or 'Self'} | **Gender**: {patient.gender or 'N/A'} | **Blood Group**: {patient.blood_group or 'N/A'} | **Date of Birth**: {patient.date_of_birth or 'N/A'}\n\n"
        md += "---\n\n"
        
        md += "## Medical Records Timeline\n"
        for item in timeline:
            md += f"- **{item['date']}** - *{item['type'].upper()}* ({item['file_name']})\n"
            md += f"  > {item['summary']}\n\n"
            
        md += "## Prescribed Medications\n"
        if not medications:
            md += "No recorded medications.\n"
        else:
            for med in medications:
                md += f"- **{med['medicine_name']}** (Prescribed: {med['date_prescribed']})\n"
                md += f"  * *Purpose*: {med['purpose'] or 'Not Specified'}\n"
                md += f"  * *Dosage*: {med['dosage'] or 'N/A'}\n"
                if med['precautions']:
                    md += f"  * *Precautions*: {med['precautions']}\n"
                md += "\n"
                
        md += "## Health Guidance\n"
        md += "- Keep diagnostic reports up-to-date and share changes with your treating physician.\n"
        md += "- Consistently follow dosage schedules for prescribed medications.\n\n"
        md += "*Disclaimer: This summary report is automatically compiled from your health logs and should not replace advice from a healthcare professional.*"
        return md

patient_service = PatientService()
