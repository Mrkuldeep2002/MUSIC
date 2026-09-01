import React from 'react';
import { Volume2, Music, Sparkles } from 'lucide-react';
import { PlaybackState } from '../types/room';

interface YouTubePlayerProps {
  playback: PlaybackState | null;
  containerId: string;
  needsUserInteraction: boolean;
  onEnableAudio: () => void;
  drift: number;
  embedError?: string | null;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  playback,
  containerId,
  needsUserInteraction,
  onEnableAudio,
  drift,
  embedError,
}) => {
  const currentTrack = playback?.currentTrack;

  return (
    <div className="relative w-full glass-panel overflow-hidden border border-slate-800 shadow-2xl">
      {/* Track Info Overlay Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-900/70 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-brand-purple/20 text-brand-purple">
            <Music className="h-4 w-4 animate-pulse" />
          </div>
          <div className="truncate">
            <h2 className="text-sm font-semibold text-white truncate">
              {currentTrack?.title || 'No Track Selected'}
            </h2>
            <p className="text-xs text-slate-400 truncate">
              {currentTrack?.channelTitle || 'Search & select a YouTube track below'}
            </p>
          </div>
        </div>

        {/* Sync Drift Badge */}
        {playback?.videoId && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-dark-800 border border-slate-700/60 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Synced ({isNaN(drift) ? '0.0' : Math.abs(drift).toFixed(1)}s)</span>
          </div>
        )}
      </div>

      {/* Video Container (16:9 Aspect Ratio) */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center">
        {/* Actual IFrame player container element */}
        <div id={containerId} className="w-full h-full" />

        {/* Empty State when no video is selected */}
        {!playback?.videoId && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-dark-900/90 to-dark-800/95 z-10">
            <div className="h-16 w-16 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center mb-4 text-brand-purple">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Room Audio is Ready</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Use the search bar below to choose a YouTube song or add tracks to the queue!
            </p>
          </div>
        )}

        {/* Embedding Error Overlay (YouTube Mobile Restrictions) */}
        {playback?.videoId && embedError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-900/95 backdrop-blur-md p-6 text-center">
            <div className="p-3 rounded-full bg-amber-500/20 text-amber-400 mb-3">
              <Volume2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Mobile Web Restriction by YouTube Owner</h3>
            <p className="text-xs text-slate-300 max-w-sm mb-4">
              T-Series/Channel owner blocked mobile browser embedding for this video ID.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {playback?.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${playback.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-brand-purple hover:bg-purple-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                >
                  ▶ Open in YouTube App
                </a>
              )}
            </div>
          </div>
        )}

        {/* Browser Autoplay / Audio Enable Overlay */}
        {needsUserInteraction && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-dark-900/90 backdrop-blur-md p-6 text-center animate-fadeIn">
            <div className="p-4 rounded-full bg-brand-purple/20 text-brand-purple mb-4 animate-bounce">
              <Volume2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Enable Sync & Audio</h3>
            <p className="text-sm text-slate-300 max-w-md mb-5">
              Browser policies require one click to allow continuous audio playback for synchronized listening.
            </p>
            <button
              onClick={onEnableAudio}
              className="px-6 py-3 bg-gradient-to-r from-brand-purple to-brand-pink hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-purple/30 transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <Volume2 className="h-5 w-5" />
              <span>Click to Sync Audio</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
