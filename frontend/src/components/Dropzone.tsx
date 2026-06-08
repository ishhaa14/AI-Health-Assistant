import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import { UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Patient, Document } from '../types';

interface DropzoneProps {
  patients: Patient[];
  onUploadSuccess: (document: Document) => void;
  selectedPatientId?: number;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  patients,
  onUploadSuccess,
  selectedPatientId: initialPatientId,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | string>(
    initialPatientId || ''
  );
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setSuccess(false);
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF, JPG, or PNG.');
      setSelectedFile(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File is too large. Maximum size allowed is 10MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (selectedPatientId) {
      formData.append('patient_id', selectedPatientId.toString());
    }

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || selectedFile.size)
          );
          setProgress(percentCompleted);
        },
      });

      setSuccess(true);
      setSelectedFile(null);
      onUploadSuccess(response.data);
    } catch (err: any) {
      console.error('File upload failed:', err);
      setError(
        err.response?.data?.detail || 'An error occurred during file upload. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 650, mx: 'auto', p: 1 }}>
      <CardContent>
        {/* Patient Selection Selector */}
        <FormControl fullWidth size="small" sx={{ mb: 3 }}>
          <InputLabel id="patient-select-label">Select Patient Profile</InputLabel>
          <Select
            labelId="patient-select-label"
            value={selectedPatientId}
            label="Select Patient Profile"
            onChange={(e) => setSelectedPatientId(e.target.value)}
            disabled={uploading}
          >
            <MenuItem value="">
              <em>None (Anonymous Upload)</em>
            </MenuItem>
            {patients.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} ({p.relationship || 'Self'})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Drag & Drop Main Zone */}
        <Box
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'rgba(255, 255, 255, 0.15)',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            backgroundColor: dragActive ? 'rgba(14, 165, 233, 0.03)' : 'rgba(255, 255, 255, 0.01)',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: uploading ? 'rgba(255, 255, 255, 0.15)' : 'primary.main',
              backgroundColor: uploading ? 'rgba(255, 255, 255, 0.01)' : 'rgba(14, 165, 233, 0.02)',
            },
          }}
        >
          <input
            ref={inputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleChange}
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={uploading}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <UploadCloud size={48} color={dragActive ? '#0ea5e9' : '#9ca3af'} />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#f3f4f6' }}>
                Drag and drop your document here
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                Supports PDF, JPG, PNG (Max 10MB)
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              disabled={uploading}
              sx={{ borderColor: 'rgba(255,255,255,0.15)', color: '#f3f4f6' }}
            >
              Browse Files
            </Button>
          </Box>
        </Box>

        {/* Selected File Details */}
        {selectedFile && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <File size={28} color="#0ea5e9" />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: '#f3f4f6' }}>
                {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {Math.round((selectedFile.size / 1024 / 1024) * 100) / 100} MB
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleUploadSubmit}
              disabled={uploading}
              size="medium"
            >
              Analyze Document
            </Button>
          </Box>
        )}

        {/* Progress Bar */}
        {uploading && (
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyItems: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
                Uploading document...
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
          </Box>
        )}

        {/* Status Alerts */}
        {error && (
          <Alert severity="error" icon={<AlertCircle size={20} />} sx={{ mt: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" icon={<CheckCircle2 size={20} />} sx={{ mt: 3, borderRadius: 2 }}>
            Document uploaded successfully! AI is analyzing the contents in the background.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
export default Dropzone;
