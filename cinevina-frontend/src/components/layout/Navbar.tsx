import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon, UserCircleIcon, 
  ChevronDownIcon, ArrowDownTrayIcon, XMarkIcon,
  HomeIcon, FilmIcon, TvIcon, TrophyIcon,
  GlobeAltIcon,
  RectangleGroupIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  FilmIcon as FilmSolid,
  TvIcon as TvSolid,
  UserCircleIcon as UserSolid
} from '@heroicons/react/24/solid';

const GENRES = [
  { name: 'Hành động', slug: 'hanh-dong', emoji: '⚔️' },
  { name: 'Tình cảm',  slug: 'tinh-cam',  emoji: '💕' },
  { name: 'Kinh dị',   slug: 'kinh-di',   emoji: '👻' },
  { name: 'Hài hước',  slug: 'hai-huoc',  emoji: '😂' },
  { name: 'Cổ trang',  slug: 'co-trang',  emoji: '👘' },
  { name: 'Hoạt hình', slug: 'hoat-hinh', emoji: '🎨' },
  { name: 'Viễn tưởng',slug: 'vien-tuong',emoji: '🚀' },
  { name: 'Võ thuật',  slug: 'vo-thuat',  emoji: '🥋' },
  { name: 'Hình sự',   slug: 'hinh-su',   emoji: '🚓' },
  { name: 'Tâm lý',    slug: 'tam-ly',    emoji: '🧠' },
];

const COUNTRIES = [
  { name: 'Trung Quốc', slug: 'trung-quoc', emoji: '🇨🇳' },
  { name: 'Hàn Quốc', slug: 'han-quoc', emoji: '🇰🇷' },
  { name: 'Nhật Bản', slug: 'nhat-ban', emoji: '🇯🇵' },
  { name: 'Thái Lan', slug: 'thai-lan', emoji: '🇹🇭' },
  { name: 'Âu Mỹ', slug: 'au-my', emoji: '🇺🇸' },
  { name: 'Việt Nam', slug: 'viet-nam', emoji: '🇻🇳' },
  { name: 'Ấn Độ', slug: 'an-do', emoji: '🇮🇳' },
  { name: 'Hồng Kông', slug: 'hong-kong', emoji: '🇭🇰' },
];

const NAV_LINKS = [
  { name: 'Trang chủ',      to: '/' },
  { name: 'Thể loại',       to: '#', isDropdown: true },
  { name: 'Quốc gia',       to: '#', isDropdown: true },
  { name: 'Phim mới',       to: '/browse/phim-moi-cap-nhat' },
  { name: 'Phim bộ',        to: '/browse/phim-bo' },
  { name: 'Phim lẻ',        to: '/browse/phim-le' },
  { name: 'Phim chiếu rạp', to: '/browse/phim-chieu-rap' },
  { name: 'Truyền hình',    to: '/live' },
];

const MOBILE_NAV = [
  { name: 'Trang chủ', to: '/',        Icon: HomeIcon,       IconSolid: HomeSolid },
  { name: 'Phim Lẻ',   to: '/browse/phim-le', Icon: FilmIcon,       IconSolid: FilmSolid },
  { name: 'Phim Bộ',   to: '/browse/phim-bo', Icon: TvIcon,         IconSolid: TvSolid },
  { name: 'Thể Thao',  to: '/sports',         Icon: TrophyIcon,     IconSolid: TrophyIcon },
  { name: 'Tài khoản', to: '/account', Icon: UserCircleIcon, IconSolid: UserSolid },
];

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled]         = useState(false);
  const [showExplore, setShowExplore]   = useState(false);
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
    setShowExplore(false);
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
      <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 pt-[env(safe-area-inset-top)] max-w-[100vw] overflow-x-hidden ${
        scrolled
          ? 'bg-[#0c0e14]/95 backdrop-blur-2xl shadow-2xl border-b border-white/5 py-2'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4'
      }`}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between">
          
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
            <div className="hidden lg:flex flex-1 items-center gap-0 xl:gap-2 overflow-x-auto no-scrollbar ml-4">
              {/* Explore Dropdown & Links wrapper */}
              <div 
                className="relative flex items-center w-full"
                onMouseEnter={() => setShowExplore(true)}
                onMouseLeave={() => setShowExplore(false)}
              >
                <div className="flex items-center gap-2 xl:gap-3">
                  {NAV_LINKS.map(link => {
                    const isActive = link.to === '/' ? location.pathname === '/' : (link.to !== '#' && location.pathname.startsWith(link.to));
                    return (
                      <Link 
                        key={link.name} 
                        to={link.to}
                        className={`relative px-1.5 py-1.5 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all flex items-center gap-1 focus:outline-none rounded-lg ${
                          isActive ? 'text-white' : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {link.name}
                        {link.isDropdown && <ChevronDownIcon className="w-3 h-3 text-white/50" />}
                      </Link>
                    );
                  })}
                </div>

                {/* Mega Menu */}
                <div className={`absolute top-full left-0 mt-2 w-[640px] bg-[#1a1c23]/98 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_40px_100px_-15px_rgba(0,0,0,0.8)] p-8 transition-all duration-300 origin-top-left ${
                  showExplore ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}>
                  <div className="grid grid-cols-2 gap-10">
                    {/* Genres Column */}
                    <div>
                      <h3 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                        <RectangleGroupIcon className="w-4 h-4" /> THỂ LOẠI
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {GENRES.map(g => (
                          <Link key={g.slug} to={`/browse/${g.slug}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-[13px] text-white/70 hover:text-white transition-all">
                            <span>{g.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    {/* Countries Column */}
                    <div>
                      <h3 className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                        <GlobeAltIcon className="w-4 h-4" /> QUỐC GIA
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {COUNTRIES.map(c => (
                          <Link key={c.slug} to={`/browse/${c.slug}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-[13px] text-white/70 hover:text-white transition-all">
                            <span>{c.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 xl:gap-4 shrink-0">
            {/* Mobile Search Toggle */}
            <button onClick={() => setShowSearch(!showSearch)} className="lg:hidden p-2 text-white/70">
              <MagnifyingGlassIcon className="w-6 h-6" />
            </button>

            {/* App Download (Yellow Circle) */}
            <div className="hidden md:flex w-8 h-8 rounded-full bg-[#f9d854] items-center justify-center cursor-pointer hover:bg-yellow-400 transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4 text-black font-bold" />
            </div>

            {/* Account Button */}
            <Link to="/account" className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-full font-bold text-[13px] transition-colors">
              <UserCircleIcon className="w-5 h-5" />
              Thành viên
            </Link>
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
                <Icon className={`w-6 h-6 transition-all ${isActive ? 'text-purple-500 scale-110' : 'text-white/40'}`} />
                <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-purple-500' : 'text-white/30'}`}>
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
