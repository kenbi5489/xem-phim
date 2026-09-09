import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieStream, useMovieDetail } from '../../hooks/useMovies';
import { EmbeddedPlayer } from '../../components/ui/EmbeddedPlayer';

export const TVPlayer: React.FC = () => {
  const { slug, episode } = useParams();
  const navigate = useNavigate();

  // If no episode is provided, try to play the first episode
  const { data: movie, isLoading: loadMovie, error: errMovie } = useMovieDetail(slug || '');
  const targetEpisode = episode || (movie?.episodes?.[0]?.slug) || '';

  const { data: stream, isFetching: loadStream, error: errStream } = useMovieStream(slug || '', targetEpisode, 'kkphim');

  // TV remote back button handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack') {
        e.preventDefault();
        navigate(`/tv/phim/${slug}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, slug]);

  if (loadMovie || (targetEpisode && loadStream)) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Check if movie loaded but has no episodes
  if (movie && !targetEpisode) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white gap-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold uppercase mb-4">No Episodes Found</h2>
          <p className="text-xl text-gray-400">This movie does not have any playable episodes yet.</p>
        </div>
        <button 
          data-tv-focusable="true"
          onClick={() => navigate(`/tv/phim/${slug}`)} 
          className="px-8 py-4 mt-8 bg-white text-black font-bold focus:scale-110 rounded-lg focus:ring-4 focus:ring-blue-500"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (errMovie || errStream || !stream) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white gap-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold uppercase mb-4">Error loading stream</h2>
          <p className="text-xl text-gray-400">Cannot play this video right now.</p>
        </div>
        <button 
          data-tv-focusable="true"
          onClick={() => navigate(`/tv/phim/${slug}`)} 
          className="px-8 py-4 mt-8 bg-white text-black font-bold focus:scale-110 rounded-lg focus:ring-4 focus:ring-blue-500"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleEpisodeChange = (_serverIdx: number, epSlug: string) => {
    navigate(`/tv/play/${slug}/${epSlug}`, { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex-1 w-full h-full bg-black flex items-center justify-center">
        <div className="w-full h-full mx-auto bg-black relative">
          <EmbeddedPlayer
            streamUrl={stream.url}
            streamType={stream.type as 'hls' | 'embed'}
            movieSlug={slug || ''}
            movieName={movie?.name || slug?.replace(/-/g, ' ')}
            currentEpisode={targetEpisode}
            servers={movie?.servers || []}
            onEpisodeChange={handleEpisodeChange}
            onBack={() => navigate(`/tv/phim/${slug}`)}
            className="w-full h-full rounded-none border-none shadow-none"
          />
        </div>
      </div>
    </div>
  );
};
