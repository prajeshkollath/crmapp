import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PageContainer from './PageContainer';

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
    <div className="min-h-screen bg-background">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="transition-all duration-300 ml-[260px] peer-data-[collapsed=true]:ml-[68px]">
        <PageContainer>
          {React.cloneElement(children, { user })}
        </PageContainer>
      </main>
    </div>
  );
};

export default MainLayout;
