import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, getIdToken, logout as firebaseLogout } from '../lib/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get ID token for API calls
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        
        // Map Firebase user to our user object
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          picture: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
          provider: firebaseUser.providerData[0]?.providerId || 'password',
        });
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh token periodically (Firebase tokens expire after 1 hour)
  useEffect(() => {
    if (!user) return;
    
    const refreshToken = async () => {
      const newToken = await getIdToken();
      setToken(newToken);
    };

    // Refresh token every 50 minutes
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const logout = async () => {
    await firebaseLogout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
