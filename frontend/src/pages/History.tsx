import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Document } from '../types';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Search,
  Eye,
  MessageSquare,
  Trash2,
  FileQuestion,
  RefreshCw,
  FolderArchive,
} from 'lucide-react';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search query
  const [searchVal, setSearchVal] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/documents/');
      setDocuments(res.data);
    } catch (err: any) {
      console.error('Failed fetching archives:', err);
      setError('Unable to load archives. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document and all its analytics?')) {
      return;
    }
    
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Failed deleting document:', err);
      alert('Failed to delete document.');
    }
  };

  const getStatusChip = (status: string) => {
    const configs: Record<string, { label: string; color: any }> = {
      PENDING: { label: 'Queued', color: 'default' },
      EXTRACTING: { label: 'Reading', color: 'info' },
      ANALYZING: { label: 'Analyzing', color: 'warning' },
      COMPLETED: { label: 'Ready', color: 'success' },
      FAILED: { label: 'Failed', color: 'error' },
    };
    const c = configs[status] || { label: status, color: 'default' };
    return <Chip label={c.label} color={c.color} size="small" sx={{ fontWeight: 600 }} />;
  };

  const filteredDocs = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchVal.toLowerCase()) ||
    (doc.patient && doc.patient.name.toLowerCase().includes(searchVal.toLowerCase()))
  );

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#f3f4f6', letterSpacing: -0.5 }}>
            Analysis Archives
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Browse and manage previous medical report scans and chat logs.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={18} />}
          onClick={fetchDocuments}
          sx={{ color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Refresh List
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters & Search Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by filename or patient name..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                <Search size={18} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      {/* Archive Grid Database list */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : filteredDocs.length === 0 ? (
        <Paper sx={{ py: 8, textAlign: 'center', borderRadius: 4 }}>
          <FolderArchive size={48} style={{ color: '#4b5563', marginBottom: 15 }} />
          <Typography variant="h6" color="textSecondary">
            {searchVal ? 'No matches found.' : 'No uploaded documents in your history.'}
          </Typography>
          {!searchVal && (
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/upload')}>
              Upload First Report
            </Button>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
              <TableRow>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>File Name</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Patient Profile</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>File Size</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Upload Date</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600, color: '#e5e7eb' }}>{doc.file_name}</TableCell>
                  <TableCell>
                    {doc.patient ? (
                      <Chip
                        label={`${doc.patient.name} (${doc.patient.relationship})`}
                        variant="outlined"
                        size="small"
                        sx={{ color: '#0ea5e9', borderColor: 'rgba(14,165,233,0.2)' }}
                      />
                    ) : (
                      <em style={{ color: '#4b5563' }}>None (Anonymous)</em>
                    )}
                  </TableCell>
                  <TableCell>{Math.round((doc.file_size / 1024 / 1024) * 100) / 100} MB</TableCell>
                  <TableCell>{getStatusChip(doc.status)}</TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="View Insights">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/history/${doc.id}`)}
                            disabled={doc.status !== 'COMPLETED'}
                            sx={{ color: '#0ea5e9' }}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Contextual Chat">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/chat/${doc.id}`)}
                            disabled={doc.status !== 'COMPLETED'}
                            sx={{ color: '#10b981' }}
                          >
                            <MessageSquare size={16} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete Scan">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(doc.id)}
                          sx={{ color: '#f43f5e', '&:hover': { bgcolor: 'rgba(244,63,94,0.05)' } }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
export default History;
