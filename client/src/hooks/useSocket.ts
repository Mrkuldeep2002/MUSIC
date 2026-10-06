import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = window.location.origin;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      path: '/socket.io/',
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Disconnected from Socket.IO server:', reason);
      setIsConnected(false);
    });

    // Handle successful reconnection — auto-rejoin last room
    socket.io.on('reconnect', (attemptNumber: number) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempt(s). New socket ID: ${socket.id}`);
      setIsConnected(true);

      // Auto-rejoin room if user was previously in one
      const savedRoomId = localStorage.getItem('wesync_room_id');
      const savedUserName = localStorage.getItem('wesync_user_name') || '';

      if (savedRoomId) {
        const savedUserId = localStorage.getItem('wesync_user_id') || undefined;
        console.log(`🔄 Auto-rejoining room ${savedRoomId} after reconnect...`);
        socket.emit('room:join', { roomId: savedRoomId, name: savedUserName, userId: savedUserId });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
