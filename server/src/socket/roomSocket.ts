import { Server, Socket } from 'socket.io';
import { roomService } from '../services/roomService.js';
import { PlaylistItem } from '../types/room.js';

export function setupRoomSocket(io: Server, socket: Socket): void {
  // Create Room
  socket.on('room:create', (payload: { userName?: string }) => {
    try {
      const { room, user } = roomService.createRoom(socket.id, payload?.userName);
      socket.join(room.roomId);
      
      socket.emit('room:created', { room, user });
      console.log(`🏠 Room created: ${room.roomId} by ${user.name} (${socket.id})`);
    } catch (err: any) {
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Join Room
  socket.on('room:join', (payload: { roomId: string; userName?: string }) => {
    try {
      const roomId = payload?.roomId?.toUpperCase();
      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      const result = roomService.joinRoom(roomId, socket.id, payload?.userName);
      if (!result) {
        socket.emit('error', { message: 'Room not found or no longer available' });
        return;
      }

      const { room, user } = result;
      socket.join(room.roomId);

      socket.emit('room:joined', { room, user });
      socket.to(room.roomId).emit('room:user-joined', { user, room });

      console.log(`👤 User ${user.name} (${socket.id}) joined room ${room.roomId}`);
    } catch (err: any) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave Room
  socket.on('room:leave', () => {
    handleUserLeave(io, socket);
  });

  // Host playback controls: Play
  socket.on('player:play', (payload: { roomId: string; position?: number }) => {
    const { roomId, position } = payload || {};
    if (!roomId) return;

    if (!roomService.isHost(roomId, socket.id)) {
      socket.emit('error', { message: 'Only the host can control playback' });
      return;
    }

    const updatedRoom = roomService.updatePlayback(roomId, socket.id, 'play', { position });
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('player:state', { playback: updatedRoom.playback, roomId: updatedRoom.roomId });
    }
  });

  // Host playback controls: Pause
  socket.on('player:pause', (payload: { roomId: string; position?: number }) => {
    const { roomId, position } = payload || {};
    if (!roomId) return;

    if (!roomService.isHost(roomId, socket.id)) {
      socket.emit('error', { message: 'Only the host can control playback' });
      return;
    }

    const updatedRoom = roomService.updatePlayback(roomId, socket.id, 'pause', { position });
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('player:state', { playback: updatedRoom.playback, roomId: updatedRoom.roomId });
    }
  });

  // Host playback controls: Seek
  socket.on('player:seek', (payload: { roomId: string; position: number }) => {
    const { roomId, position } = payload || {};
    if (!roomId || position === undefined) return;

    if (!roomService.isHost(roomId, socket.id)) {
      socket.emit('error', { message: 'Only the host can seek' });
      return;
    }

    const updatedRoom = roomService.updatePlayback(roomId, socket.id, 'seek', { position });
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('player:state', { playback: updatedRoom.playback, roomId: updatedRoom.roomId });
    }
  });

  // Change Video
  socket.on('player:change-video', (payload: { roomId: string; videoId: string; track?: PlaylistItem }) => {
    const { roomId, videoId, track } = payload || {};
    if (!roomId || !videoId) return;

    if (!roomService.isHost(roomId, socket.id)) {
      socket.emit('error', { message: 'Only the host can change tracks' });
      return;
    }

    const updatedRoom = roomService.updatePlayback(roomId, socket.id, 'change-video', { videoId, track });
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('player:video-changed', { videoId, track: updatedRoom.playback.currentTrack });
      io.to(updatedRoom.roomId).emit('player:state', { playback: updatedRoom.playback, roomId: updatedRoom.roomId });
    }
  });

  // Queue: Add track
  socket.on('queue:add', (payload: { roomId: string; track: PlaylistItem }) => {
    const { roomId, track } = payload || {};
    if (!roomId || !track) return;

    // Attach user ID who added this track
    track.addedBy = socket.id;

    const updatedRoom = roomService.addToQueue(roomId, track);
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('queue:updated', { queue: updatedRoom.queue, roomId: updatedRoom.roomId });
      io.to(updatedRoom.roomId).emit('player:state', { playback: updatedRoom.playback, roomId: updatedRoom.roomId });
    }
  });

  // Queue: Remove track
  socket.on('queue:remove', (payload: { roomId: string; trackId: string }) => {
    const { roomId, trackId } = payload || {};
    if (!roomId || !trackId) return;

    const updatedRoom = roomService.removeFromQueue(roomId, socket.id, trackId);
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('queue:updated', { queue: updatedRoom.queue, roomId: updatedRoom.roomId });
    }
  });

  // Queue: Skip / Next track
  socket.on('queue:next', (payload: { roomId: string }) => {
    const { roomId } = payload || {};
    if (!roomId) return;

    if (!roomService.isHost(roomId, socket.id)) {
      socket.emit('error', { message: 'Only the host can skip tracks' });
      return;
    }

    const updatedRoom = roomService.nextTrack(roomId, socket.id);
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('player:video-changed', { videoId: updatedRoom.playback.videoId, track: updatedRoom.playback.currentTrack });
      io.to(updatedRoom.roomId).emit('player:state', { playback: updatedRoom.playback, roomId: updatedRoom.roomId });
      io.to(updatedRoom.roomId).emit('queue:updated', { queue: updatedRoom.queue, roomId: updatedRoom.roomId });
    }
  });

  // Handle Disconnect
  socket.on('disconnect', () => {
    handleUserLeave(io, socket);
  });
}

function handleUserLeave(io: Server, socket: Socket) {
  const result = roomService.leaveRoom(socket.id);
  if (result && result.roomId) {
    const { roomId, room, hostChanged, newHost } = result;

    if (room) {
      io.to(roomId).emit('room:user-left', { socketId: socket.id, room });

      if (hostChanged && newHost) {
        io.to(roomId).emit('room:host-changed', { newHost, room });
        console.log(`👑 Host transferred to ${newHost.name} in room ${roomId}`);
      }
    }
  }
}
