import { Server, Socket } from 'socket.io';
import { roomService } from '../services/roomService.js';
import { ChatMessage } from '../types/room.js';

// Simple in-memory socket message timestamp record for rate limiting
const userLastMessageTime: Map<string, number> = new Map();

export function setupChatSocket(io: Server, socket: Socket): void {
  socket.on('chat:send', (payload: { roomId: string; message: string }) => {
    try {
      const { roomId, message } = payload || {};
      if (!roomId || !message || !message.trim()) return;

      const room = roomService.getRoom(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const user = room.users.find((u) => u.id === socket.id);
      if (!user) {
        socket.emit('error', { message: 'You are not in this room' });
        return;
      }

      // Rate limit check: 500ms between messages per socket
      const lastTime = userLastMessageTime.get(socket.id) || 0;
      const now = Date.now();
      if (now - lastTime < 400) {
        socket.emit('error', { message: 'Sending messages too fast. Please slow down.' });
        return;
      }
      userLastMessageTime.set(socket.id, now);

      // Max message length validation
      const sanitizedMessage = message.trim().slice(0, 500);

      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        roomId: room.roomId,
        senderId: socket.id,
        senderName: user.name,
        isHost: user.isHost,
        message: sanitizedMessage,
        timestamp: now,
      };

      roomService.addChatMessage(room.roomId, chatMessage);
      io.to(room.roomId).emit('chat:message', chatMessage);
    } catch (err: any) {
      console.error('Chat error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
}
