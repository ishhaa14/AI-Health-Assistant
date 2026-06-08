export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: str;
}

export interface RegisterCredentials {
  email: string;
  password: str;
  full_name?: string;
}

export interface Patient {
  id: number;
  user_id: number;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  relationship: string | null;
  blood_group: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  relationship?: string | null;
  blood_group?: string | null;
}

export interface Document {
  id: number;
  user_id: number;
  patient_id: number | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: 'PENDING' | 'EXTRACTING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  updated_at: string;
  patient?: Patient | null;
}

export interface DocumentAnalysis {
  id: number;
  document_id: number;
  extracted_text: string | null;
  summary: string | null;
  abnormal_values: string | null;
  general_explanation: string | null;
  document_type: string | null;
  created_at: string;
}

export interface Prescription {
  id: number;
  document_id: number;
  medicine_name: string;
  purpose: string | null;
  dosage: string | null;
  precautions: string | null;
  created_at: string;
}

export interface DocumentDetail extends Document {
  analysis?: DocumentAnalysis | null;
  prescriptions: Prescription[];
}

export interface ChatMessage {
  id: number;
  document_id: number;
  user_id: number;
  sender: 'user' | 'assistant';
  message: string;
  created_at: string;
}

export interface DashboardStats {
  total_documents: number;
  total_patients: number;
  recent_documents: Document[];
  category_distribution: Record<string, number>;
  processing_status: Record<string, number>;
  latest_prescriptions: Array<{
    medicine_name: string;
    purpose: string | null;
    dosage: string | null;
    date: string;
  }>;
}

export interface AdminUser extends User {
  doc_count: number;
}

export interface AdminStats {
  total_users: number;
  total_documents: number;
  total_patients: number;
  total_size_mb: number;
  daily_uploads: Array<{ date: string; count: number }>;
  type_distribution: Record<string, number>;
}
