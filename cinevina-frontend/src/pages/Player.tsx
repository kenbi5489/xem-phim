import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, ServerStackIcon } from '@heroicons/react/24/outline';
import { useMovieStream, useMovieDetail } from '../hooks/useMovies';
import { EmbeddedPlayer } from '../components/ui/EmbeddedPlayer';
import { useScreenWakeLock } from '../utils/wakeLock';
import type { ServerData } from '../services/api';

export const Player: React.FC = () => {
  const { slug, episode } = useParams();
  const navigate = useNavigate();

  // Ngăn màn hình tự động tắt/sleep khi ở trong trình phát phim
  useScreenWakeLock(true);

  const [selectedServerIdx, setSelectedServerIdx] = useState<number>(0);

  const { data: movie, isLoading: loadMovie } = useMovieDetail(slug || '');
  const { data: stream, isLoading: loadStream, error: errStream, refetch: retryStream } = useMovieStream(slug || '', episode || '');

  // Extract servers from movie detail
  const servers: ServerData[] = movie?.servers || [];
  const currentServer = servers[selectedServerIdx] || servers[0];

  // Try to find if current episode has a direct link inside currentServer
  const directEp = currentServer?.server_data?.find(
    (e) => e.slug === episode || e.name === episode
  );

  const activeStreamUrl = directEp?.link_m3u8 || directEp?.link_embed || stream?.url || '';
  const activeStreamType = (directEp?.link_m3u8 ? 'hls' : (directEp?.link_embed ? 'embed' : stream?.type)) as 'hls' | 'embed';

  if (loadStream && loadMovie && !activeStreamUrl) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Đang chuẩn bị luồng phát...</p>
      </div>
    );
  }

  if ((errStream || !activeStreamUrl) && !loadStream && !loadMovie) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-white px-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center gap-4 shadow-2xl">
          <ExclamationTriangleIcon className="w-14 h-14 text-amber-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Chưa thể phát luồng này</h2>
            <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
              Tập phim trên máy chủ hiện tại có thể đang bảo trì hoặc chưa sẵn sàng. Hãy thử đổi sang máy chủ khác bên dưới:
            </p>
          </div>

          {servers.length > 0 && (
            <div className="flex flex-col gap-2 w-full my-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chọn máy chủ thay thế</span>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {servers.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedServerIdx(idx);
                      const targetEp = s.server_data?.[0]?.slug || episode || '';
                      navigate(`/play/${slug}/${targetEp}`, { replace: true });
                    }}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      idx === selectedServerIdx
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ServerStackIcon className="w-4 h-4 text-indigo-400" />
                      {s.server_name}
                    </span>
                    <span className="text-xs text-slate-400">{s.server_data?.length || 0} tập</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 w-full mt-2">
            <button
              onClick={() => retryStream()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleEpisodeChange = (serverIdx: number, epSlug: string) => {
    setSelectedServerIdx(serverIdx);
    navigate(`/play/${slug}/${epSlug}`, { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex-1 w-full h-full bg-black flex items-center justify-center">
        <div className="w-full h-full max-w-[1920px] mx-auto bg-black relative">
          <EmbeddedPlayer
            streamUrl={activeStreamUrl}
            streamType={activeStreamType || 'hls'}
            movieSlug={slug || ''}
            movieName={movie?.name || slug?.replace(/-/g, ' ')}
            currentEpisode={episode || ''}
            servers={servers}
            onEpisodeChange={handleEpisodeChange}
            onBack={() => navigate(-1)}
            className="w-full h-full rounded-none border-none shadow-none"
          />
        </div>
      </div>
    </div>
  );
};
