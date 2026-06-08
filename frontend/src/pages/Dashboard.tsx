import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DashboardStats } from '../types';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FileText,
  Users,
  Eye,
  MessageSquare,
  TrendingUp,
  Clock,
  PlusCircle,
  FileCheck,
  FileQuestion,
  Search,
} from 'lucide-react';

// Setup ChartJS registrations
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartTooltip, Legend);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/');
      setStats(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed fetching stats:', err);
      setError('Unable to retrieve dashboard analytics. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const getStatusChip = (status: string) => {
    const configs: Record<string, { label: string; color: any }> = {
      PENDING: { label: 'Queued', color: 'default' },
      EXTRACTING: { label: 'Reading File', color: 'info' },
      ANALYZING: { label: 'Analyzing', color: 'warning' },
      COMPLETED: { label: 'Ready', color: 'success' },
      FAILED: { label: 'Failed', color: 'error' },
    };
    const c = configs[status] || { label: status, color: 'default' };
    return <Chip label={c.label} color={c.color} size="small" sx={{ fontWeight: 600 }} />;
  };

  const getDocTypeDisplay = (type: string | null) => {
    if (!type) return 'Analyzing...';
    const mapping: Record<string, string> = {
      lab_report: 'Lab Diagnostic Report',
      prescription: 'Prescription Schedule',
      discharge_summary: 'Discharge Summary',
    };
    return mapping[type] || type;
  };

  // Pie chart configurations
  const doughnutData = {
    labels: ['Lab Reports', 'Prescriptions', 'Discharge Summaries'],
    datasets: [
      {
        data: stats
          ? [
              stats.category_distribution.lab_report || 0,
              stats.category_distribution.prescription || 0,
              stats.category_distribution.discharge_summary || 0,
            ]
          : [0, 0, 0],
        backgroundColor: [
          'rgba(14, 165, 233, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(99, 102, 241, 0.7)',
        ],
        borderColor: ['#0ea5e9', '#10b981', '#6366f1'],
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          font: {
            family: 'Inter',
          },
        },
      },
    },
    cutout: '70%',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#f3f4f6', letterSpacing: -0.5 }}>
            Medical Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Overview of uploaded medical documents, patient profiles, and insights.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusCircle size={18} />}
          onClick={() => navigate('/upload')}
        >
          New Analysis
        </Button>
      </Box>

      {/* Analytics Numerical Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
            <Box
              sx={{
                p: 2,
                m: 2,
                borderRadius: 3,
                bgcolor: 'rgba(14, 165, 233, 0.1)',
                color: '#0ea5e9',
              }}
            >
              <FileText size={24} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 550 }}>
                TOTAL DOCUMENTS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#f3f4f6', mt: 0.5 }}>
                {stats?.total_documents || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
            <Box
              sx={{
                p: 2,
                m: 2,
                borderRadius: 3,
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
              }}
            >
              <Users size={24} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 550 }}>
                PATIENT PROFILES
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#f3f4f6', mt: 0.5 }}>
                {stats?.total_patients || 0}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={12} md={4}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
            <Box
              sx={{
                p: 2,
                m: 2,
                borderRadius: 3,
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1',
              }}
            >
              <TrendingUp size={24} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 550 }}>
                STABILIZED METRICS
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#f3f4f6', mt: 0.5 }}>
                {stats && stats.total_documents > 0
                  ? Math.round(
                      ((stats.processing_status.COMPLETED || 0) / stats.total_documents) * 100
                    )
                  : 0}
                %
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Main Grid Content */}
      <Grid container spacing={4}>
        {/* Left Side: Recent Uploads Queue */}
        <Grid item xs={12} lg={8}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Clock size={18} />
            Recent Document Uploads
          </Typography>
          
          <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>File Name</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Patient</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!stats || stats.recent_documents.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <FileQuestion size={36} style={{ color: '#6b7280', marginBottom: 10 }} />
                      <Typography variant="body2" color="textSecondary">
                        No documents uploaded yet. Click "New Analysis" above to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recent_documents.map((doc) => (
                    <TableRow key={doc.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 500 }}>{doc.file_name}</TableCell>
                      <TableCell>{doc.patient ? doc.patient.name : <em style={{ color: '#6b7280' }}>Anonymous</em>}</TableCell>
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
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Right Side: Charts and Summary */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Category Chart */}
            <Grid item xs={12}>
              <Card sx={{ p: 1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#f3f4f6' }}>
                    Document Categories
                  </Typography>
                  {stats && stats.total_documents > 0 ? (
                    <Box sx={{ height: 220, position: 'relative', display: 'flex', justifyContent: 'center' }}>
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </Box>
                  ) : (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ height: 220 }}>
                      <Typography variant="body2" color="textSecondary">
                        No categories found. Upload reports to construct distribution map.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Medications extracted */}
            <Grid item xs={12}>
              <Card sx={{ p: 1 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileCheck size={18} color="#10b981" />
                    Latest Extracted Medications
                  </Typography>
                  {(!stats || stats.latest_prescriptions.length === 0) ? (
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                      No medications identified yet.
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {stats.latest_prescriptions.map((m, i) => (
                        <Box
                          key={i}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                            borderLeft: '3px solid #10b981',
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 650, color: '#f3f4f6' }}>
                            {m.medicine_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                            Purpose: {m.purpose || 'N/A'} | Dose: {m.dosage || 'N/A'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#4b5563', display: 'block', textAlign: 'right' }}>
                            {m.date}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Dashboard;
