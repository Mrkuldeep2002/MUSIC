import React from 'react';
import { Play, Pause, SkipForward, Crown, ShieldAlert } from 'lucide-react';
import { PlaybackState } from '../types/room';

interface PlayerControlsProps {
  playback: PlaybackState | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isHost: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onNextTrack: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playback,
  isPlaying,
  currentTime,
  duration,
  isHost,
  onPlay,
  onPause,
  onSeek,
  onNextTrack,
}) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  return (
    <div className="glass-panel p-4 border border-slate-800 flex flex-col gap-3">
      {/* Time Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeekChange}
          disabled={!isHost || !playback?.videoId}
          className="flex-1 h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="text-xs font-mono text-slate-400 w-10">{formatTime(duration)}</span>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        {/* Host Status Indicator */}
        <div className="flex items-center gap-2">
          {isHost ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <Crown className="h-3.5 w-3.5" />
              <span>Host Controls Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-400 text-xs">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
              <span>Host Synced</span>
            </div>
          )}
        </div>

        {/* Play/Pause & Skip Buttons */}
        <div className="flex items-center gap-3">
          {isPlaying ? (
            <button
              onClick={onPause}
              disabled={!isHost || !playback?.videoId}
              className="p-3 rounded-full bg-brand-purple hover:bg-purple-600 text-white shadow-lg shadow-brand-purple/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              title={isHost ? 'Pause' : 'Only host can pause'}
            >
              <Pause className="h-5 w-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={!isHost || !playback?.videoId}
              className="p-3 rounded-full bg-brand-purple hover:bg-purple-600 text-white shadow-lg shadow-brand-purple/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              title={isHost ? 'Play' : 'Only host can play'}
            >
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={onNextTrack}
            disabled={!isHost}
            className="p-2.5 rounded-full bg-dark-700 hover:bg-dark-600 text-slate-200 border border-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={isHost ? 'Next Track' : 'Only host can skip'}
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        <div className="w-24 hidden sm:block"></div>
      </div>
    </div>
  );
};
