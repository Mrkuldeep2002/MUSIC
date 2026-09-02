import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { RoomState, RoomUser, PlaylistItem, ChatMessage } from '../types/room';

interface UseRoomProps {
  socket: Socket | null;
  isConnected: boolean;
}

export function useRoom({ socket, isConnected }: UseRoomProps) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [currentUser, setCurrentUser] = useState<RoomUser | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const isHost = currentUser?.isHost || roomState?.hostId === socket?.id;

  // Auto-recovery / reconnect logic
  useEffect(() => {
    if (!socket || !isConnected) return;

    const savedRoomId = sessionStorage.getItem('synctune_room_id');
    const savedUserName = localStorage.getItem('synctune_user_name') || '';

    if (savedRoomId && !roomState) {
      console.log(`🔄 Attempting state recovery for room: ${savedRoomId}`);
      socket.emit('room:join', { roomId: savedRoomId, userName: savedUserName });
    }
  }, [socket, isConnected]);

  // Register socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Room created
    socket.on('room:created', (data: { room: RoomState; user: RoomUser }) => {
      setRoomState(data.room);
      setCurrentUser(data.user);
      sessionStorage.setItem('synctune_room_id', data.room.roomId);
      showToast(`Room ${data.room.roomId} created! You are the host.`, 'success');
    });

    // Room joined
    socket.on('room:joined', (data: { room: RoomState; user: RoomUser }) => {
      setRoomState(data.room);
      setCurrentUser(data.user);
      sessionStorage.setItem('synctune_room_id', data.room.roomId);
      showToast(`Joined room ${data.room.roomId}!`, 'success');
    });

    // User joined
    socket.on('room:user-joined', (data: { user: RoomUser; room: RoomState }) => {
      setRoomState(data.room);
      showToast(`${data.user.name} joined the room!`, 'info');
      setChatMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          roomId: data.room.roomId,
          senderId: 'system',
          senderName: 'System',
          isHost: false,
          message: `${data.user.name} joined the room 👋`,
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    });

    // User left
    socket.on('room:user-left', (data: { socketId: string; room: RoomState }) => {
      setRoomState(data.room);
    });

    // Host changed
    socket.on('room:host-changed', (data: { newHost: RoomUser; room: RoomState }) => {
      setRoomState(data.room);
      if (socket.id === data.newHost.id) {
        setCurrentUser((prev) => (prev ? { ...prev, isHost: true } : data.newHost));
        showToast('👑 You are now the room host!', 'warning');
      } else {
        showToast(`👑 ${data.newHost.name} is now the host!`, 'info');
      }
    });

    // Player state updated
    socket.on('player:state', (data: { playback: RoomState['playback']; roomId: string }) => {
      setRoomState((prev) => (prev ? { ...prev, playback: data.playback } : null));
    });

    // Video changed
    socket.on('player:video-changed', (data: { videoId: string; track: PlaylistItem | null }) => {
      setRoomState((prev) =>
        prev
          ? {
              ...prev,
              playback: {
                ...prev.playback,
                videoId: data.videoId,
                currentTrack: data.track,
                position: 0,
                updatedAt: Date.now(),
              },
            }
          : null
      );
      if (data.track) {
        showToast(`Now Playing: ${data.track.title}`, 'info');
      }
    });

    // Queue updated
    socket.on('queue:updated', (data: { queue: PlaylistItem[]; roomId: string }) => {
      setRoomState((prev) => (prev ? { ...prev, queue: data.queue } : null));
    });

    // Room updated
    socket.on('room:updated', (data: { room: RoomState }) => {
      setRoomState(data.room);
    });

    // Chat message
    socket.on('chat:message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Errors
    socket.on('error', (err: { message: string }) => {
      setErrorMessage(err.message);
      showToast(err.message, 'warning');
      setTimeout(() => setErrorMessage(null), 5000);
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:user-joined');
      socket.off('room:user-left');
      socket.off('room:host-changed');
      socket.off('player:state');
      socket.off('player:video-changed');
      socket.off('queue:updated');
      socket.off('room:updated');
      socket.off('chat:message');
      socket.off('error');
    };
  }, [socket, showToast]);

  // Actions
  const createRoom = useCallback(
    (userName?: string) => {
      if (!socket) return;
      if (userName) localStorage.setItem('synctune_user_name', userName);
      socket.emit('room:create', { userName });
    },
    [socket]
  );

  const joinRoom = useCallback(
    (roomId: string, userName?: string) => {
      if (!socket) return;
      if (userName) localStorage.setItem('synctune_user_name', userName);
      socket.emit('room:join', { roomId, userName });
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('room:leave');
    sessionStorage.removeItem('synctune_room_id');
    setRoomState(null);
    setCurrentUser(null);
    setChatMessages([]);
  }, [socket]);

  const toggleGuestControls = useCallback(
    (allow: boolean) => {
      if (!socket || !roomState) return;
      socket.emit('room:toggle-guest-controls', { roomId: roomState.roomId, allow });
    },
    [socket, roomState]
  );

  const sendPlaybackAction = useCallback(
    (action: 'play' | 'pause' | 'seek', position: number) => {
      if (!socket || !roomState) return;
      if (action === 'play') {
        socket.emit('player:play', { roomId: roomState.roomId, position });
      } else if (action === 'pause') {
        socket.emit('player:pause', { roomId: roomState.roomId, position });
      } else if (action === 'seek') {
        socket.emit('player:seek', { roomId: roomState.roomId, position });
      }
    },
    [socket, roomState]
  );

  const changeVideo = useCallback(
    (track: PlaylistItem) => {
      if (!socket || !roomState) return;
      socket.emit('player:change-video', {
        roomId: roomState.roomId,
        videoId: track.videoId,
        track,
      });
    },
    [socket, roomState]
  );

  const addToQueue = useCallback(
    (track: PlaylistItem) => {
      if (!socket || !roomState) return;
      socket.emit('queue:add', { roomId: roomState.roomId, track });
      showToast(`Added to Queue: ${track.title}`, 'success');
    },
    [socket, roomState, showToast]
  );

  const removeFromQueue = useCallback(
    (trackId: string) => {
      if (!socket || !roomState) return;
      socket.emit('queue:remove', { roomId: roomState.roomId, trackId });
    },
    [socket, roomState]
  );

  const nextTrack = useCallback(() => {
    if (!socket || !roomState) return;
    socket.emit('queue:next', { roomId: roomState.roomId });
  }, [socket, roomState]);

  const sendChatMessage = useCallback(
    (message: string) => {
      if (!socket || !roomState) return;
      socket.emit('chat:send', { roomId: roomState.roomId, message });
    },
    [socket, roomState]
  );

  const canControlPlayback = isHost || !!roomState?.allowGuestControls;

  return {
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
    toggleGuestControls,
    sendPlaybackAction,
    changeVideo,
    addToQueue,
    removeFromQueue,
    nextTrack,
    sendChatMessage,
  };
}
