import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/auth';
import { MainLayout } from './components/layout';

// Pages
import Dashboard from './pages/Dashboard';
import ContactsList from './pages/ContactsList';
import AuditLogs from './pages/AuditLogs';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Layout wrapper that provides user to children
function LayoutWithAuth({ children }) {
  const { user, logout } = useAuth();
  
  return (
    <MainLayout user={user} onLogout={logout}>
      {children}
    </MainLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - redirect to dashboard if already logged in */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPasswordPage />
        </PublicRoute>
      } />
      <Route path="/reset-password" element={
        <ResetPasswordPage />
      } />

      {/* Protected routes - require authentication */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <LayoutWithAuth>
            <Dashboard />
          </LayoutWithAuth>
        </ProtectedRoute>
      } />
      <Route path="/contacts" element={
        <ProtectedRoute>
          <LayoutWithAuth>
            <ContactsList />
          </LayoutWithAuth>
        </ProtectedRoute>
      } />
      <Route path="/audit" element={
        <ProtectedRoute>
          <LayoutWithAuth>
            <AuditLogs />
          </LayoutWithAuth>
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute>
          <LayoutWithAuth>
            <AccountPage />
          </LayoutWithAuth>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
