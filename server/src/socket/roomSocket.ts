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
  socket.on('room:join', (payload: { roomId: string; userName?: string; name?: string }) => {
    try {
      const roomId = payload?.roomId?.toUpperCase();
      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      const userName = payload?.userName || payload?.name;
      const result = roomService.joinRoom(roomId, socket.id, userName);
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

  // Playback controls: Play
  socket.on('player:play', (payload: { roomId: string; position?: number }) => {
    const { roomId, position } = payload || {};
    if (!roomId) return;

    if (!roomService.canControlPlayback(roomId, socket.id)) {
      socket.emit('error', { message: 'You do not have permission to control playback' });
      return;
    }

    const updatedRoom = roomService.updatePlayback(roomId, socket.id, 'play', { position });
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('player:state', { playback: updatedRoom.playback, roomId: updatedRoom.roomId });
    }
  });

  // Playback controls: Pause
  socket.on('player:pause', (payload: { roomId: string; position?: number }) => {
    const { roomId, position } = payload || {};
    if (!roomId) return;

    if (!roomService.canControlPlayback(roomId, socket.id)) {
      socket.emit('error', { message: 'You do not have permission to control playback' });
      return;
    }

    const updatedRoom = roomService.updatePlayback(roomId, socket.id, 'pause', { position });
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('player:state', { playback: updatedRoom.playback, roomId: updatedRoom.roomId });
    }
  });

  // Playback controls: Seek
  socket.on('player:seek', (payload: { roomId: string; position: number }) => {
    const { roomId, position } = payload || {};
    if (!roomId || position === undefined) return;

    if (!roomService.canControlPlayback(roomId, socket.id)) {
      socket.emit('error', { message: 'You do not have permission to seek' });
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

    if (!roomService.canControlPlayback(roomId, socket.id)) {
      socket.emit('error', { message: 'You do not have permission to change tracks' });
      return;
    }

    const updatedRoom = roomService.updatePlayback(roomId, socket.id, 'change-video', { videoId, track });
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('player:video-changed', { videoId, track: updatedRoom.playback.currentTrack });
      io.to(updatedRoom.roomId).emit('player:state', { playback: updatedRoom.playback, roomId: updatedRoom.roomId });
    }
  });

  // Toggle Guest Controls Permission
  socket.on('room:toggle-guest-controls', (payload: { roomId: string; allow: boolean }) => {
    const { roomId, allow } = payload || {};
    if (!roomId || allow === undefined) return;

    if (!roomService.isHost(roomId, socket.id)) {
      socket.emit('error', { message: 'Only the host can change permissions' });
      return;
    }

    const updatedRoom = roomService.toggleGuestControls(roomId, socket.id, allow);
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('room:updated', { room: updatedRoom });
    }
  });

  // Toggle Smart Autoplay
  socket.on('room:toggle-autoplay', (payload: { roomId: string; enabled: boolean }) => {
    const { roomId, enabled } = payload || {};
    if (!roomId || enabled === undefined) return;

    if (!roomService.isHost(roomId, socket.id)) {
      socket.emit('error', { message: 'Only the host can toggle autoplay' });
      return;
    }

    const updatedRoom = roomService.toggleAutoplay(roomId, socket.id, enabled);
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('room:updated', { room: updatedRoom });
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

  // Queue: Import playlist
  socket.on('queue:import-playlist', (payload: { roomId: string; tracks: PlaylistItem[] }) => {
    const { roomId, tracks } = payload || {};
    if (!roomId || !tracks || tracks.length === 0) return;

    // Attach user ID who added these tracks
    tracks.forEach((t) => {
      t.addedBy = socket.id;
    });

    const updatedRoom = roomService.importPlaylistToQueue(roomId, tracks);
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

  // Queue: Reorder track position
  socket.on('queue:reorder', (payload: { roomId: string; fromIndex: number; toIndex: number }) => {
    const { roomId, fromIndex, toIndex } = payload || {};
    if (!roomId || fromIndex === undefined || toIndex === undefined) return;

    const updatedRoom = roomService.reorderQueue(roomId, socket.id, fromIndex, toIndex);
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('queue:updated', { queue: updatedRoom.queue, roomId: updatedRoom.roomId });
    }
  });

  // Queue: Smart Shuffle
  socket.on('queue:shuffle', async (payload: { roomId: string }) => {
    const { roomId } = payload || {};
    if (!roomId) return;

    if (!roomService.canControlPlayback(roomId, socket.id)) {
      socket.emit('error', { message: 'You do not have permission to shuffle the queue' });
      return;
    }

    const updatedRoom = await roomService.shuffleQueue(roomId);
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('queue:updated', { queue: updatedRoom.queue, roomId: updatedRoom.roomId });
    }
  });

  // Queue: Clear Queue
  socket.on('queue:clear', (payload: { roomId: string }) => {
    const { roomId } = payload || {};
    if (!roomId) return;

    if (!roomService.canControlPlayback(roomId, socket.id)) {
      socket.emit('error', { message: 'You do not have permission to clear the queue' });
      return;
    }

    const updatedRoom = roomService.clearQueue(roomId, socket.id);
    if (updatedRoom) {
      io.to(updatedRoom.roomId).emit('queue:updated', { queue: updatedRoom.queue, roomId: updatedRoom.roomId });
    }
  });

  // Queue: Skip / Next track
  socket.on('queue:next', async (payload: { roomId: string }) => {
    const { roomId } = payload || {};
    if (!roomId) return;

    if (!roomService.canControlPlayback(roomId, socket.id)) {
      socket.emit('error', { message: 'You do not have permission to skip tracks' });
      return;
    }

    const updatedRoom = await roomService.nextTrack(roomId, socket.id);
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
