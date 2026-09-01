import { describe, it, expect, beforeEach } from 'vitest';
import { RoomService } from '../src/services/roomService.js';

describe('RoomService', () => {
  let roomService: RoomService;

  beforeEach(() => {
    roomService = new RoomService();
  });

  it('should create a new room and assign creator as host', () => {
    const { room, user } = roomService.createRoom('socket-host-1', 'Host User');

    expect(room.roomId).toBeDefined();
    expect(room.roomId).toHaveLength(6);
    expect(room.hostId).toBe('socket-host-1');
    expect(user.isHost).toBe(true);
    expect(user.name).toBe('Host User');
    expect(room.users).toHaveLength(1);
  });

  it('should allow another user to join the room', () => {
    const { room: createdRoom } = roomService.createRoom('socket-host-1', 'Host User');
    const result = roomService.joinRoom(createdRoom.roomId, 'socket-guest-2', 'Guest User');

    expect(result).not.toBeNull();
    expect(result!.user.isHost).toBe(false);
    expect(result!.user.name).toBe('Guest User');
    expect(result!.room.users).toHaveLength(2);
  });

  it('should calculate elapsed playback position accurately when playing', async () => {
    const { room: createdRoom } = roomService.createRoom('socket-host-1', 'Host User');
    
    // Play video at position 10s
    roomService.updatePlayback(createdRoom.roomId, 'socket-host-1', 'play', { position: 10 });

    // Wait 200ms
    await new Promise((resolve) => setTimeout(resolve, 200));

    const state = roomService.getCalculatedRoomState(createdRoom.roomId);
    expect(state!.playback.position).toBeGreaterThanOrEqual(10.15);
    expect(state!.playback.isPlaying).toBe(true);
  });

  it('should enforce host authorization for playback changes', () => {
    const { room: createdRoom } = roomService.createRoom('socket-host-1', 'Host User');
    roomService.joinRoom(createdRoom.roomId, 'socket-guest-2', 'Guest User');

    // Guest tries to pause
    const updatedByGuest = roomService.updatePlayback(createdRoom.roomId, 'socket-guest-2', 'pause', { position: 5 });
    expect(updatedByGuest).toBeNull(); // Rejected

    // Host pauses
    const updatedByHost = roomService.updatePlayback(createdRoom.roomId, 'socket-host-1', 'pause', { position: 5 });
    expect(updatedByHost).not.toBeNull();
    expect(updatedByHost!.playback.isPlaying).toBe(false);
  });

  it('should reassign host when host leaves room', () => {
    const { room: createdRoom } = roomService.createRoom('socket-host-1', 'Host User');
    roomService.joinRoom(createdRoom.roomId, 'socket-guest-2', 'Guest User');

    const leaveResult = roomService.leaveRoom('socket-host-1');
    expect(leaveResult).not.toBeNull();
    expect(leaveResult!.hostChanged).toBe(true);
    expect(leaveResult!.newHost?.id).toBe('socket-guest-2');
    expect(leaveResult!.newHost?.isHost).toBe(true);
  });

  it('should add to queue and auto-play if queue was empty', () => {
    const { room: createdRoom } = roomService.createRoom('socket-host-1', 'Host User');

    const track = {
      id: 'item-1',
      videoId: 'vid-123',
      title: 'Test Song',
      channelTitle: 'Test Artist',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      addedBy: 'socket-host-1',
    };

    const updatedState = roomService.addToQueue(createdRoom.roomId, track);
    expect(updatedState!.playback.videoId).toBe('vid-123');
    expect(updatedState!.playback.isPlaying).toBe(true);
  });
});
