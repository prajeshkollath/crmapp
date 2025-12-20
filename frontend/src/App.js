import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

import { MainLayout } from './components/layout';
import Dashboard from './pages/Dashboard';
import ContactsList from './pages/ContactsList';
import AuditLogs from './pages/AuditLogs';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function AuthCheck({ children }) {
  const getDemoUser = () => {
    const demoUser = sessionStorage.getItem('demo_user');
    if (demoUser) {
      try {
        return JSON.parse(demoUser);
      } catch (e) {
        console.error('Error parsing demo user:', e);
        sessionStorage.removeItem('demo_user');
      }
    }
    return null;
  };

  const initialDemoUser = getDemoUser();
  const [isAuthenticated, setIsAuthenticated] = useState(initialDemoUser ? true : null);
  const [user, setUser] = useState(initialDemoUser);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (initialDemoUser) {
      return;
    }

    const authenticateUser = async () => {
      if (location.state?.user) {
        setIsAuthenticated(true);
        setUser(location.state.user);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setIsAuthenticated(true);
        setUser(userData);
      } catch (error) {
        console.log('Authentication failed, redirecting to login');
        setIsAuthenticated(false);
      }
    };

    authenticateUser();
  }, [location, navigate, initialDemoUser]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return React.cloneElement(children, { user });
}

function RootRedirect() {
  const demoUser = sessionStorage.getItem('demo_user');
  if (demoUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <AuthCheck>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </AuthCheck>
          }
        />
        <Route
          path="/contacts"
          element={
            <AuthCheck>
              <MainLayout>
                <ContactsList />
              </MainLayout>
            </AuthCheck>
          }
        />
        <Route
          path="/audit"
          element={
            <AuthCheck>
              <MainLayout>
                <AuditLogs />
              </MainLayout>
            </AuthCheck>
          }
        />
        <Route path="/" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
