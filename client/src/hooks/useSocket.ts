import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = window.location.origin;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
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

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
