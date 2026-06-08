import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Upload from './pages/Upload';
import History from './pages/History';
import AnalysisResult from './pages/AnalysisResult';
import DocumentChat from './pages/DocumentChat';
import AdminPanel from './pages/AdminPanel';

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected User Routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/dashboard"
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                }
              />
              <Route
                path="/patients"
                element={
                  <Layout>
                    <Patients />
                  </Layout>
                }
              />
              <Route
                path="/upload"
                element={
                  <Layout>
                    <Upload />
                  </Layout>
                }
              />
              <Route
                path="/history"
                element={
                  <Layout>
                    <History />
                  </Layout>
                }
              />
              <Route
                path="/history/:id"
                element={
                  <Layout>
                    <AnalysisResult />
                  </Layout>
                }
              />
              <Route
                path="/chat/:id"
                element={
                  <Layout>
                    <DocumentChat />
                  </Layout>
                }
              />
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route
                path="/admin"
                element={
                  <Layout>
                    <AdminPanel />
                  </Layout>
                }
              />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};
export default App;
