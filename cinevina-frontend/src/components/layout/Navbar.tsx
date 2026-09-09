import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon, UserCircleIcon,
  XMarkIcon, Bars3Icon,
  HomeIcon, FilmIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  FilmIcon as FilmSolid,
  UserCircleIcon as UserSolid
} from '@heroicons/react/24/solid';


const NAV_LINKS = [
  { name: 'Trang chủ', to: '/' },
  { name: 'Phim lẻ', to: '/browse/phim-le' },
  { name: 'Phim bộ', to: '/browse/phim-bo' },
  { name: 'Chiếu rạp', to: '/browse/phim-chieu-rap' },
];

const MOBILE_NAV = [
  { name: 'Trang chủ', to: '/', Icon: HomeIcon, IconSolid: HomeSolid },
  { name: 'Phim lẻ', to: '/browse/phim-le', Icon: FilmIcon, IconSolid: FilmSolid },
  { name: 'Phim bộ', to: '/browse/phim-bo', Icon: FilmIcon, IconSolid: FilmSolid },
  { name: 'Tìm kiếm', to: '/search', Icon: MagnifyingGlassIcon, IconSolid: MagnifyingGlassIcon },
  { name: 'Tài khoản', to: '/account', Icon: UserCircleIcon, IconSolid: UserSolid },
];

export const Navbar: React.FC = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  const placeholders = ['Tìm tên phim, diễn viên...', 'Tìm phim chiếu rạp mới...', 'Tìm phim bộ Hàn, Trung...', 'Tìm kiếm Anime...'];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const popularSearches = ['Nữ Hoàng Nước Mắt', 'Gia Đình Mình Vui Bất Thình Lình', 'Mai', 'Lật Mặt 7', 'Dune'];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setShowSearch(false);
    setIsMobileMenuOpen(false);
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
      setIsMobileMenuOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-[rgba(7,10,18,0.85)] backdrop-blur-[20px] border-b border-[var(--color-border-subtle)] h-[56px] pt-[env(safe-area-inset-top)] flex items-center transition-colors">
        <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center justify-between">
          
          {/* Mobile: Hamburger & Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-1.5 text-[var(--color-text-1)] rounded-lg hover:bg-white/5 active:scale-95 transition-all"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20">
                <PlayCircleIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-[20px] tracking-wider font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                CINE<span className="text-[var(--color-primary)]">VINA</span>
              </span>
            </Link>
          </div>

          {/* Desktop: Logo & Center Links */}
          <div className="hidden lg:flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform duration-300">
                <PlayCircleIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-[24px] tracking-wider font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                CINE<span className="text-[var(--color-primary)]">VINA</span>
              </span>
            </Link>
            
            <div className="flex items-center gap-7">
              {NAV_LINKS.map(link => {
                const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
                return (
                  <Link 
                    key={link.name} 
                    to={link.to}
                    className={`text-[14px] font-semibold transition-colors duration-200 ${
                      isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-2)] hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right: Search, Account */}
          <div className="flex items-center gap-3 lg:gap-5 shrink-0">
            {/* Desktop Search */}
            <div className="hidden lg:block relative">
              <form onSubmit={handleSearch} className={`relative flex items-center transition-all duration-300 ${showSearch ? 'w-[300px]' : 'w-10'}`}>
                {showSearch ? (
                  <>
                    <MagnifyingGlassIcon className="absolute left-3.5 w-4 h-4 text-[var(--color-text-3)] pointer-events-none" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                      placeholder={placeholders[placeholderIdx]}
                      className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-full py-2 pl-10 pr-9 text-[13px] text-[var(--color-text-1)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all"
                    />
                    <button type="button" onClick={() => setShowSearch(false)} className="absolute right-3 p-0.5 text-[var(--color-text-3)] hover:text-white transition-colors">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                    {/* Search Suggestions */}
                    {isSearchFocused && !searchQuery && (
                      <div className="absolute top-full mt-2 right-0 w-[300px] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-4 py-1.5 text-[11px] font-semibold text-[var(--color-text-3)] uppercase tracking-wider">Từ khóa hot</div>
                        {popularSearches.map((term, i) => (
                          <button 
                            key={i} 
                            type="button"
                            onClick={() => { setSearchQuery(term); navigate(`/search?q=${encodeURIComponent(term)}`); setShowSearch(false); }}
                            className="w-full text-left px-4 py-2 text-[13px] text-[var(--color-text-2)] hover:text-white hover:bg-[var(--color-surface-elevated)] flex items-center gap-2.5 transition-colors"
                          >
                            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-[var(--color-text-3)]" /> {term}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setShowSearch(true)} 
                    className="p-2 text-[var(--color-text-2)] hover:text-white rounded-full hover:bg-white/5 active:scale-95 transition-all"
                    aria-label="Tìm kiếm"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </button>
                )}
              </form>
            </div>

            {/* Mobile Search Quick Link */}
            <Link 
              to="/search" 
              className="lg:hidden p-2 text-[var(--color-text-2)] hover:text-white active:scale-95 transition-all"
              aria-label="Tìm kiếm"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </Link>

            {/* Account Button */}
            <Link 
              to="/account" 
              className="flex items-center gap-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-1)] px-3.5 py-1.5 rounded-full font-medium text-[13px] active:scale-95 transition-all"
            >
              <UserCircleIcon className="w-5 h-5 text-[var(--color-primary)]" />
              <span className="hidden sm:inline font-semibold">Tài khoản</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-down Menu */}
      <div className={`fixed inset-0 top-[56px] bg-[rgba(7,10,18,0.98)] backdrop-blur-2xl z-[55] transition-all duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col p-6 gap-3">
          {NAV_LINKS.map(link => {
            const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
            return (
              <Link 
                key={link.name} 
                to={link.to} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-[17px] font-semibold py-3 px-4 rounded-xl border border-transparent transition-all ${
                  isActive ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20' : 'text-[var(--color-text-1)] hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Navigation (Streamlined 5 Tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden bg-[rgba(7,10,18,0.92)] backdrop-blur-2xl border-t border-[var(--color-border-subtle)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-[56px] px-1">
          {MOBILE_NAV.map(item => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            const Icon = isActive ? item.IconSolid : item.Icon;
            return (
              <Link 
                key={item.name} 
                to={item.to} 
                className="flex flex-col items-center justify-center flex-1 h-full py-1 active:scale-90 transition-transform"
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-3)]'}`} />
                <span className={`text-[10px] mt-1 font-semibold transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-3)]'}`}>
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
