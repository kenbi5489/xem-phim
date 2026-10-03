import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  HomeIcon,
  SunIcon,
  MoonIcon,
  Squares2X2Icon,
  HeartIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import {
  PlayCircleIcon,
  HomeIcon as HomeSolid,
  Squares2X2Icon as Squares2X2Solid,
  HeartIcon as HeartSolid,
  StarIcon,
} from '@heroicons/react/24/solid';
import { useSearchMovies, useDebounce } from '../../hooks/useMovies';
import { useThemeStore } from '../../store/useThemeStore';

const NAV_LINKS = [
  { name: 'Trang Chủ', to: '/' },
  { name: 'Phim Lẻ', to: '/browse/phim-le' },
  { name: 'Phim Bộ', to: '/browse/phim-bo' },
  { name: 'Chiếu Rạp', to: '/browse/phim-chieu-rap' },
  { name: 'Hoạt Hình', to: '/browse/hoat-hinh' },
];

const CURATED_NAV_GENRES = [
  { slug: 'hanh-dong', name: 'Hành động' },
  { slug: 'tinh-cam', name: 'Tình cảm' },
  { slug: 'hai-huoc', name: 'Hài hước' },
  { slug: 'co-trang', name: 'Cổ trang' },
  { slug: 'tam-ly', name: 'Tâm lý' },
  { slug: 'hinh-su', name: 'Hình sự' },
  { slug: 'chien-tranh', name: 'Chiến tranh' },
  { slug: 'vo-thuat', name: 'Võ thuật' },
  { slug: 'vien-tuong', name: 'Viễn tưởng' },
  { slug: 'phieu-luu', name: 'Phiêu lưu' },
  { slug: 'khoa-hoc', name: 'Khoa học' },
  { slug: 'kinh-di', name: 'Kinh dị' },
  { slug: 'am-nhac', name: 'Âm nhạc' },
  { slug: 'than-thoai', name: 'Thần thoại' },
  { slug: 'gia-dinh', name: 'Gia đình' },
  { slug: 'hoat-hinh', name: 'Hoạt hình' },
];

