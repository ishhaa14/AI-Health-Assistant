import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  IconButton,
  InputAdornment,
  Container,
} from '@mui/material';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, Activity } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await register({
        email,
        password,
        full_name: fullName,
      });
      setSuccess(true);
      // Wait a moment before redirecting to login
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 'Registration failed. Email might already be in use.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
              color: '#0ea5e9',
              mb: 2,
            }}
          >
            <Activity size={36} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 800,
              color: '#f3f4f6',
              letterSpacing: -1,
            }}
          >
            Create Account
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Join now to parse your health reports automatically
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                Account created successfully! Redirecting to login page...
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Full Name"
                variant="outlined"
                margin="normal"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting || success}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                      <UserIcon size={18} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                margin="normal"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || success}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                      <Mail size={18} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                margin="normal"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting || success}
                helperText="Must be at least 6 characters"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                      <Lock size={18} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting || success}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {submitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Already have an account?{' '}
                <RouterLink
                  to="/login"
                  style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}
                >
                  Sign In
                </RouterLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
export default Register;
