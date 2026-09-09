import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { useDeviceDetect } from './hooks/useDeviceDetect';

// Lazy loading pages for better performance
const Home = React.lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Browse = React.lazy(() => import('./pages/Browse').then(module => ({ default: module.Browse })));
const MovieDetail = React.lazy(() => import('./pages/MovieDetail').then(module => ({ default: module.MovieDetail })));
const Account = React.lazy(() => import('./pages/Account').then(module => ({ default: module.Account })));
const Player = React.lazy(() => import('./pages/Player').then(module => ({ default: module.Player })));
const Admin = React.lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const Search = React.lazy(() => import('./pages/Search').then(module => ({ default: module.Search })));

const TVLayout = React.lazy(() => import('./components/tv/TVLayout').then(module => ({ default: module.TVLayout })));
const TVHome = React.lazy(() => import('./pages/tv/TVHome').then(module => ({ default: module.TVHome })));
const TVSearch = React.lazy(() => import('./pages/tv/TVSearch').then(module => ({ default: module.TVSearch })));
const TVGenres = React.lazy(() => import('./pages/tv/TVGenres').then(module => ({ default: module.TVGenres })));
const TVGenreDetail = React.lazy(() => import('./pages/tv/TVGenreDetail').then(module => ({ default: module.TVGenreDetail })));
const TVCountries = React.lazy(() => import('./pages/tv/TVCountries').then(module => ({ default: module.TVCountries })));
const TVCountryDetail = React.lazy(() => import('./pages/tv/TVCountryDetail').then(module => ({ default: module.TVCountryDetail })));
const TVCategory = React.lazy(() => import('./pages/tv/TVCategory').then(module => ({ default: module.TVCategory })));
const TVFavorites = React.lazy(() => import('./pages/tv/TVFavorites').then(module => ({ default: module.TVFavorites })));
const TVSettings = React.lazy(() => import('./pages/tv/TVSettings').then(module => ({ default: module.TVSettings })));
const TVMovieDetail = React.lazy(() => import('./pages/tv/TVMovieDetail').then(module => ({ default: module.TVMovieDetail })));
const TVPlayer = React.lazy(() => import('./pages/tv/TVPlayer').then(module => ({ default: module.TVPlayer })));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full h-full animate-in fade-in duration-200">
    {children}
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Layout />}>
        <Route index element={<PageTransition><Home /></PageTransition>} />
        <Route path="browse/:slug" element={<PageTransition><Browse /></PageTransition>} />
        <Route path="search" element={<PageTransition><Search /></PageTransition>} />
        <Route path="phim/:slug" element={<PageTransition><MovieDetail /></PageTransition>} />
        <Route path="account" element={<PageTransition><Account /></PageTransition>} />
        <Route path="admin" element={<PageTransition><Admin /></PageTransition>} />
      </Route>
      {/* Player is outside Layout to be full screen without Navbar/Footer */}
      <Route path="/play/:slug/:episode?" element={<PageTransition><Player /></PageTransition>} />

        {/* TV Routes */}
        <Route path="/tv" element={<TVLayout />}>
          <Route index element={<TVHome />} />
          <Route path="search" element={<TVSearch />} />
          <Route path="genres" element={<TVGenres />} />
          <Route path="genres/:slug" element={<TVGenreDetail />} />
          <Route path="countries" element={<TVCountries />} />
          <Route path="countries/:slug" element={<TVCountryDetail />} />
          <Route path="movies" element={<TVCategory />} />
          <Route path="series" element={<TVCategory />} />
          <Route path="favorites" element={<TVFavorites />} />
          <Route path="settings" element={<TVSettings />} />
          <Route path="phim/:slug" element={<TVMovieDetail />} />
        </Route>
        <Route path="/tv/play/:slug/:episode?" element={<TVPlayer />} />
      </Routes>
    );
  };

function AppRedirect() {
  const { isTV } = useDeviceDetect();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isTV && !location.pathname.startsWith('/tv')) {
      navigate('/tv', { replace: true });
    }
  }, [isTV, location, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AppRedirect />
      <Suspense fallback={<LoadingFallback />}>
        <AnimatedRoutes />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
