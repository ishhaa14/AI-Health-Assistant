import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Patient, Document } from '../types';
import Dropzone from '../components/Dropzone';
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { HelpCircle, ChevronRight, History } from 'lucide-react';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    try {
      const res = await api.get('/patients/');
      setPatients(res.data);
    } catch (err) {
      console.error('Failed fetching patients list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleUploadSuccess = (doc: Document) => {
    // Redirect to analysis history page where users see queues, or directly to details
    // Since details will show loading state if status is pending, redirecting to history is cleaner,
    // or we can redirect directly to the chat/insights page which polls or shows processing states!
    // Redirecting to history is standard. Let's redirect to History page.
    setTimeout(() => {
      navigate('/history');
    }, 1500);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyItems: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#f3f4f6', letterSpacing: -0.5 }}>
            Analyze Medical Reports
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Upload PDF scans or images of your reports, prescriptions, or discharge summaries.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<History size={18} />}
          onClick={() => navigate('/history')}
          sx={{ color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          View Archives
        </Button>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Dropzone patients={patients} onUploadSuccess={handleUploadSuccess} />
      </Box>

      {/* Guide Card */}
      <Card sx={{ maxWidth: 650, mx: 'auto', mt: 4, bgcolor: 'rgba(255,255,255,0.01)' }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <HelpCircle size={24} style={{ color: '#0ea5e9', flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 650, color: '#f3f4f6' }}>
              How does the simplification work?
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Once you upload a document, our secure OCR engine extracts the underlying text. 
              An OpenAI-compatible LLM parses the jargon into everyday terms, flags out-of-range lab markers, 
              catalogues dosages, and prepares precautions. You can also chat directly with the report.
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 2, color: '#4b5563' }}>
              Disclaimer: All generated summaries are AI-powered and meant for informational assistance only. 
              They do not replace professional medical evaluations.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
export default Upload;
