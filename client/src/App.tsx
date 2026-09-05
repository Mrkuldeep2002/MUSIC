import React from 'react';
import { useSocket } from './hooks/useSocket';
import { useRoom } from './hooks/useRoom';
import { Home } from './pages/Home';
import { Room } from './pages/Room';
import { WifiOff } from 'lucide-react';

export function App() {
  const { socket, isConnected } = useSocket();
  const {
    roomState,
    currentUser,
    isHost,
    canControlPlayback,
    chatMessages,
    errorMessage,
    toast,
    createRoom,
    joinRoom,
    leaveRoom,
    updateUserName,
    kickUser,
    toggleGuestControls,
    toggleAutoplay,
    sendPlaybackAction,
    changeVideo,
    addToQueue,
    importPlaylist,
    removeFromQueue,
    reorderQueue,
    shuffleQueue,
    clearQueue,
    nextTrack,
    sendChatMessage,
  } = useRoom({ socket, isConnected });

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 selection:bg-brand-purple selection:text-white">
      {/* Offline Banner indicator */}
      {!isConnected && (
        <div className="bg-amber-500/90 text-dark-900 font-bold px-4 py-2 text-center text-xs flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="h-4 w-4" />
          <span>Connecting to WeSync Server... Please make sure the server is running on port 3001.</span>
        </div>
      )}

      {!roomState ? (
        <Home errorMessage={errorMessage} toast={toast} onCreateRoom={createRoom} onJoinRoom={joinRoom} />
      ) : (
        <Room
          roomState={roomState}
          currentUser={currentUser}
          isHost={isHost}
          canControlPlayback={canControlPlayback}
          chatMessages={chatMessages}
          toast={toast}
          onLeaveRoom={leaveRoom}
          onUpdateUserName={updateUserName}
          onKickUser={kickUser}
          onToggleGuestControls={toggleGuestControls}

          onToggleAutoplay={toggleAutoplay}
          onSendPlaybackAction={sendPlaybackAction}
          onChangeVideo={changeVideo}
          onAddToQueue={addToQueue}
          onImportPlaylist={importPlaylist}
          onRemoveFromQueue={removeFromQueue}
          onReorderQueue={reorderQueue}
          onShuffleQueue={shuffleQueue}
          onClearQueue={clearQueue}
          onNextTrack={nextTrack}
          onSendChatMessage={sendChatMessage}
        />
      )}

    </div>
  );
}

export default App;
