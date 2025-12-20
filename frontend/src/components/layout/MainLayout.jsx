import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children, user, onLogout }) => {
  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 flex flex-col overflow-hidden ml-[260px] transition-all duration-300">
        {React.cloneElement(children, { user })}
      </main>
    </div>
  );
};

export default MainLayout;
