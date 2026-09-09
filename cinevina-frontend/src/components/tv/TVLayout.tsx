import React from 'react';
import { Outlet } from 'react-router-dom';
import { TVSidebar } from './TVSidebar';
import { useTVNavigation } from '../../hooks/useTVNavigation';

export const TVLayout: React.FC = () => {
  // Initialize global D-pad navigation listener
  useTVNavigation();

  return (
    <div className="flex min-h-screen bg-[#0f0f0f] text-white overflow-hidden tv-overscan-padding select-none">
      <TVSidebar />
      
      {/* Main Content Area - padded to not overlap collapsed sidebar */}
      <main className="ml-20 flex-1 overflow-x-hidden overflow-y-auto relative">
        <Outlet />
      </main>
    </div>
  );
};
