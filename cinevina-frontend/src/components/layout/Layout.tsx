import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden relative">
      <Navbar />
      <main className="flex-1 pt-[56px] max-w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
