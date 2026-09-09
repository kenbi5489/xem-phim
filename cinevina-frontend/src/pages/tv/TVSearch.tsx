import React, { useState, useEffect } from 'react';
import { useSearchMovies, useDebounce } from '../../hooks/useMovies';
import { TVMovieCard } from '../../components/tv/TVMovieCard';

export const TVSearch: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 500);
  const { data: searchResults, isLoading } = useSearchMovies(debouncedKeyword, 1);

  // Focus the input on mount so user can start typing or use virtual keyboard
  useEffect(() => {
    const input = document.getElementById('tv-search-input');
    if (input) input.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-12">
      <h1 className="text-4xl font-bold text-white mb-8">Tìm Kiếm</h1>
      
      <div className="mb-12">
        <input
          id="tv-search-input"
          type="text"
          data-tv-focusable="true"
          placeholder="Nhập tên phim để tìm kiếm..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full max-w-3xl bg-gray-800 text-white text-3xl p-6 rounded-2xl outline-none focus:ring-4 focus:ring-white transition-all focus:scale-[1.02] placeholder-gray-500"
        />
      </div>

      {isLoading && <div className="text-2xl text-gray-400">Đang tìm kiếm...</div>}

      {!isLoading && searchResults && searchResults.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {searchResults.map((movie) => (
            <TVMovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      {!isLoading && debouncedKeyword.length >= 2 && searchResults?.length === 0 && (
        <div className="text-2xl text-gray-400">Không tìm thấy kết quả cho "{debouncedKeyword}"</div>
      )}
    </div>
  );
};
