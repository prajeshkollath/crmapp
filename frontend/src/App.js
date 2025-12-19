import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import './App.css';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ContactsList from './pages/ContactsList';
import AuditLogs from './pages/AuditLogs';
import LoginPage from './pages/LoginPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#002FA7',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F4F4F5',
      contrastText: '#18181B',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0A0A0A',
      secondary: '#71717A',
    },
    error: {
      main: '#EF4444',
    },
  },
  typography: {
    fontFamily: '"Work Sans", sans-serif',
    h1: {
      fontFamily: '"Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Manrope", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Manrope", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Manrope", sans-serif',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 2,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 2,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

const API_URL = process.env.REACT_APP_BACKEND_URL;

function AuthCheck({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user passed via navigation state (demo mode)
    if (location.state?.user) {
      setIsAuthenticated(true);
      setUser(location.state.user);
      return;
    }

    // Check sessionStorage for demo user
    const demoUser = sessionStorage.getItem('demo_user');
    if (demoUser) {
      try {
        const userData = JSON.parse(demoUser);
        setIsAuthenticated(true);
        setUser(userData);
        return;
      } catch (e) {
        console.error('Error parsing demo user:', e);
      }
    }

    // Try real authentication
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setIsAuthenticated(true);
        setUser(userData);
      } catch (error) {
        // If auth fails, redirect to login
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [location, navigate]);

  if (isAuthenticated === null) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return React.cloneElement(children, { user });
}

function MainLayout({ children, user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar user={user} onLogout={handleLogout} />
      <Box component="main" sx={{ flexGrow: 1, ml: '256px', p: 3 }}>
        {React.cloneElement(children, { user })}
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
