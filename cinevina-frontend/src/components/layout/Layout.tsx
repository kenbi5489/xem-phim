import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] w-full overflow-x-hidden relative">
      <Navbar />
      <main className="flex-1 pt-16 pb-[env(safe-area-inset-bottom)] max-w-full overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
