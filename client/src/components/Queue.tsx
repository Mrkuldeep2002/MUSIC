import React, { useState } from 'react';
import { ListMusic, Play, Trash2, Disc, Sparkles, GripVertical, Shuffle } from 'lucide-react';
import { PlaylistItem, RoomState } from '../types/room';

interface QueueProps {
  roomState: RoomState | null;
  isHost: boolean;
  canControlPlayback?: boolean;
  onRemoveFromQueue: (trackId: string) => void;
  onPlayNow: (track: PlaylistItem) => void;
  onReorderQueue?: (fromIndex: number, toIndex: number) => void;
  onShuffleQueue?: () => void;
  onToggleAutoplay?: (enabled: boolean) => void;
}

export const Queue: React.FC<QueueProps> = ({
  roomState,
  isHost,
  canControlPlayback = isHost,
  onRemoveFromQueue,
  onPlayNow,
  onReorderQueue,
  onShuffleQueue,
  onToggleAutoplay,
}) => {
  const currentTrack = roomState?.playback.currentTrack;
  const queue = roomState?.queue || [];
  const autoplayEnabled = !!roomState?.autoplayEnabled;

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderQueue?.(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full border border-slate-800">
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ListMusic className="h-5 w-5 text-brand-pink" />
          <h3 className="font-bold text-base text-white">Music Queue</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-slate-400 font-mono">
            {queue.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Smart Shuffle Button */}
          {canControlPlayback && (
            <button
              onClick={onShuffleQueue}
              disabled={queue.length < 2}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700/60 bg-dark-700/60 hover:bg-brand-purple/20 hover:border-brand-purple/40 text-slate-300 hover:text-white disabled:opacity-30 text-xs font-medium transition-all"
              title="Smart Shuffle Queue"
            >
              <Shuffle className="h-3.5 w-3.5 text-brand-cyan" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
          )}

          {/* Smart Autoplay Toggle */}
          {isHost ? (
            <button
              onClick={() => onToggleAutoplay?.(!autoplayEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                autoplayEnabled
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                  : 'bg-dark-700/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Smart Autoplay (Auto-fetch Related Songs when Queue is Empty)"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{autoplayEnabled ? 'Autoplay ON' : 'Autoplay OFF'}</span>
            </button>
          ) : (
            autoplayEnabled && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px]">
                <Sparkles className="h-3 w-3" />
                <span>Autoplay</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* NOW PLAYING Section */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Disc className="h-3.5 w-3.5 text-brand-purple animate-spin" />
          <span>Now Playing</span>
        </h4>
        {currentTrack ? (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-purple/10 border border-brand-purple/30">
            <img
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              className="h-12 w-12 rounded-lg object-cover shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
              <p className="text-xs text-slate-400 truncate">{currentTrack.channelTitle}</p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-dark-800/50 border border-dashed border-slate-700/60 text-xs text-slate-400 text-center">
            No track currently playing
          </div>
        )}
      </div>

      {/* UP NEXT Queue */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[160px] max-h-[340px]">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Up Next
        </h4>

        {queue.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <ListMusic className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-xs">Queue is empty. Search tracks below to add them!</p>
          </div>
        ) : (
          queue.map((item, index) => {
            const isBeingDragged = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={item.id}
                draggable={canControlPlayback}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all select-none ${
                  isBeingDragged
                    ? 'opacity-40 bg-dark-900 border-purple-500/50 border-dashed scale-[0.98]'
                    : isDragOver
                    ? 'bg-brand-purple/20 border-brand-purple shadow-lg shadow-brand-purple/20 scale-[1.01]'
                    : 'bg-dark-800/60 border-slate-700/30 hover:border-slate-600/60'
                }`}
              >
                {/* Drag Grip Handle */}
                {canControlPlayback ? (
                  <div
                    className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-200 p-0.5"
                    title="Drag to reorder track position"
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                ) : (
                  <span className="text-xs font-mono font-bold text-slate-500 w-4 text-center">
                    {index + 1}
                  </span>
                )}

                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{item.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{item.channelTitle}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 shrink-0">
                  {canControlPlayback && (
                    <button
                      onClick={() => onPlayNow(item)}
                      className="p-1.5 hover:bg-brand-purple/20 text-brand-purple rounded-lg transition-colors"
                      title="Play Now"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveFromQueue(item.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
