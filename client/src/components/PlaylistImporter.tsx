import React, { useState } from 'react';
import { ListPlus, Loader2, Music, CheckCircle2, AlertCircle, Link } from 'lucide-react';
import { importYouTubePlaylist } from '../services/api';
import { PlaylistItem } from '../types/room';

interface PlaylistImporterProps {
  onImportPlaylist: (tracks: PlaylistItem[]) => void;
}

export const PlaylistImporter: React.FC<PlaylistImporterProps> = ({ onImportPlaylist }) => {
  const [playlistInput, setPlaylistInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistInput.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccessCount(null);

    try {
      const items = await importYouTubePlaylist(playlistInput);
      if (items && items.length > 0) {
        onImportPlaylist(items);
        setSuccessCount(items.length);
        setPlaylistInput('');
        setTimeout(() => setSuccessCount(null), 5000);
      } else {
        setError('No playable music, video, or playlist found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import media. Please check the URL or link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-4 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-pink/20 text-brand-pink">
            <ListPlus className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold text-white">Universal Link & Playlist Importer</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-full bg-dark-700 text-slate-400">
          <Link className="h-3 w-3 text-brand-purple" />
          <span>YouTube & YT Music</span>
        </div>
      </div>

      <form onSubmit={handleImport} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={playlistInput}
            onChange={(e) => setPlaylistInput(e.target.value)}
            placeholder="Paste any Song, Video, or Playlist link (e.g. music.youtube.com/watch?v=... or playlist?list=...)"
            className="w-full pl-9 pr-3 py-2 bg-dark-800/90 border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
          />
          <Music className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        <button
          type="submit"
          disabled={isLoading || !playlistInput.trim()}
          className="px-4 py-2 bg-gradient-to-r from-brand-purple to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium text-xs rounded-xl shadow-md shadow-brand-purple/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Importing...</span>
            </>
          ) : (
            <>
              <ListPlus className="h-3.5 w-3.5" />
              <span>Add to Queue</span>
            </>
          )}
        </button>
      </form>

      {/* Success Notification */}
      {successCount !== null && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Added {successCount} {successCount === 1 ? 'track' : 'tracks'} into room queue!</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
