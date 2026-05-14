import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon, UserCircleIcon,
  XMarkIcon,
  HomeIcon, FilmIcon, TvIcon,
  PlayCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  FilmIcon as FilmSolid,
  TvIcon as TvSolid,
  UserCircleIcon as UserSolid
} from '@heroicons/react/24/solid';

const NAV_LINKS = [
  { name: 'Trang chủ',      to: '/' },
  { name: 'Phim lẻ',        to: '/browse/phim-le' },
  { name: 'Phim bộ',        to: '/browse/phim-bo' },
  { name: 'Chiếu rạp',      to: '/browse/phim-chieu-rap' },
  { name: 'Thể thao',       to: '/sports', isSport: true },
  { name: 'Live TV',        to: '/live', isLive: true },
];

const MOBILE_NAV = [
  { name: 'Trang chủ', to: '/',              Icon: HomeIcon,       IconSolid: HomeSolid },
  { name: 'Phim Lẻ',   to: '/browse/phim-le', Icon: FilmIcon,       IconSolid: FilmSolid },
  { name: 'Phim Bộ',   to: '/browse/phim-bo', Icon: TvIcon,         IconSolid: TvSolid },
  { name: 'Live TV',   to: '/live',           Icon: TvIcon,         IconSolid: TvSolid },
  { name: 'Tài khoản', to: '/account',        Icon: UserCircleIcon, IconSolid: UserSolid },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled]         = useState(false);
  const [showSearch, setShowSearch]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const location  = useLocation();
  const navigate  = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setShowSearch(false);
    setSearchQuery('');
  }, [location.pathname]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 pt-[env(safe-area-inset-top)] max-w-[100vw] ${
        scrolled
          ? 'bg-[#0c0e14]/95 backdrop-blur-2xl shadow-2xl border-b border-white/5 py-2'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4'
      }`}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between relative">
          
          {/* Left: Logo + Search + Desktop Menu */}
          <div className="flex items-center gap-6 xl:gap-8 w-full">
            {/* Logo */}
            <Link to="/" className="shrink-0 flex items-center gap-2 group focus:outline-none focus-visible:ring-4 focus-visible:ring-primary rounded-lg p-1">
              <PlayCircleIcon className="w-9 h-9 text-[#00E559] fill-[#00E559]/20" />
              <div className="flex flex-col">
                <span className="font-display font-black text-xl tracking-tight text-white group-hover:text-gray-200 transition-colors leading-none">
                  ĐứcCine
                </span>
                <span className="text-[8px] text-white/50 tracking-widest font-medium">Kênh siêu giải trí</span>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden lg:flex relative items-center w-[240px] xl:w-[280px]">
              <MagnifyingGlassIcon className="absolute left-3 w-4 h-4 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm phim"
                className="w-full bg-[#3a3a3a]/80 hover:bg-[#4a4a4a] border border-transparent rounded-lg py-1.5 pl-9 pr-8 text-[13px] text-white placeholder:text-white/50 focus:outline-none focus:bg-[#4a4a4a] transition-all"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 text-white/50 hover:text-white">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Desktop Menu */}
            <div className="hidden lg:flex flex-1 items-center gap-0 xl:gap-2 ml-4 relative z-[100]">
              <div className="flex items-center gap-1 xl:gap-2">
                {NAV_LINKS.map(link => {
                  const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
                  
                  if (link.isLive) {
                    const colorClasses = isActive ? 'bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,0.45)]' : 'bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/30';
                    return (
                      <Link
                        key={link.name}
                        to={link.to}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] xl:text-[13px] font-bold whitespace-nowrap transition-all focus:outline-none ${colorClasses}`}
                      >
                        <TvIcon className="w-3.5 h-3.5 shrink-0" />
                        {link.name}
                        <span className="flex items-center gap-0.5 bg-red-600/80 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> LIVE
                        </span>
                      </Link>
                    );
                  }

                  if (link.isSport) {
                    const colorClasses = isActive ? 'bg-[#ff922b] text-white shadow-[0_0_16px_rgba(255,146,43,0.45)]' : 'bg-[#ff922b]/15 text-[#ff922b] border border-[#ff922b]/30 hover:bg-[#ff922b]/30';
                    return (
                      <Link
                        key={link.name}
                        to={link.to}
                        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] xl:text-[13px] font-bold whitespace-nowrap transition-all focus:outline-none ${colorClasses}`}
                      >
                        <TrophyIcon className="w-3.5 h-3.5 shrink-0" />
                        {link.name}
                      </Link>
                    );
                  }

                  return (
                    <Link 
                      key={link.name} 
                      to={link.to}
                      className={`relative px-3 py-1.5 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 focus:outline-none rounded-lg ${
                        isActive ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 xl:gap-4 shrink-0">
            {/* Mobile Search Toggle */}
            <button onClick={() => setShowSearch(!showSearch)} className="lg:hidden p-2 text-white/70">
              <MagnifyingGlassIcon className="w-6 h-6" />
            </button>

            {/* Account Button */}
            <Link to="/account" className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-full font-bold text-[13px] transition-colors">
              <UserCircleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Thành viên</span>
            </Link>
          </div>

          {/* Mobile Search Overlay */}
          <div className={`absolute inset-x-0 bottom-0 top-[env(safe-area-inset-top)] bg-[#0c0e14] lg:hidden z-[70] transition-all duration-300 flex items-center px-4 ${showSearch ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
            <form onSubmit={handleSearch} className="w-full relative flex items-center">
              <MagnifyingGlassIcon className="absolute left-3 w-5 h-5 text-white/50 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm phim..."
                className="w-full bg-[#3a3a3a]/80 hover:bg-[#4a4a4a] border border-transparent rounded-lg py-2 pl-10 pr-10 text-[14px] text-white placeholder:text-white/50 focus:outline-none focus:bg-[#4a4a4a] transition-all"
              />
              <button 
                type="button" 
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }} 
                className="absolute right-3 p-1 text-white/50 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden bg-[#0c0e14]/95 backdrop-blur-2xl border-t border-white/5 px-2 pt-1 pb-[env(safe-area-inset-bottom)] max-w-[100vw] overflow-hidden">
        <div className="flex items-center justify-around">
          {MOBILE_NAV.map(item => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            const Icon = isActive ? item.IconSolid : item.Icon;
            return (
              <Link key={item.name} to={item.to} className="flex flex-col items-center gap-1 p-2 min-w-[70px]">
                <Icon className={`w-5 h-5 transition-all ${isActive ? 'text-primary scale-110' : 'text-white/40'}`} />
                <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'text-primary' : 'text-white/30'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
