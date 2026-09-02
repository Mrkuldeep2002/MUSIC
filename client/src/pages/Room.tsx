import React, { useState, useCallback } from 'react';
import { RoomState, RoomUser, PlaylistItem, ChatMessage, YouTubeSearchResult } from '../types/room';
import { Header } from '../components/Header';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { PlayerControls } from '../components/PlayerControls';
import { Queue } from '../components/Queue';
import { SearchBar } from '../components/SearchBar';
import { SearchResults } from '../components/SearchResults';
import { RoomUsers } from '../components/RoomUsers';
import { Chat } from '../components/Chat';
import { Toast } from '../components/Toast';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { searchYouTube } from '../services/api';

interface RoomProps {
  roomState: RoomState;
  currentUser: RoomUser | null;
  isHost: boolean;
  canControlPlayback: boolean;
  chatMessages: ChatMessage[];
  toast: { message: string; type: 'info' | 'success' | 'warning' } | null;
  onLeaveRoom: () => void;
  onToggleGuestControls: (allow: boolean) => void;
  onSendPlaybackAction: (action: 'play' | 'pause' | 'seek', position: number) => void;
  onChangeVideo: (track: PlaylistItem) => void;
  onAddToQueue: (track: PlaylistItem) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onNextTrack: () => void;
  onSendChatMessage: (message: string) => void;
}

export const Room: React.FC<RoomProps> = ({
  roomState,
  currentUser,
  isHost,
  canControlPlayback,
  chatMessages,
  toast,
  onLeaveRoom,
  onToggleGuestControls,
  onSendPlaybackAction,
  onChangeVideo,
  onAddToQueue,
  onRemoveFromQueue,
  onNextTrack,
  onSendChatMessage,
}) => {
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // YouTube Player Hook
  const {
    isPlaying,
    currentTime,
    duration,
    drift,
    needsUserInteraction,
    embedError,
    play,
    pause,
    seek,
    enableAudioAndSync,
  } = useYouTubePlayer({
    containerId: 'youtube-player-iframe',
    playback: roomState.playback,
    isHost,
    canControlPlayback,
    onStateChangeByHost: onSendPlaybackAction,
    onVideoEnd: onNextTrack,
  });

  // Execute Search
  const handleSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchYouTube(query);
      setSearchResults(results);
    } catch (err: any) {
      setSearchError('Failed to search YouTube. Please check network or API configuration.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col">
      {/* Header */}
      <Header roomState={roomState} onLeaveRoom={onLeaveRoom} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Grid: Player Section (Left) vs Queue & Presence Section (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Video Player & Host Controls */}
          <div className="lg:col-span-2 space-y-4">
            <YouTubePlayer
              playback={roomState.playback}
              containerId="youtube-player-iframe"
              needsUserInteraction={needsUserInteraction}
              onEnableAudio={enableAudioAndSync}
              drift={drift}
              embedError={embedError}
            />

            <PlayerControls
              playback={roomState.playback}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              isHost={isHost}
              canControlPlayback={canControlPlayback}
              allowGuestControls={!!roomState.allowGuestControls}
              onPlay={play}
              onPause={pause}
              onSeek={seek}
              onNextTrack={onNextTrack}
              onToggleGuestControls={onToggleGuestControls}
            />
          </div>

          {/* Right 1 Column: Queue Panel */}
          <div className="lg:col-span-1">
            <Queue
              roomState={roomState}
              isHost={isHost}
              canControlPlayback={canControlPlayback}
              onRemoveFromQueue={onRemoveFromQueue}
              onPlayNow={onChangeVideo}
            />
          </div>
        </div>

        {/* Search Bar & Search Results Section */}
        <div className="glass-panel p-5 border border-slate-800 space-y-4">
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          <SearchResults
            results={searchResults}
            isLoading={isSearching}
            error={searchError}
            isHost={isHost}
            canControlPlayback={canControlPlayback}
            onSelectTrack={onChangeVideo}
            onAddToQueue={onAddToQueue}
          />
        </div>

        {/* Bottom Grid: Room Listeners & Real-Time Chat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RoomUsers users={roomState.users} currentUserId={currentUser?.id} />
          <Chat
            messages={chatMessages}
            currentUserId={currentUser?.id}
            onSendMessage={onSendChatMessage}
          />
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};
