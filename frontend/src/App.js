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
import AuthCallback from './pages/AuthCallback';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1',
      light: '#A5B4FC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F1F5F9',
      contrastText: '#18181B',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    error: {
      main: '#F87171',
    },
    success: {
      main: '#4ADE80',
    },
    warning: {
      main: '#FBBF24',
    },
    info: {
      main: '#60A5FA',
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
  // Check for demo user immediately (synchronously)
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
    // If we already have a demo user from initial state, don't do anything
    if (initialDemoUser) {
      return;
    }

    const authenticateUser = async () => {
      // Check if user passed via navigation state (demo mode)
      if (location.state?.user) {
        setIsAuthenticated(true);
        setUser(location.state.user);
        return;
      }

      // Try real authentication
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
        console.log('Authentication failed, redirecting to login');
        setIsAuthenticated(false);
      }
    };

    authenticateUser();
  }, [location, navigate, initialDemoUser]);

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

function RootRedirect() {
  // Check if user is logged in
  const demoUser = sessionStorage.getItem('demo_user');
  if (demoUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  );
}

export default App;
