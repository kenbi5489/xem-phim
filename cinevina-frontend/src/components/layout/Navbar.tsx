import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon, UserCircleIcon, 
  ChevronDownIcon, XMarkIcon,
  HomeIcon, FilmIcon, TvIcon,
  VideoCameraIcon, SparklesIcon,
  GlobeAltIcon, HeartIcon,
  RectangleGroupIcon
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
  { name: 'Trang chủ',  to: '/', icon: HomeIcon },
  { name: 'Phim lẻ',    to: '/browse/phim-le', icon: FilmIcon },
  { name: 'Phim bộ',    to: '/browse/phim-bo', icon: TvIcon },
  { name: 'Chiếu Rạp',  to: '/browse/phim-chieu-rap', badge: 'HOT', icon: SparklesIcon },
  { name: 'Live TV',    to: '/live', icon: VideoCameraIcon },
];

const MOBILE_NAV = [
  { name: 'Trang chủ', to: '/',        Icon: HomeIcon,       IconSolid: HomeSolid },
  { name: 'Phim Lẻ',   to: '/browse/phim-le', Icon: FilmIcon,       IconSolid: FilmSolid },
  { name: 'Phim Bộ',   to: '/browse/phim-bo', Icon: TvIcon,         IconSolid: TvSolid },
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
      <nav className={`fixed top-0 w-full max-w-[1920px] left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 ${
        scrolled
          ? 'bg-[#0c0e14]/95 backdrop-blur-2xl shadow-2xl border-b border-white/5 py-2'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4'
      }`}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between">
          
          {/* Left: Logo + Desktop Menu */}
          <div className="flex items-center gap-10">
            <Link to="/" className="shrink-0 flex items-center gap-2 group focus:outline-none focus-visible:ring-4 focus-visible:ring-primary rounded-lg p-1">
              <FilmSolid className="w-8 h-8 text-purple-600 group-hover:text-purple-500 transition-colors" />
              <span className="font-display font-black text-3xl tracking-tighter text-white group-hover:text-purple-500 transition-colors italic">
                CINE<span className="text-purple-600">VINA</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(link => {
                const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
                return (
                  <Link 
                    key={link.to} 
                    to={link.to}
                    className={`relative px-4 py-2 text-[13px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary rounded-lg ${
                      isActive ? 'text-purple-500' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {link.name}
                    {link.badge && (
                      <span className="bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Explore Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setShowExplore(true)}
                onMouseLeave={() => setShowExplore(false)}
              >
                <button className={`flex items-center gap-1 px-4 py-2 text-[13px] font-bold uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary rounded-lg ${showExplore ? 'text-purple-500' : 'text-white/60'}`}>
                  KHÁM PHÁ
                  <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${showExplore ? 'rotate-180' : ''}`} />
                </button>

                {/* Mega Menu */}
                <div className={`absolute top-full left-0 mt-2 w-[640px] bg-[#0c0e14]/98 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_40px_100px_-15px_rgba(0,0,0,0.8)] p-8 transition-all duration-500 origin-top-left ${
                  showExplore ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}>
                  <div className="grid grid-cols-2 gap-10">
                    {/* Genres Column */}
                    <div>
                      <h3 className="text-[11px] font-black text-purple-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                        <RectangleGroupIcon className="w-4 h-4" /> THỂ LOẠI
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {GENRES.map(g => (
                          <Link key={g.slug} to={`/browse/${g.slug}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-600/10 text-[13px] text-white/60 hover:text-purple-400 transition-all font-bold">
                            <span className="text-base group-hover:scale-125 transition-transform">{g.emoji}</span>
                            <span>{g.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    {/* Countries Column */}
                    <div>
                      <h3 className="text-[11px] font-black text-purple-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-white/5 pb-2">
                        <GlobeAltIcon className="w-4 h-4" /> QUỐC GIA
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {COUNTRIES.map(c => (
                          <Link key={c.slug} to={`/browse/${c.slug}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-600/10 text-[13px] text-white/60 hover:text-purple-400 transition-all font-bold">
                            <span className="text-base group-hover:scale-125 transition-transform">{c.emoji}</span>
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

          {/* Right: Search + Account */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className={`relative flex items-center transition-all duration-300 ${showSearch ? 'w-64' : 'w-10'}`}>
              {showSearch ? (
                <form onSubmit={handleSearch} className="w-full">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm phim..."
                    className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-purple-500 transition-all shadow-inner"
                  />
                  <button type="button" onClick={() => setShowSearch(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button onClick={() => setShowSearch(true)} className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all">
                  <MagnifyingGlassIcon className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Account */}
            <Link to="/account" className="hidden md:flex items-center gap-3 pl-3 border-l border-white/10 group">
              <div className="text-right">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest group-hover:text-purple-500 transition-colors">Thành viên</p>
                <p className="text-sm font-black text-white">XEM PHIM</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center border-2 border-white/10 shadow-lg group-hover:scale-110 transition-transform">
                <UserSolid className="w-6 h-6 text-white" />
              </div>
            </Link>

            {/* Favorite button for mobile/desktop shortcut */}
            <Link to="/account" className="p-2 text-white/70 hover:text-red-500 transition-colors md:hidden">
              <HeartIcon className="w-6 h-6" />
            </Link>
          </div>

        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden bg-[#0c0e14]/95 backdrop-blur-2xl border-t border-white/5 px-2 py-1">
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
