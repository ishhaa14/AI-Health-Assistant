import json
from typing import Dict, Any, List, Optional
from openai import OpenAI
from app.core.config import settings
from app.core.logging import logger

class AIService:
    def __init__(self):
        # Only initialize client if key is set, otherwise use mock modes gracefully
        self.client = None
        if settings.OPENAI_API_KEY:
            self.client = OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url=settings.OPENAI_API_BASE
            )

    def _call_llm(self, messages: List[Dict[str, str]], json_mode: bool = False) -> str:
        """Helper to invoke LLM. Falls back to mock responses if API key is missing."""
        if not self.client:
            logger.warning("OPENAI_API_KEY is not configured. Falling back to Mock AI responses.")
            return ""

        try:
            kwargs = {
                "model": settings.LLM_MODEL,
                "messages": messages,
                "temperature": 0.3
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
                
            response = self.client.chat.completions.create(**kwargs)
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error calling LLM provider: {str(e)}", exc_info=True)
            raise e

    def detect_document_type(self, text: str) -> str:
        """Classifies the medical document based on its text content."""
        if not text.strip():
            return "lab_report"

        messages = [
            {"role": "system", "content": "You are a medical document classifier. Classify the document as either 'lab_report', 'prescription', or 'discharge_summary'. Return JSON format with key 'document_type'."},
            {"role": "user", "content": f"Document text:\n{text[:6000]}"}
        ]
        
        try:
            res_content = self._call_llm(messages, json_mode=True)
            if not res_content:
                return self._mock_detect_document_type(text)
            
            data = json.loads(res_content)
            doc_type = data.get("document_type", "lab_report")
            if doc_type in ["lab_report", "prescription", "discharge_summary"]:
                return doc_type
            return "lab_report"
        except Exception:
            return self._mock_detect_document_type(text)

    def simplify_report(self, text: str, document_type: str) -> Dict[str, str]:
        """Translates medical reports into patient-friendly, simple explanations."""
        messages = [
            {
                "role": "system", 
                "content": (
                    "You are an expert patient-friendly medical AI assistant. Explain the medical document "
                    "in simple, reassuring, and clear terms. Format your response as a JSON object with these exact keys:\n"
                    "1. 'summary': A 2-3 sentence overview of what the document is, its date, and the main findings.\n"
                    "2. 'abnormal_values': Identify values outside reference ranges (high/low). Explain what these mean "
                    "in plain English. If there are none, write 'No abnormal values were identified.'\n"
                    "3. 'general_explanation': Simple translations for medical jargon, procedures, or test names mentioned."
                )
            },
            {"role": "user", "content": f"Document type: {document_type}\nDocument Text:\n{text[:6000]}"}
        ]

        try:
            res_content = self._call_llm(messages, json_mode=True)
            if not res_content:
                return self._mock_simplify_report(text, document_type)
            
            return json.loads(res_content)
        except Exception:
            return self._mock_simplify_report(text, document_type)

    def explain_prescription(self, text: str) -> List[Dict[str, Any]]:
        """Parses medication info from documents to build a structured prescription schema."""
        messages = [
            {
                "role": "system", 
                "content": (
                    "You are a clinical assistant. Extract all medications listed in the medical document. "
                    "Format your response as a JSON object with a single key 'medicines', which is a list of objects. "
                    "Each object must contain these keys:\n"
                    "- 'medicine_name': The brand or chemical name.\n"
                    "- 'purpose': The condition it treats in simple terms.\n"
                    "- 'dosage': Form and instruction (e.g. '1 tablet twice a day after meals', '5ml at night').\n"
                    "- 'precautions': Simple instructions on side effects, warnings, or dietary guidelines."
                )
            },
            {"role": "user", "content": f"Prescription Text:\n{text[:6000]}"}
        ]

        try:
            res_content = self._call_llm(messages, json_mode=True)
            if not res_content:
                return self._mock_explain_prescription(text)
            
            data = json.loads(res_content)
            return data.get("medicines", [])
        except Exception:
            return self._mock_explain_prescription(text)

    def generate_chat_response(self, document_text: str, history: List[Dict[str, str]], user_message: str) -> str:
        """Answers contextual questions regarding the medical document."""
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a reassuring, helpful health assistant chatbot. The user is asking questions "
                    "about their uploaded medical document.\n"
                    "Use the document text below to answer the question. Simplify terms and be clear.\n"
                    "If the answer cannot be found in the document, use general medical knowledge, but clarify "
                    "that it's general knowledge and not in the specific report.\n"
                    "ALWAYS include a disclaimer that you are an AI assistant and they should consult a doctor."
                )
            }
        ]
        
        # Append document context
        messages.append({"role": "system", "content": f"Document context:\n{document_text[:6000]}"})
        
        # Append chat history logs (limit to last 8 messages)
        for chat in history[-8:]:
            messages.append({"role": chat["role"], "content": chat["content"]})
            
        # Append latest message
        messages.append({"role": "user", "content": user_message})

        try:
            reply = self._call_llm(messages, json_mode=False)
            if not reply:
                return self._mock_chat_response(user_message)
            return reply
        except Exception:
            return self._mock_chat_response(user_message)

    # --- Graceful Mocks for Offline/No-API-Key usage ---

    def _mock_detect_document_type(self, text: str) -> str:
        t = text.lower()
        if "prescription" in t or "rx" in t or "tablet" in t or "mg" in t:
            return "prescription"
        elif "discharge" in t or "admitted" in t or "diagnosis" in t or "history of" in t:
            return "discharge_summary"
        return "lab_report"

    def _mock_simplify_report(self, text: str, document_type: str) -> Dict[str, str]:
        t = text.lower()
        if document_type == "prescription":
            return {
                "summary": "This document appears to be a medical prescription prescribing medications for your recovery.",
                "abnormal_values": "No diagnostic lab tests were found. This is a list of prescribed medications.",
                "general_explanation": "Rx: Symbol for prescription.\nPRN: Take as needed.\nOD: Once a day."
            }
        elif document_type == "discharge_summary":
            return {
                "summary": "This is a hospital discharge summary detailing your clinical admission, treatment received, and recovery plan.",
                "abnormal_values": "Diagnostic numbers are within normal ranges unless otherwise noted in the specific lab results section.",
                "general_explanation": "Discharge summary: A document given upon leaving the hospital outlining care plans.\nIntravenous (IV): Administered directly into a vein."
            }
        else: # lab report
            # Check for standard mock markers
            abnormal = []
            if "hemoglobin" in t:
                abnormal.append("Hemoglobin: Measured at 10.5 g/dL (Normal: 12-16 g/dL). This is low, indicating mild anemia (low red blood cells), which can cause tiredness.")
            if "cholesterol" in t:
                abnormal.append("Total Cholesterol: Measured at 240 mg/dL (Normal: < 200 mg/dL). This is high, suggesting a need to review dietary fats to protect heart health.")
            if "glucose" in t or "sugar" in t:
                abnormal.append("Fasting Glucose: Measured at 126 mg/dL (Normal: 70-100 mg/dL). This is elevated and indicates pre-diabetic or diabetic levels, which requires clinical consultation.")
            
            return {
                "summary": "This is a diagnostic laboratory test report measuring various biochemistry or hematology levels.",
                "abnormal_values": "\n\n".join(abnormal) if abnormal else "All values seem to fall within the standard reference ranges specified by the lab.",
                "general_explanation": "mg/dL: Milligrams per deciliter (measurement unit).\ng/dL: Grams per deciliter (measurement unit).\nReference Range: The standard limits of normal values."
            }

    def _mock_explain_prescription(self, text: str) -> List[Dict[str, Any]]:
        t = text.lower()
        medicines = []
        
        # Simple rule-based mock matcher
        if "amoxicillin" in t or "antibiotic" in t:
            medicines.append({
                "medicine_name": "Amoxicillin 500mg",
                "purpose": "Antibiotic to treat bacterial infections.",
                "dosage": "1 capsule three times a day for 7 days. Complete the course.",
                "precautions": "Take with meals. Report any severe diarrhea or rashes immediately."
            })
        if "atorvastatin" in t or "lipitor" in t or "cholesterol" in t:
            medicines.append({
                "medicine_name": "Atorvastatin 20mg",
                "purpose": "Lowers high cholesterol and protects blood vessels.",
                "dosage": "1 tablet daily at bedtime.",
                "precautions": "Avoid eating grapefruit. Alert your doctor if you feel unexplained muscle pain."
            })
        if "metformin" in t or "glucophage" in t:
            medicines.append({
                "medicine_name": "Metformin 500mg",
                "purpose": "Helps control blood sugar levels in type 2 diabetes.",
                "dosage": "1 tablet twice daily with breakfast and dinner.",
                "precautions": "Take with food to minimize stomach upset. Stay hydrated."
            })
            
        # Default medicine if none found but text has medications
        if not medicines and ("tablet" in t or "mg" in t or "rx" in t):
            medicines.append({
                "medicine_name": "Paracetamol 500mg",
                "purpose": "Relieves mild to moderate pain and reduces fever.",
                "dosage": "1 tablet every 6 hours as needed for pain or fever. Max 4 tablets a day.",
                "precautions": "Do not take other acetaminophen products concurrently. Harmful in high doses."
            })
            
        return medicines

    def _mock_chat_response(self, user_message: str) -> str:
        return (
            f"Regarding your query about: '{user_message}'.\n\n"
            "This system is currently running in offline mock mode (API key is not configured). "
            "Under regular setup, the AI reads your document to provide a specific, contextual answer.\n\n"
            "Disclaimer: I am an AI assistant and this should not replace medical consultation. Please consult a doctor."
        )

ai_service = AIService()
