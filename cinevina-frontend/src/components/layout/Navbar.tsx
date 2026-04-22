import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon, UserCircleIcon, HeartIcon,
  HomeIcon, GlobeAltIcon, SignalIcon,
  ChevronDownIcon, XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid, GlobeAltIcon as GlobeSolid,
  SignalIcon as SignalSolid, HeartIcon as HeartSolid,
  UserCircleIcon as UserSolid,
} from '@heroicons/react/24/solid';

const GENRE_DROPDOWN = [
  { name: 'Hành động', slug: 'hanh-dong', emoji: '⚔️' },
  { name: 'Tình cảm',  slug: 'tinh-cam',  emoji: '💕' },
  { name: 'Kinh dị',   slug: 'kinh-di',   emoji: '👻' },
  { name: 'Hài hước',  slug: 'hai-huoc',  emoji: '😂' },
  { name: 'Tâm lý',    slug: 'tam-ly',    emoji: '🧠' },
  { name: 'Hoạt hình', slug: 'hoat-hinh', emoji: '🎨' },
  { name: 'Tài liệu',  slug: 'tai-lieu',  emoji: '📽️' },
  { name: 'Lịch sử',   slug: 'lich-su',   emoji: '🏛️' },
  { name: 'Cổ trang',  slug: 'co-trang',  emoji: '👘' },
  { name: 'Viễn tưởng',slug: 'vien-tuong',emoji: '🚀' },
];

const NAV_LINKS = [
  { name: 'Trang chủ',  to: '/' },
  { name: 'Chiếu Rạp',  to: '/browse/phim-chieu-rap', badge: '🎬' },
  { name: 'Phim lẻ',    to: '/browse/phim-le' },
  { name: 'Phim bộ',    to: '/browse/phim-bo' },
  { name: 'TV Show',    to: '/browse/tv-shows' },
  { name: 'Anime',      to: '/browse/hoat-hinh', badge: '12' },
  { name: 'Thể thao',   to: '/browse/the-thao' },
  { name: 'Live TV',    to: '/live' },
  { name: 'Phim Việt',  to: '/browse/phim-viet' },
];

const MOBILE_NAV = [
  { name: 'Trang chủ', to: '/',        Icon: HomeIcon,       IconSolid: HomeSolid },
  { name: 'Khám phá',  to: '/browse/phim-le', Icon: GlobeAltIcon, IconSolid: GlobeSolid },
  { name: 'Live',       to: '/live',    Icon: SignalIcon,     IconSolid: SignalSolid },
  { name: 'Yêu thích', to: '/account', Icon: HeartIcon,      IconSolid: HeartSolid },
  { name: 'Tài khoản', to: '/account', Icon: UserCircleIcon, IconSolid: UserSolid },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled]         = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const location  = useLocation();
  const navigate  = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setShowDropdown(false);
    setShowSearch(false);
    setSearchQuery('');
  }, [location.pathname]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  // ── Search submit → redirect to /search?q=… ──────────────────────────────
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
      {/* ── Desktop Navbar ──────────────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0c0e14]/95 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-white/5'
          : 'bg-gradient-to-b from-[#0c0e14]/80 to-transparent'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="shrink-0">
            <span className="font-display font-black text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#d692ff] to-[#af25fe]"
              style={{ filter: 'drop-shadow(0 0 12px rgba(214,146,255,0.55))' }}>
              CINEVINA
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(link => {
              const isActive = link.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.to);
              return (
                <Link key={link.to + link.name} to={link.to}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                    isActive ? 'text-[#d692ff]' : 'text-white/65 hover:text-white hover:bg-white/5'
                  }`}>
                  {link.name}
                  {link.badge && (
                    <span className="bg-[#fe7e4f] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#d692ff]" />
                  )}
                </Link>
              );
            })}

            {/* Khám phá mega dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/65 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                Khám phá
                <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[560px] bg-[#11131a]/98 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.65)] grid grid-cols-5 gap-2"
                >
                  <div className="col-span-5 text-xs font-bold text-white/40 uppercase tracking-widest mb-2 px-1">Thể loại</div>
                  {GENRE_DROPDOWN.map(g => (
                    <Link key={g.slug} to={`/browse/${g.slug}`}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/8 transition-all group">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform">
                        <span className="text-xl">{g.emoji}</span>
                      </div>
                      <span className="text-xs font-semibold text-white/75 text-center leading-tight group-hover:text-white transition-colors">
                        {g.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search bar */}
            {showSearch ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="flex items-center bg-white/10 border border-white/20 rounded-full px-4 py-2 gap-2 w-72 animate-in fade-in slide-in-from-right-4 duration-200">
                  <MagnifyingGlassIcon className="w-4 h-4 text-white/40 shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm phim, diễn viên..."
                    className="bg-transparent text-sm text-white placeholder-white/35 outline-none w-full"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="shrink-0">
                      <XMarkIcon className="w-4 h-4 text-white/40 hover:text-white" />
                    </button>
                  )}
                  {/* Press Enter hint */}
                  {searchQuery.length >= 2 && (
                    <kbd className="shrink-0 text-[9px] text-white/30 border border-white/20 rounded px-1 py-0.5">↵</kbd>
                  )}
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-full text-white/65 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Tìm kiếm"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>
            )}

            {/* Account button */}
            <Link
              to="/account"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-[#d692ff]/20 to-[#af25fe]/20 border border-[#d692ff]/25 hover:from-[#d692ff]/30 hover:to-[#af25fe]/30 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d692ff] to-[#af25fe] flex items-center justify-center text-xs font-black text-white">
                U
              </div>
              <span className="text-sm font-medium text-white/85 hidden lg:block">Tài khoản</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Nav ───────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0c0e14]/96 backdrop-blur-2xl border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_NAV.map(item => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname === item.to;
            const Icon = isActive ? item.IconSolid : item.Icon;
            return (
              <Link key={item.name} to={item.to} className="flex flex-col items-center gap-1 py-1 px-3">
                <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#d692ff]/15' : ''}`}>
                  <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-[#d692ff]' : 'text-white/45'}`} />
                  {item.name === 'Live' && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-[#d692ff]' : 'text-white/35'}`}>
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
