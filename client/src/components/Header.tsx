import React, { useState, useRef, useEffect } from 'react';
import { Music2, Copy, Check, Users, LogOut, Search, X, Loader2, Play, Plus } from 'lucide-react';
import { RoomState, YouTubeSearchResult, PlaylistItem } from '../types/room';

interface HeaderProps {
  roomState: RoomState | null;
  isHost: boolean;
  canControlPlayback?: boolean;
  onLeaveRoom: () => void;
  onSearch?: (query: string) => Promise<YouTubeSearchResult[]>;
  onSelectTrack?: (track: PlaylistItem) => void;
  onAddToQueue?: (track: PlaylistItem) => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomState,
  isHost,
  canControlPlayback = isHost,
  onLeaveRoom,
  onSearch,
  onSelectTrack,
  onAddToQueue,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const copyInviteLink = () => {
    if (!roomState) return;
    const inviteUrl = `${window.location.origin}/?room=${roomState.roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !onSearch) return;

    setIsSearching(true);
    setIsDropdownOpen(true);
    try {
      const results = await onSearch(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Navbar search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackSelect = (result: YouTubeSearchResult, action: 'play' | 'queue') => {
    const item: PlaylistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoId: result.videoId,
      title: result.title,
      channelTitle: result.channelTitle,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      addedBy: 'search',
    };

    if (action === 'play') {
      onSelectTrack?.(item);
    } else {
      onAddToQueue?.(item);
    }

    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => (window.location.href = '/')}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center shadow-lg shadow-brand-purple/20">
            <Music2 className="h-6 w-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              We<span className="text-brand-purple">Sync</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium -mt-1">Real-Time Music & Video Room</p>
          </div>
        </div>

        {/* Central YouTube Music Style Search Bar */}
        {roomState && onSearch && (
          <div ref={searchContainerRef} className="relative flex-1 max-w-lg mx-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim() && !isDropdownOpen) {
                    setIsDropdownOpen(true);
                  }
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setIsDropdownOpen(true);
                }}
                placeholder="Search songs, artists, videos..."
                className="w-full pl-9 pr-8 py-2 bg-dark-800/90 border border-slate-700/70 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all shadow-inner"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            {/* Floating Search Results Dropdown Overlay */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto animate-fadeIn">
                {isSearching ? (
                  <div className="flex items-center justify-center p-6 text-slate-400 text-xs gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-purple" />
                    <span>Searching YouTube...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    {searchQuery ? 'Press Enter to search YouTube' : 'Type to search music'}
                  </div>
                ) : (
                  <div className="p-2 divide-y divide-slate-800">
                    {searchResults.map((result) => (
                      <div
                        key={result.videoId}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-700/70 transition-all group"
                      >
                        <img
                          src={result.thumbnailUrl}
                          alt={result.title}
                          className="h-10 w-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{result.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{result.channelTitle}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {canControlPlayback && (
                            <button
                              onClick={() => handleTrackSelect(result, 'play')}
                              className="px-2.5 py-1 bg-brand-purple hover:bg-purple-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
                              title="Play Now"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span className="hidden sm:inline">Play</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleTrackSelect(result, 'queue')}
                            className="px-2.5 py-1 bg-dark-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-600/60 transition-all"
                            title="Add to Queue"
                          >
                            <Plus className="h-3 w-3" />
                            <span className="hidden sm:inline">Queue</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Room Information (If inside room) */}
        {roomState && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Room Code Badge */}
            <div className="flex items-center gap-1.5 bg-dark-800 border border-slate-700/60 px-2.5 py-1.5 rounded-xl">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider hidden sm:inline">Room:</span>
              <span className="font-mono font-bold text-brand-cyan tracking-widest text-xs sm:text-sm">{roomState.roomId}</span>
              <button
                onClick={copyInviteLink}
                className="ml-1 p-1 hover:bg-slate-700/60 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs"
                title="Copy Invite Link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Connected User Count */}
            <div className="flex items-center gap-1 bg-dark-800/80 border border-slate-700/40 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300">
              <Users className="h-3.5 w-3.5 text-brand-purple" />
              <span>{roomState.users.length}</span>
            </div>

            {/* Leave Room Button */}
            <button
              onClick={onLeaveRoom}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl transition-all flex items-center gap-1 text-xs font-medium"
              title="Leave Room"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
