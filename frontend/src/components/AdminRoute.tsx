import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

export const AdminRoute: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const isAdmin = isAuthenticated && user && user.is_admin;

  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
export default AdminRoute;
