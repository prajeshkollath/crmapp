import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Building2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/session?session_id=${sessionId}`, {
          method: 'POST',
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Auth failed');

        const userData = await response.json();
        
        // Clear demo mode
        sessionStorage.removeItem('demo_user');
        localStorage.removeItem('crm_demo_contacts');
        
        navigate('/dashboard', { state: { user: userData }, replace: true });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login');
      }
    };

    processSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-6">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-lg font-medium">Authenticating...</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait while we sign you in</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
