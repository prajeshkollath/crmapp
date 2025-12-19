import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleDemoLogin = () => {
    // Create demo user and store in sessionStorage
    const demoUser = {
      id: 'demo-user-123',
      name: 'Demo User',
      email: 'demo@example.com',
      picture: 'https://images.unsplash.com/photo-1689600944138-da3b150d9cb8?w=150&h=150&fit=crop',
      tenant_id: 'demo-tenant-123'
    };
    
    sessionStorage.setItem('demo_user', JSON.stringify(demoUser));
    navigate('/dashboard', { state: { user: demoUser } });
  };

  const handleGoogleLogin = () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: '#002FA7' }}>
            CRM Platform
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Production-ready multi-tenant CRM
          </Typography>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleDemoLogin}
            data-testid="demo-login-btn"
            sx={{ py: 1.5 }}
          >
            View Dashboard
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Multi-tenant • RBAC • Audit Logs • Webhooks
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
