import React, { Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Lazy loading pages for better performance
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Browse = React.lazy(() => import('./pages/Browse').then(module => ({ default: module.Browse })));
const MovieDetail = React.lazy(() => import('./pages/MovieDetail').then(module => ({ default: module.MovieDetail })));
const LiveTV = React.lazy(() => import('./pages/LiveTV').then(module => ({ default: module.LiveTV })));
const Sports = React.lazy(() => import('./pages/Sports').then(module => ({ default: module.Sports })));
const Account = React.lazy(() => import('./pages/Account').then(module => ({ default: module.Account })));
const Player = React.lazy(() => import('./pages/Player').then(module => ({ default: module.Player })));
const Admin = React.lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const Search = React.lazy(() => import('./pages/Search').then(module => ({ default: module.Search })));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#121212] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="browse/:slug" element={<Browse />} />
            <Route path="search" element={<Search />} />
            <Route path="phim/:slug" element={<MovieDetail />} />
            <Route path="live" element={<LiveTV />} />
            <Route path="sports" element={<Sports />} />
            <Route path="account" element={<Account />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          {/* Player is outside Layout to be full screen without Navbar/Footer */}
          <Route path="/play/:slug/:episode?" element={<Player />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
