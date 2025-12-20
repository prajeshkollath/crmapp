import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MainLayout = ({ children, user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Clear demo mode data
      sessionStorage.removeItem('demo_user');
      localStorage.removeItem('crm_demo_contacts');
      
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
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col overflow-hidden ml-[260px] transition-all duration-300">
        {React.cloneElement(children, { user })}
      </main>
    </div>
  );
};

export default MainLayout;