export const Navbar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGenreMenuOpen, setIsGenreMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const genreMenuRef = useRef<HTMLDivElement>(null);
  const genreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpenedTimeRef = useRef<number>(0);

  const { theme, toggleTheme } = useThemeStore();

  const debouncedKeyword = useDebounce(searchQuery, 350);
  const { data: searchResults, isLoading: isSearching } = useSearchMovies(debouncedKeyword);

  const placeholders = [
    'Tìm phim mới, diễn viên...',
    'Tìm phim chiếu rạp Vietsub...',
    'Tìm phim bộ Hàn, Trung thuyết minh...',
    'Tìm Anime, hoạt hình HD...',
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Close menus on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsGenreMenuOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Click outside search container & genre menu to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (genreMenuRef.current && !genreMenuRef.current.contains(e.target as Node)) {
        setIsGenreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenreMouseEnter = () => {
    if (genreTimeoutRef.current) {
      clearTimeout(genreTimeoutRef.current);
      genreTimeoutRef.current = null;
    }
    hoverOpenedTimeRef.current = Date.now();
    setIsGenreMenuOpen(true);
  };

  const handleGenreMouseLeave = () => {
    genreTimeoutRef.current = setTimeout(() => {
      setIsGenreMenuOpen(false);
    }, 200);
  };

  const handleGenreButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (genreTimeoutRef.current) {
      clearTimeout(genreTimeoutRef.current);
      genreTimeoutRef.current = null;
    }
    const timeSinceHover = Date.now() - hoverOpenedTimeRef.current;
    // If hover just opened it in the last 400ms, user clicked to interact, so keep it open
    if (isGenreMenuOpen && timeSinceHover < 400) {
      return;
    }
    setIsGenreMenuOpen((v) => !v);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSelectMovie = (slug: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/phim/${slug}`);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 h-[64px] flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          
          {/* Left: Mobile hamburger & Brand */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 xl:gap-5 shrink-0 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 sm:p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden transition-colors shrink-0"
              aria-label="Mở menu"
            >
              {isMobileMenuOpen ? <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300 shrink-0">
                <PlayCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-[18px] sm:text-[20px] xl:text-[21px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                  CINE<span className="text-indigo-600 dark:text-indigo-400">VINA</span>
                </span>
                <span className="hidden xl:block text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wider">
                  Nguồn C + KKPhim
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 ml-1 xl:ml-3 shrink-0">
              {NAV_LINKS.map(link => {
                const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.name}
                    to={link.to}
                    className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-[13px] xl:text-[14px] font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* Curated Genres Dropdown */}
              <div
                ref={genreMenuRef}
                className="relative shrink-0"
                onMouseEnter={handleGenreMouseEnter}
                onMouseLeave={handleGenreMouseLeave}
              >
                <button
                  type="button"
                  onClick={handleGenreButtonClick}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3.5 py-1.5 rounded-full text-[13px] xl:text-[14px] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isGenreMenuOpen || location.pathname.includes('/the-loai') || location.pathname.includes('/browse')
                      ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span>Thể Loại</span>
                  <ChevronDownIcon className={`w-3.5 h-3.5 mt-0.5 transition-transform duration-200 ${isGenreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isGenreMenuOpen && (
                  <div className="absolute top-full left-0 pt-2 w-[360px] z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xl grid grid-cols-2 gap-1.5">
                      {CURATED_NAV_GENRES.map(g => (
                        <Link
                          key={g.slug}
                          to={`/browse/${g.slug}`}
                          onClick={() => setIsGenreMenuOpen(false)}
                          className="px-3 py-2 rounded-xl text-[13px] font-bold text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {g.name}
                        </Link>
                      ))}
                      <div className="col-span-2 pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 text-center">
                        <Link
                          to="/browse/hanh-dong"
                          onClick={() => setIsGenreMenuOpen(false)}
                          className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Xem tất cả thể loại & bộ lọc →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Center/Right: Smart Instant Search & Tools */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
            
            {/* Search Bar Container */}
            <div ref={searchContainerRef} className="relative flex-1 sm:flex-none sm:w-[220px] lg:w-[190px] xl:w-[260px] 2xl:w-[320px] max-w-[260px] sm:max-w-none min-w-0 shrink-0">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!isSearchOpen) setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder={placeholders[placeholderIdx]}
                  className="w-full h-9 sm:h-10 pl-8 sm:pl-9 pr-7 sm:pr-9 text-[12px] sm:text-[13px] bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-full border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all truncate"
                />
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-2.5 sm:left-3 top-2.5 sm:top-3 pointer-events-none" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 sm:right-3 top-2 sm:top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Instant Search Popup Dropdown */}
              {isSearchOpen && searchQuery.trim().length >= 2 && (
                <div className="fixed top-[60px] left-3 right-3 sm:absolute sm:top-12 sm:right-0 sm:left-auto sm:w-[320px] md:w-[340px] max-h-[70vh] sm:max-h-[420px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 scrollbar-thin">
                  <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                    <span>GỢI Ý TÌM KIẾM</span>
                    {isSearching && <span>Đang tra cứu...</span>}
                  </div>

                  {isSearching && (
                    <div className="py-6 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {!isSearching && searchResults && searchResults.length === 0 && (
                    <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                      Không tìm thấy phim phù hợp
                    </div>
                  )}

                  {!isSearching && searchResults && searchResults.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                      {searchResults.slice(0, 6).map((movie) => (
                        <div
                          key={movie.slug}
                          onClick={() => handleSelectMovie(movie.slug)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          <img
                            src={movie.posterUrl || movie.thumbUrl || '/fallback-poster.svg'}
                            alt={movie.name}
                            className="w-10 h-14 object-cover rounded-lg shrink-0 bg-slate-200 dark:bg-slate-800"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                              {movie.name}
                            </h4>
                            {movie.originalName && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {movie.originalName}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {movie.quality && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                                  {movie.quality}
                                </span>
                              )}
                              {movie.year && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {movie.year}
                                </span>
                              )}
                              {movie.rating && movie.rating !== 'N/A' && (
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                                  <StarIcon className="w-3 h-3 fill-current" />
                                  {movie.rating}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handleSearchSubmit}
                        className="w-full py-2 mt-1 text-center text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                      >
                        Xem tất cả kết quả cho "{searchQuery}" →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Source Badge (Nguồn C + KKPhim) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đa nguồn chuẩn</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
              title={theme === 'light' ? 'Chuyển sang Chế độ Tối' : 'Chuyển sang Chế độ Sáng'}
              aria-label="Đổi giao diện"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-5 h-5 text-slate-700" />
              ) : (
                <SunIcon className="w-5 h-5 text-amber-400" />
              )}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Danh mục phim</span>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Nguồn C + KKPhim
              </div>
            </div>

            {NAV_LINKS.map(link => {
              const isActive = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.name}
                  to={link.to}
                  className={`px-3 py-2.5 rounded-xl text-[14px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Curated Genres Grid on Mobile Drawer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Thể loại phim hấp dẫn
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {CURATED_NAV_GENRES.map(g => (
                  <Link
                    key={g.slug}
                    to={`/browse/${g.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-[12px] font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Giao diện:</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[12px] font-bold text-slate-800 dark:text-slate-200"
              >
                {theme === 'light' ? (
                  <><MoonIcon className="w-4 h-4" /> Chế độ Tối</>
                ) : (
                  <><SunIcon className="w-4 h-4 text-amber-400" /> Chế độ Sáng</>
                )}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar for easy one-hand thumb access */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[max(8px,env(safe-area-inset-bottom))] shadow-lg">
        <div className="flex items-center justify-around h-[58px] px-2">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[48px] ${
              location.pathname === '/' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {location.pathname === '/' ? <HomeSolid className="w-5 h-5" /> : <HomeIcon className="w-5 h-5" />}
            <span className="text-[11px] mt-0.5">Trang chủ</span>
          </Link>

          <Link
            to="/browse/hanh-dong"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[48px] ${
              location.pathname.includes('/browse') ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {location.pathname.includes('/browse') ? <Squares2X2Solid className="w-5 h-5" /> : <Squares2X2Icon className="w-5 h-5" />}
            <span className="text-[11px] mt-0.5">Thể loại</span>
          </Link>

          <Link
            to="/search"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[48px] ${
              location.pathname === '/search' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">Tìm kiếm</span>
          </Link>

          <Link
            to="/account"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[48px] ${
              location.pathname === '/account' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {location.pathname === '/account' ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
            <span className="text-[11px] mt-0.5">Tủ phim</span>
          </Link>

          <button
            onClick={toggleTheme}
            className="flex flex-col items-center justify-center flex-1 py-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors min-h-[48px]"
            aria-label="Đổi giao diện"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-5 h-5 text-slate-700" />
            ) : (
              <SunIcon className="w-5 h-5 text-amber-400" />
            )}
            <span className="text-[11px] mt-0.5">{theme === 'light' ? 'Nền tối' : 'Nền sáng'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
