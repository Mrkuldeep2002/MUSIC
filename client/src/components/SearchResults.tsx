import React from 'react';
import { Play, Plus, Music, AlertCircle } from 'lucide-react';
import { YouTubeSearchResult, PlaylistItem } from '../types/room';

interface SearchResultsProps {
  results: YouTubeSearchResult[];
  isLoading: boolean;
  error: string | null;
  isHost: boolean;
  onSelectTrack: (track: PlaylistItem) => void;
  onAddToQueue: (track: PlaylistItem) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  error,
  isHost,
  onSelectTrack,
  onAddToQueue,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card p-3 flex gap-3 animate-pulse">
            <div className="h-16 w-24 bg-slate-700/50 rounded-lg"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-slate-700/50 rounded w-3/4"></div>
              <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-300 mt-4 flex items-center justify-center gap-2 text-sm">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  const createPlaylistItem = (item: YouTubeSearchResult): PlaylistItem => ({
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    videoId: item.videoId,
    title: item.title,
    channelTitle: item.channelTitle,
    thumbnailUrl: item.thumbnailUrl,
    duration: item.duration,
    addedBy: '',
  });

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Search Results ({results.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {results.map((item) => {
          const playlistItem = createPlaylistItem(item);

          return (
            <div
              key={item.videoId}
              className="glass-card p-2.5 flex items-center gap-3 group hover:border-brand-purple/50 transition-all"
            >
              {/* Thumbnail Container */}
              <div className="relative h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-dark-900">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.duration && (
                  <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-200">
                    {item.duration}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-brand-purple transition-colors">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mt-1">{item.channelTitle}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                {isHost && (
                  <button
                    onClick={() => onSelectTrack(playlistItem)}
                    className="p-2 rounded-lg bg-brand-purple hover:bg-purple-600 text-white shadow-md shadow-brand-purple/20 transition-all flex items-center justify-center"
                    title="Play Now"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </button>
                )}
                <button
                  onClick={() => onAddToQueue(playlistItem)}
                  className="p-2 rounded-lg bg-dark-600 hover:bg-dark-500 text-slate-200 border border-slate-600/50 transition-all flex items-center justify-center"
                  title="Add to Queue"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
