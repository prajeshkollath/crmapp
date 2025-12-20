import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children, user, onLogout }) => {
  return (
    <div className="fixed inset-0 flex bg-background">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 flex flex-col ml-[260px] overflow-hidden">
        {React.cloneElement(children, { user })}
      </main>
    </div>
  );
};

export default MainLayout;
