import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Patient, Document } from '../types';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Avatar,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  User,
  Plus,
  Calendar,
  Heart,
  FileText,
  Activity,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Clock,
  Printer,
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

export const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  
  // Loading states
  const [listLoading, setListLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formRelation, setFormRelation] = useState('Self');
  const [formBlood, setFormBlood] = useState('');
  
  // Compiled report responses
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async (selectId?: number) => {
    try {
      setListLoading(true);
      const res = await api.get('/patients/');
      setPatients(res.data);
      if (res.data.length > 0) {
        // If a specific ID is requested, select it, otherwise default to first profile
        const toSelect = selectId 
          ? res.data.find((p: Patient) => p.id === selectId) || res.data[0]
          : res.data[0];
        setSelectedPatient(toSelect);
      } else {
        setSelectedPatient(null);
        setReportData(null);
      }
    } catch (err) {
      console.error('Failed listing patients:', err);
      setError('Unable to load patient profiles.');
    } finally {
      setListLoading(false);
    }
  };

  const fetchPatientReport = async (patientId: number) => {
    try {
      setReportLoading(true);
      setError(null);
      const res = await api.get(`/patients/${patientId}/report`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed creating report:', err);
      setError('Failed to generate AI aggregated health report.');
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientReport(selectedPatient.id);
      setActiveTab(0); // Reset to first tab
    }
  }, [selectedPatient]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post('/patients/', {
        name: formName,
        date_of_birth: formDob || null,
        gender: formGender || null,
        relationship: formRelation || 'Self',
        blood_group: formBlood || null,
      });

      // Clear Form and reload
      setFormName('');
      setFormDob('');
      setFormGender('');
      setFormRelation('Self');
      setFormBlood('');
      setShowForm(false);
      
      await fetchPatients(res.data.id);
    } catch (err: any) {
      console.error('Failed profile create:', err);
      setError(err.response?.data?.detail || 'Failed to save patient profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !reportData) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Health Report - ${reportData.patient_name}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1f2937; padding: 40px; line-height: 1.6; }
            h1, h2, h3 { font-family: 'Outfit', sans-serif; color: #111827; }
            h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            h2 { margin-top: 30px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
            blockquote { background: #f9fafb; border-left: 4px solid #0ea5e9; padding: 10px 20px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          ${reportData.report_markdown
            .replace(/#/g, '') // Basic Markdown to HTML approximations for printing
            .replace(/\n/g, '<br/>')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#f3f4f6', letterSpacing: -0.5 }}>
            Patient Health Reports
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage profiles and synthesize comprehensive health histories.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'View Profiles' : 'Add Profile'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {showForm ? (
        /* Create Profile Card Form */
        <Card sx={{ maxWidth: 600, mx: 'auto', p: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              Create Patient Profile
            </Typography>
            <Box component="form" onSubmit={handleCreatePatient}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Patient Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Birth Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={formGender}
                      label="Gender"
                      onChange={(e) => setFormGender(e.target.value)}
                      disabled={submitting}
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Relationship</InputLabel>
                    <Select
                      value={formRelation}
                      label="Relationship"
                      onChange={(e) => setFormRelation(e.target.value)}
                      disabled={submitting}
                    >
                      <MenuItem value="Self">Self</MenuItem>
                      <MenuItem value="Spouse">Spouse</MenuItem>
                      <MenuItem value="Child">Child</MenuItem>
                      <MenuItem value="Parent">Parent</MenuItem>
                      <MenuItem value="Sibling">Sibling</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Blood Group"
                    placeholder="e.g. O+, A-, B+"
                    value={formBlood}
                    onChange={(e) => setFormBlood(e.target.value)}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={12} sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    sx={{ flexGrow: 1 }}
                  >
                    {submitting ? 'Creating...' : 'Create Profile'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                    sx={{ color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    Cancel
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      ) : listLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : patients.length === 0 ? (
        /* Empty Profiles State */
        <Box textAlign="center" py={8}>
          <User size={48} style={{ color: '#4b5563', marginBottom: 15 }} />
          <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
            No patient profiles registered yet.
          </Typography>
          <Button variant="contained" onClick={() => setShowForm(true)}>
            Create First Profile
          </Button>
        </Box>
      ) : (
        /* Profiles Split Grid Layout */
        <Grid container spacing={4}>
          {/* Left Column: Profiles List */}
          <Grid item xs={12} md={4} lg={3}>
            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: 600 }}>
              SELECT PATIENT
            </Typography>
            <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
              <List disablePadding>
                {patients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  return (
                    <React.Fragment key={p.id}>
                      <ListItem disablePadding>
                        <ListItemButton
                          selected={isSelected}
                          onClick={() => setSelectedPatient(p)}
                          sx={{
                            py: 2,
                            px: 2.5,
                            borderLeft: isSelected ? '4px solid #0ea5e9' : '4px solid transparent',
                            backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.05)' : 'transparent',
                          }}
                        >
                          <Avatar sx={{ bgcolor: isSelected ? '#0ea5e9' : 'rgba(255,255,255,0.05)', mr: 2 }}>
                            {p.name.charAt(0)}
                          </Avatar>
                          <ListItemText
                            primary={p.name}
                            primaryTypographyProps={{ fontWeight: 600 }}
                            secondary={p.relationship || 'Self'}
                          />
                        </ListItemButton>
                      </ListItem>
                      <Divider sx={{ opacity: 0.05 }} />
                    </React.Fragment>
                  );
                })}
              </List>
            </Paper>
          </Grid>

          {/* Right Column: Selected Patient Details and Generated Health Report */}
          <Grid item xs={12} md={8} lg={9}>
            {selectedPatient && (
              <Box>
                {/* Header Profile Meta */}
                <Card sx={{ mb: 4 }}>
                  <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', p: 3 }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: '#0ea5e9', fontSize: '1.5rem', fontWeight: 600 }}>
                      {selectedPatient.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {selectedPatient.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Relationship: {selectedPatient.relationship || 'Self'}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={3}>
                      {selectedPatient.date_of_birth && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Calendar size={18} color="#0ea5e9" />
                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">BIRTH DATE</Typography>
                            <Typography variant="body2" fontWeight={600}>{selectedPatient.date_of_birth}</Typography>
                          </Box>
                        </Box>
                      )}
                      {selectedPatient.blood_group && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Heart size={18} color="#f43f5e" />
                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">BLOOD GROUP</Typography>
                            <Typography variant="body2" fontWeight={600}>{selectedPatient.blood_group}</Typography>
                          </Box>
                        </Box>
                      )}
                      {selectedPatient.gender && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Activity size={18} color="#10b981" />
                          <Box>
                            <Typography variant="caption" color="textSecondary" display="block">GENDER</Typography>
                            <Typography variant="body2" fontWeight={600}>{selectedPatient.gender}</Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Tabs selection: Report versus File Timelines */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={activeTab} onChange={(e, n) => setActiveTab(n)} textColor="primary" indicatorColor="primary">
                    <Tab label="AI Synthesis Report" sx={{ fontWeight: 600 }} />
                    <Tab label="Medical Timeline" sx={{ fontWeight: 600 }} />
                    <Tab label="Consolidated Medicines" sx={{ fontWeight: 600 }} />
                  </Tabs>
                </Box>

                {/* Tab 1: Consolidated AI Report */}
                <TabPanel value={activeTab} index={0}>
                  {reportLoading ? (
                    <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={2}>
                      <CircularProgress color="primary" />
                      <Typography variant="body2" color="textSecondary">
                        Aggregating medical documents and generating health history...
                      </Typography>
                    </Box>
                  ) : !reportData ? (
                    <Typography>No details found.</Typography>
                  ) : (
                    <Box>
                      <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mb: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<RefreshCw size={16} />}
                          onClick={() => fetchPatientReport(selectedPatient.id)}
                          sx={{ color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.1)' }}
                        >
                          Regenerate
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Printer size={16} />}
                          onClick={handlePrint}
                          sx={{ color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.1)' }}
                        >
                          Print Report
                        </Button>
                      </Box>
                      {/* Markdown Container */}
                      <Paper sx={{ p: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <ReactMarkdown className="markdown-body">
                          {reportData.report_markdown}
                        </ReactMarkdown>
                      </Paper>
                    </Box>
                  )}
                </TabPanel>

                {/* Tab 2: Chronological Timeline list */}
                <TabPanel value={activeTab} index={1}>
                  {reportLoading ? (
                    <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                  ) : !reportData || reportData.timeline.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" align="center">
                      No processed documents found for this profile.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
                      <Table>
                        <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                          <TableRow>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Type</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>File Name</TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Key Insights</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.timeline.map((item: any, i: number) => (
                            <TableRow key={i} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{item.date}</TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>
                                {item.type.replace('_', ' ')}
                              </TableCell>
                              <TableCell>{item.file_name}</TableCell>
                              <TableCell sx={{ color: 'text.secondary' }}>{item.summary}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </TabPanel>

                {/* Tab 3: Consolidated Medicines List */}
                <TabPanel value={activeTab} index={2}>
                  {reportLoading ? (
                    <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                  ) : !reportData || reportData.medications.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" align="center">
                      No medications are recorded for this patient.
                    </Typography>
                  ) : (
                    <Grid container spacing={3}>
                      {reportData.medications.map((med: any, i: number) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Card sx={{ borderLeft: '4px solid #10b981' }}>
                            <CardContent>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f3f4f6' }}>
                                {med.medicine_name}
                              </Typography>
                              <Typography variant="body2" color="primary" sx={{ mt: 0.5, fontWeight: 500 }}>
                                Purpose: {med.purpose || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                <strong>Dosage:</strong> {med.dosage || 'N/A'}
                              </Typography>
                              {med.precautions && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1.5, p: 1, bgcolor: 'rgba(244,63,94,0.03)', borderRadius: 1, border: '1px solid rgba(244,63,94,0.08)' }}>
                                  ⚠️ {med.precautions}
                                </Typography>
                              )}
                              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
                                Prescribed on: {med.date_prescribed}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </TabPanel>
              </Box>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
export default Patients;
