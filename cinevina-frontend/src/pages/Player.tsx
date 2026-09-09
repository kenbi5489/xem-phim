import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useMovieStream, useMovieDetail } from '../hooks/useMovies';
import { EmbeddedPlayer } from '../components/ui/EmbeddedPlayer';

export const Player: React.FC = () => {
  const { slug, episode } = useParams();
  const navigate = useNavigate();

  const { data: stream, isLoading: loadStream, error: errStream } = useMovieStream(slug || '', episode || '');
  const { data: movie } = useMovieDetail(slug || '');

  if (loadStream) {
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--color-bg-base)] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--color-bg-hover)] border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (errStream || !stream) {
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--color-bg-base)] flex flex-col items-center justify-center text-[var(--color-text-1)] gap-4">
        <ExclamationTriangleIcon className="w-16 h-16 text-[#F5C842]" />
        <div className="text-center">
          <h2 className="text-2xl font-heading tracking-wide uppercase">Lỗi tải luồng phát</h2>
          <p className="text-[var(--color-text-3)] text-[14px] mt-2">Không tìm thấy link phát hoặc nguồn phim đang bảo trì.</p>
        </div>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 mt-4 bg-[var(--color-bg-hover)] hover:bg-[var(--color-border)] rounded-[8px] text-[14px] font-medium transition-colors">
          Quay lại
        </button>
      </div>
    );
  }

  const handleEpisodeChange = (_serverIdx: number, epSlug: string) => {
    navigate(`/play/${slug}/${epSlug}`, { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex-1 w-full h-full bg-black flex items-center justify-center">
        <div className="w-full h-full max-w-[1920px] mx-auto bg-black relative">
          <EmbeddedPlayer
            streamUrl={stream.url}
            streamType={stream.type as 'hls' | 'embed'}
            movieSlug={slug || ''}
            movieName={movie?.name || slug?.replace(/-/g, ' ')}
            currentEpisode={episode || ''}
            servers={movie?.servers || []}
            onEpisodeChange={handleEpisodeChange}
            onBack={() => navigate(-1)}
            className="w-full h-full rounded-none border-none shadow-none"
          />
        </div>
      </div>
    </div>
  );
};
