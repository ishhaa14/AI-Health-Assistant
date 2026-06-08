import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AdminUser, AdminStats } from '../types';
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
  Switch,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import {
  Users,
  FileText,
  HardDrive,
  UserCheck,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

// Setup ChartJS line graph
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Filler,
  Legend
);

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
      ]);

      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed fetching admin data:', err);
      setError('Unable to load admin control data. Make sure you have permission.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleActive = async (userId: number) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-active`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: res.data.is_active } : u))
      );
    } catch (err: any) {
      console.error('Toggle active failed:', err);
      alert(err.response?.data?.detail || 'Failed to toggle user active state.');
    }
  };

  const handleToggleAdmin = async (userId: number) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-admin`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_admin: res.data.is_admin } : u))
      );
    } catch (err: any) {
      console.error('Toggle admin failed:', err);
      alert(err.response?.data?.detail || 'Failed to toggle admin permission.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
        <CircularProgress />
      </Box>
    );
  }

  // Line Chart Configurations
  const dailyUploadsDates = stats ? stats.daily_uploads.map((du) => du.date) : [];
  const dailyUploadsCounts = stats ? stats.daily_uploads.map((du) => du.count) : [];

  const lineChartData = {
    labels: dailyUploadsDates,
    datasets: [
      {
        fill: true,
        label: 'Daily Upload Volume',
        data: dailyUploadsCounts,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#9ca3af',
          stepSize: 1,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyItems: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#f3f4f6', letterSpacing: -0.5 }}>
            Administrator Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Global metrics, usage analytics, and access overrides.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={18} />}
          onClick={fetchAdminData}
          sx={{ color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Admin Numerical Info Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ p: 1.5, m: 1.5, borderRadius: 2, bgcolor: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
              <Users size={20} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>REGISTERED USERS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f3f4f6' }}>{stats?.total_users || 0}</Typography>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ p: 1.5, m: 1.5, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              <FileText size={20} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>TOTAL DOCUMENTS</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f3f4f6' }}>{stats?.total_documents || 0}</Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ p: 1.5, m: 1.5, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              <HardDrive size={20} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>STORAGE USED (MB)</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f3f4f6' }}>{stats?.total_size_mb || 0} MB</Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
            <Box sx={{ p: 1.5, m: 1.5, borderRadius: 2, bgcolor: 'rgba(234,179,8,0.1)', color: '#eab308' }}>
              <UserCheck size={20} />
            </Box>
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>PATIENT PROFILES</Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#f3f4f6' }}>{stats?.total_patients || 0}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Usage Charts & Visualizations */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp size={18} color="#0ea5e9" />
                Upload Traffic (Last 30 Days)
              </Typography>
              {stats && stats.daily_uploads.length > 0 ? (
                <Box sx={{ height: 280 }}>
                  <Line data={lineChartData} options={lineChartOptions} />
                </Box>
              ) : (
                <Box display="flex" alignItems="center" justifyContent="center" height={280}>
                  <Typography variant="body2" color="textSecondary">
                    No uploads traffic recorded yet.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* User Controls overrides Table */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Manage App Users
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Email Address</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Full Name</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Registration Date</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Uploads Count</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Active Access</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Admin Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{u.email}</TableCell>
                    <TableCell>{u.full_name || 'N/A'}</TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{u.doc_count}</TableCell>
                    <TableCell>
                      <Switch
                        checked={u.is_active}
                        onChange={() => handleToggleActive(u.id)}
                        color="success"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.is_admin}
                        onChange={() => handleToggleAdmin(u.id)}
                        color="primary"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};
export default AdminPanel;
