import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DocumentDetail } from '../types';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Grid,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  MessageSquare,
  AlertTriangle,
  BookOpen,
  FileText,
  ShieldAlert,
  Pill,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const AnalysisResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/documents/${id}`);
      setDoc(res.data);
    } catch (err: any) {
      console.error('Failed fetching document details:', err);
      setError(err.response?.data?.detail || 'Unable to retrieve report details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !doc) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Document details not found.'}</Alert>
        <Button startIcon={<ChevronLeft />} onClick={() => navigate('/history')}>
          Back to Archives
        </Button>
      </Box>
    );
  }

  const hasPrescriptions = doc.prescriptions && doc.prescriptions.length > 0;
  const analysis = doc.analysis;

  return (
    <Box>
      {/* Top Controls Headers */}
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ChevronLeft size={18} />}
          onClick={() => navigate('/history')}
          sx={{ color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Back to Archives
        </Button>
        <Button
          variant="contained"
          startIcon={<MessageSquare size={18} />}
          onClick={() => navigate(`/chat/${doc.id}`)}
          color="secondary"
        >
          Ask Questions (Chat)
        </Button>
      </Box>

      {/* Profile/Document Information Banner */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={8}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {doc.file_name}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                Patient Profile:{' '}
                <strong>
                  {doc.patient ? doc.patient.name : 'Anonymous'} 
                  {doc.patient?.relationship ? ` (${doc.patient.relationship})` : ''}
                </strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
              <Typography variant="caption" color="textSecondary" display="block">
                UPLOADED ON
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {new Date(doc.created_at).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Layout */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, n) => setTabValue(n)} textColor="primary" indicatorColor="primary">
          <Tab label="Simple Summary" icon={<FileText size={18} />} iconPosition="start" sx={{ fontWeight: 600 }} />
          <Tab label="Abnormal Values" icon={<AlertTriangle size={18} />} iconPosition="start" sx={{ fontWeight: 600 }} />
          <Tab label="Medical Jargon" icon={<BookOpen size={18} />} iconPosition="start" sx={{ fontWeight: 600 }} />
          {hasPrescriptions && (
            <Tab label="Prescriptions" icon={<Pill size={18} />} iconPosition="start" sx={{ fontWeight: 600 }} />
          )}
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {/* 1. Summary */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            Simplified Summary
          </Typography>
          <Divider sx={{ mb: 2, opacity: 0.05 }} />
          <Box className="markdown-body">
            <ReactMarkdown>
              {analysis?.summary || 'No summary report compiled for this document.'}
            </ReactMarkdown>
          </Box>
        </Paper>
      </TabPanel>

      {/* 2. Abnormal Values */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: '#f43f5e' }}>
            <ShieldAlert size={20} />
            Abnormal Parameters & Flags
          </Typography>
          <Divider sx={{ mb: 2, opacity: 0.05 }} />
          <Box className="markdown-body">
            <ReactMarkdown>
              {analysis?.abnormal_values || 'No abnormal indicators or out-of-range parameters were identified.'}
            </ReactMarkdown>
          </Box>
        </Paper>
      </TabPanel>

      {/* 3. Terminology explanations */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            Terminology Explanations
          </Typography>
          <Divider sx={{ mb: 2, opacity: 0.05 }} />
          <Box className="markdown-body">
            <ReactMarkdown>
              {analysis?.general_explanation || 'No general medical terminology translations are available.'}
            </ReactMarkdown>
          </Box>
        </Paper>
      </TabPanel>

      {/* 4. Prescription grid */}
      {hasPrescriptions && (
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Pill size={20} color="#10b981" />
            Identified Medications
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Medicine Name</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Purpose</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Dosage / Schedules</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Precautions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doc.prescriptions.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#f3f4f6' }}>{p.medicine_name}</TableCell>
                    <TableCell>{p.purpose || 'N/A'}</TableCell>
                    <TableCell>{p.dosage || 'N/A'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', maxWidth: 280 }}>{p.precautions || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      )}
    </Box>
  );
};
export default AnalysisResult;
