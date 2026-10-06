import { RoomState, RoomUser, PlaylistItem, PlaybackState, ChatMessage } from '../types/room.js';
import { youtubeService } from './youtubeService.js';

// Random display name generator for anonymous users
const ADJECTIVES = ['Cool', 'Groovy', 'Sonic', 'Vibrant', 'Cosmic', 'Acoustic', 'Electric', 'Melodic', 'Rhythmic', 'Harmonic'];
const NOUNS = ['Listener', 'Beatmaker', 'Audiophile', 'Melophile', 'VibeSeeker', 'Harmonizer', 'WaveRider', 'DJ', 'Trackhead', 'Tuner'];

function generateRandomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj}${noun}${num}`;
}

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 0, O, 1, I
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class RoomService {
  private rooms: Map<string, RoomState> = new Map();
  private emptyRoomTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  public createRoom(hostSocketId: string, customName?: string, userId?: string): { room: RoomState; user: RoomUser } {
    let roomId = generateRoomId();
    // Ensure uniqueness
    while (this.rooms.has(roomId)) {
      roomId = generateRoomId();
    }

    const userName = customName && customName.trim() ? customName.trim() : `Host ${generateRandomName()}`;
    const persistentUserId = userId || hostSocketId;
    
    const hostUser: RoomUser = {
      id: hostSocketId,
      userId: persistentUserId,
      name: userName,
      isHost: true,
      joinedAt: Date.now(),
    };

    const initialPlayback: PlaybackState = {
      videoId: null,
      currentTrack: null,
      isPlaying: false,
      position: 0,
      updatedAt: Date.now(),
    };

    const roomState: RoomState = {
      roomId,
      hostId: hostSocketId,
      hostUserId: persistentUserId,
      playback: initialPlayback,
      queue: [],
      users: [hostUser],
      allowGuestControls: true,
      autoplayEnabled: false,
      messages: [],
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, roomState);
    return { room: this.getCalculatedRoomState(roomId)!, user: hostUser };
  }

  public getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId.toUpperCase());
  }

  public getCalculatedRoomState(roomId: string): RoomState | undefined {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return undefined;

    const now = Date.now();

    if (room.playback.isPlaying) {
      const elapsedSeconds = (now - room.playback.updatedAt) / 1000;
      room.playback.position = Math.max(0, room.playback.position + elapsedSeconds);
      room.playback.updatedAt = now;
    }

    return {
      ...room,
      playback: {
        ...room.playback,
      },
    };
  }

  public getAllRooms(): RoomState[] {
    return Array.from(this.rooms.values());
  }


  public joinRoom(
    roomId: string, 
    socketId: string, 
    customName?: string, 
    userId?: string
  ): { room: RoomState; user: RoomUser; isReconnect?: boolean } | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    // Clear empty room deletion timeout if user reconnected within grace period (e.g. browser refresh)
    if (this.emptyRoomTimeouts.has(room.roomId)) {
      console.log(`✅ User reconnected to empty room ${room.roomId} within grace period. Cancelling deletion timer.`);
      clearTimeout(this.emptyRoomTimeouts.get(room.roomId)!);
      this.emptyRoomTimeouts.delete(room.roomId);
    }

    // Cancel any pending disconnect grace timer for this user
    if (userId) {
      const timerKey = `${room.roomId}:${userId}`;
      if (this.disconnectTimers.has(timerKey)) {
        console.log(`⏱️ Cancelled disconnect timer for user ${userId} in room ${room.roomId}`);
        clearTimeout(this.disconnectTimers.get(timerKey)!);
        this.disconnectTimers.delete(timerKey);
      }
    }

    // Check if this user is already in the room (by matching userId or socketId)
    let user = room.users.find((u) => (userId && u.userId === userId) || u.id === socketId);

    if (user) {
      // Reconnecting existing user (e.g. page refresh, network reconnect)
      console.log(`🔄 User ${user.name} (${user.userId || user.id}) reconnected with socket ${socketId}`);
      user.id = socketId;
      if (userId) user.userId = userId;
      if (customName && customName.trim()) {
        user.name = customName.trim();
      }

      // If this user is the room's host, retain host role and update hostId to new socket
      const isOriginalHost = (userId && room.hostUserId === userId) || user.isHost || room.users.length === 1;
      if (isOriginalHost) {
        user.isHost = true;
        room.hostId = socketId;
        if (userId) room.hostUserId = userId;
        // Ensure no other user is marked host
        room.users.forEach((u) => {
          if (u.id !== socketId) u.isHost = false;
        });
      }

      return { room: this.getCalculatedRoomState(room.roomId)!, user, isReconnect: true };
    }

    // Brand new user joining
    const userName = customName && customName.trim() ? customName.trim() : generateRandomName();
    const isOriginalHost = (userId && room.hostUserId === userId) || room.users.length === 0;

    user = {
      id: socketId,
      userId: userId || socketId,
      name: userName,
      isHost: isOriginalHost,
      joinedAt: Date.now(),
    };
    room.users.push(user);

    if (isOriginalHost) {
      room.hostId = socketId;
      if (userId) room.hostUserId = userId;
      room.users.forEach((u) => {
        if (u.id !== socketId) u.isHost = false;
      });
    }

    return { room: this.getCalculatedRoomState(room.roomId)!, user, isReconnect: false };
  }

  public updateUserName(roomId: string, socketId: string, newName: string): { room: RoomState; user: RoomUser } | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    const user = room.users.find((u) => u.id === socketId);
    if (!user) return null;

    const trimmed = newName.trim();
    if (!trimmed) return null;

    const oldName = user.name;
    user.name = trimmed;

    // Send system notification in room chat if name changed
    if (oldName !== trimmed) {
      if (!room.messages) room.messages = [];
      room.messages.push({
        id: `sys-${Date.now()}`,
        roomId: room.roomId,
        senderId: 'system',
        senderName: 'System',
        isHost: false,
        message: `${oldName} changed their name to ${trimmed} ✏️`,
        timestamp: Date.now(),
        isSystem: true,
      });
    }

    return { room: this.getCalculatedRoomState(room.roomId)!, user };
  }

  public kickUser(roomId: string, hostSocketId: string, targetSocketId: string): { room: RoomState; kickedUser: RoomUser } | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    if (room.hostId !== hostSocketId) return null;
    if (hostSocketId === targetSocketId) return null;

    const userIndex = room.users.findIndex((u) => u.id === targetSocketId);
    if (userIndex === -1) return null;

    const [kickedUser] = room.users.splice(userIndex, 1);

    if (!room.messages) room.messages = [];
    room.messages.push({
      id: `sys-${Date.now()}`,
      roomId: room.roomId,
      senderId: 'system',
      senderName: 'System',
      isHost: false,
      message: `${kickedUser.name} was removed from the room by host 🚫`,
      timestamp: Date.now(),
      isSystem: true,
    });

    return { room: this.getCalculatedRoomState(room.roomId)!, kickedUser };
  }



  /**
   * Explicit leave (e.g. clicking "Leave Room" button).
   * Immediately removes the user and immediately reassigns host if needed.
   */
  public leaveRoom(socketId: string): { roomId: string; room?: RoomState; hostChanged: boolean; newHost?: RoomUser } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      const userIndex = room.users.findIndex((u) => u.id === socketId);
      if (userIndex !== -1) {
        const user = room.users[userIndex];
        
        // Clean up any pending disconnect timer for this user
        if (user.userId) {
          const timerKey = `${roomId}:${user.userId}`;
          if (this.disconnectTimers.has(timerKey)) {
            clearTimeout(this.disconnectTimers.get(timerKey)!);
            this.disconnectTimers.delete(timerKey);
          }
        }

        const isLeavingHost = room.hostId === socketId || user.isHost;
        room.users.splice(userIndex, 1);

        // If room becomes empty, schedule 2-minute Grace Period before deleting
        if (room.users.length === 0) {
          console.log(`⏳ Room ${roomId} is empty. Grace period timer started (2 minutes)...`);
          if (this.emptyRoomTimeouts.has(roomId)) {
            clearTimeout(this.emptyRoomTimeouts.get(roomId)!);
          }
          const timeout = setTimeout(() => {
            console.log(`🗑️ Grace period expired for room ${roomId}. Deleting room.`);
            this.rooms.delete(roomId);
            this.emptyRoomTimeouts.delete(roomId);
          }, 120000); // 2 minutes grace period
          this.emptyRoomTimeouts.set(roomId, timeout);

          return { roomId, hostChanged: false };
        }

        let hostChanged = false;
        let newHost: RoomUser | undefined;

        if (isLeavingHost) {
          // Reassign host to oldest connected user
          newHost = room.users.reduce((oldest, current) => (current.joinedAt < oldest.joinedAt ? current : oldest), room.users[0]);
          room.hostId = newHost.id;
          room.hostUserId = newHost.userId;
          room.users.forEach((u) => {
            u.isHost = u.id === newHost!.id;
          });
          hostChanged = true;
          console.log(`👑 Host transferred to ${newHost.name} in room ${roomId}`);
        }

        return {
          roomId,
          room: this.getCalculatedRoomState(roomId),
          hostChanged,
          newHost,
        };
      }
    }
    return null;
  }

  /**
   * Transport disconnect (e.g. browser page refresh, mobile background/lock, network glitch).
   * Gives a 15-second grace period for the user (host or guest) to reconnect without losing host status or room state!
   */
  public handleDisconnect(
    socketId: string,
    onUserLeft: (roomId: string, disconnectedSocketId: string, room: RoomState, hostChanged: boolean, newHost?: RoomUser) => void
  ): void {
    for (const [roomId, room] of this.rooms.entries()) {
      const user = room.users.find((u) => u.id === socketId);
      if (!user) continue;

      // If room only has 1 user, immediately start the 2-minute empty room grace period
      if (room.users.length === 1) {
        console.log(`⏳ Solo user disconnected from room ${roomId}. Grace period timer started (2 minutes)...`);
        if (this.emptyRoomTimeouts.has(roomId)) {
          clearTimeout(this.emptyRoomTimeouts.get(roomId)!);
        }
        const timeout = setTimeout(() => {
          console.log(`🗑️ Grace period expired for room ${roomId}. Deleting room.`);
          this.rooms.delete(roomId);
          this.emptyRoomTimeouts.delete(roomId);
        }, 120000);
        this.emptyRoomTimeouts.set(roomId, timeout);
        return;
      }

      // Room has other connected users.
      // Give a 15-second grace period for this user (host or guest) to reconnect (e.g. page refresh)
      const timerKey = `${roomId}:${user.userId || socketId}`;
      if (this.disconnectTimers.has(timerKey)) {
        clearTimeout(this.disconnectTimers.get(timerKey)!);
      }

      const isHost = room.hostId === socketId || user.isHost;
      console.log(`⏳ User "${user.name}" (${user.userId || socketId}, isHost: ${isHost}) disconnected from room ${roomId}. Starting 15s reconnection grace period...`);

      const timeout = setTimeout(() => {
        this.disconnectTimers.delete(timerKey);

        const userIndex = room.users.findIndex((u) => (user.userId && u.userId === user.userId) || u.id === socketId);
        if (userIndex === -1) return;

        const userToRemove = room.users[userIndex];
        // If the user reconnected in the meantime with a new socketId, don't remove!
        if (userToRemove.id !== socketId) {
          console.log(`✅ User "${userToRemove.name}" already reconnected with new socket ${userToRemove.id}. Grace period cancelled.`);
          return;
        }

        console.log(`🚪 Reconnection grace period expired for "${userToRemove.name}" in room ${roomId}. Removing user.`);
        room.users.splice(userIndex, 1);

        let hostChanged = false;
        let newHost: RoomUser | undefined;

        if (isHost && room.users.length > 0) {
          newHost = room.users.reduce((oldest, current) => (current.joinedAt < oldest.joinedAt ? current : oldest), room.users[0]);
          room.hostId = newHost.id;
          room.hostUserId = newHost.userId;
          room.users.forEach((u) => {
            u.isHost = u.id === newHost!.id;
          });
          hostChanged = true;
          console.log(`👑 Host transferred to ${newHost.name} in room ${roomId}`);
        }

        const calculatedRoom = this.getCalculatedRoomState(roomId);
        if (calculatedRoom) {
          onUserLeft(roomId, socketId, calculatedRoom, hostChanged, newHost);
        }
      }, 15000); // 15 seconds grace period for page refresh / reconnection

      this.disconnectTimers.set(timerKey, timeout);
      return;
    }
  }

  public isHost(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId.toUpperCase());
    return !!room && room.hostId === socketId;
  }

  public canControlPlayback(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return false;
    return room.hostId === socketId || !!room.allowGuestControls;
  }

  public toggleGuestControls(roomId: string, socketId: string, allow: boolean): RoomState | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room || room.hostId !== socketId) return null;
    room.allowGuestControls = allow;
    return this.getCalculatedRoomState(roomId)!;
  }

  public updatePlayback(
    roomId: string,
    socketId: string,
    action: 'play' | 'pause' | 'seek' | 'change-video',
    payload: { videoId?: string; track?: PlaylistItem; position?: number; isPlaying?: boolean }
  ): RoomState | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    // Enforce host or guest controls authorization for playback state mutation
    if (!this.canControlPlayback(roomId, socketId)) {
      return null;
    }

    const now = Date.now();

    if (action === 'play') {
      const currentPos = payload.position !== undefined ? payload.position : this.getCalculatedRoomState(roomId)!.playback.position;
      room.playback.isPlaying = true;
      room.playback.position = currentPos;
      room.playback.updatedAt = now;
    } else if (action === 'pause') {
      const currentPos = payload.position !== undefined ? payload.position : this.getCalculatedRoomState(roomId)!.playback.position;
      room.playback.isPlaying = false;
      room.playback.position = currentPos;
      room.playback.updatedAt = now;
    } else if (action === 'seek') {
      room.playback.position = payload.position || 0;
      room.playback.updatedAt = now;
    } else if (action === 'change-video') {
      room.playback = {
        videoId: payload.videoId || null,
        currentTrack: payload.track || null,
        isPlaying: true,
        position: 0,
        updatedAt: now,
      };
    }

    return this.getCalculatedRoomState(roomId)!;
  }

  public async shuffleQueue(roomId: string): Promise<RoomState | null> {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room || room.queue.length === 0) return null;

    // Fisher-Yates Shuffle
    const shuffled = [...room.queue];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Try to inject smart recommendation based on currently playing track
    if (room.playback.currentTrack) {
      try {
        const smartTrack = await youtubeService.getRelatedTrack(room.playback.currentTrack);
        if (smartTrack && !shuffled.some((t) => t.videoId === smartTrack.videoId)) {
          shuffled.push(smartTrack);
        }
      } catch (e) {
        // Silently skip if smart recommendation is unavailable
      }
    }

    room.queue = shuffled;
    return this.getCalculatedRoomState(roomId)!;
  }

  public clearQueue(roomId: string, socketId: string): RoomState | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    if (!this.canControlPlayback(roomId, socketId)) {
      return null;
    }

    room.queue = [];
    return this.getCalculatedRoomState(roomId)!;
  }

  public addChatMessage(roomId: string, message: ChatMessage): void {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return;

    if (!room.messages) {
      room.messages = [];
    }

    room.messages.push(message);
    // Keep max 100 recent messages in memory
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }
  }

  public importPlaylistToQueue(roomId: string, tracks: PlaylistItem[]): RoomState | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room || !tracks || tracks.length === 0) return null;

    // Push all tracks into queue
    room.queue.push(...tracks);

    // If nothing is currently playing, start playing the first imported track immediately
    if (!room.playback.videoId && room.queue.length > 0) {
      const nextTrack = room.queue.shift();
      if (nextTrack) {
        room.playback = {
          videoId: nextTrack.videoId,
          currentTrack: nextTrack,
          isPlaying: true,
          position: 0,
          updatedAt: Date.now(),
        };
      }
    }

    return this.getCalculatedRoomState(roomId)!;
  }

  public addToQueue(roomId: string, track: PlaylistItem): RoomState | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    room.queue.push(track);

    // If nothing is currently playing, start playing this track immediately
    if (!room.playback.videoId) {
      const nextTrack = room.queue.shift();
      if (nextTrack) {
        room.playback = {
          videoId: nextTrack.videoId,
          currentTrack: nextTrack,
          isPlaying: true,
          position: 0,
          updatedAt: Date.now(),
        };
      }
    }

    return this.getCalculatedRoomState(roomId)!;
  }

  public reorderQueue(roomId: string, socketId: string, fromIndex: number, toIndex: number): RoomState | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    if (!this.canControlPlayback(roomId, socketId)) {
      return null;
    }

    if (
      fromIndex < 0 ||
      fromIndex >= room.queue.length ||
      toIndex < 0 ||
      toIndex >= room.queue.length ||
      fromIndex === toIndex
    ) {
      return this.getCalculatedRoomState(roomId)!;
    }

    const [movedTrack] = room.queue.splice(fromIndex, 1);
    room.queue.splice(toIndex, 0, movedTrack);

    return this.getCalculatedRoomState(roomId)!;
  }

  public removeFromQueue(roomId: string, socketId: string, trackId: string): RoomState | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    // Host can remove any track, user can remove track they added
    const index = room.queue.findIndex((item) => item.id === trackId);
    if (index !== -1) {
      const item = room.queue[index];
      if (room.hostId === socketId || item.addedBy === socketId) {
        room.queue.splice(index, 1);
      }
    }

    return this.getCalculatedRoomState(roomId)!;
  }

  public toggleAutoplay(roomId: string, socketId: string, enabled: boolean): RoomState | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room || room.hostId !== socketId) return null;
    room.autoplayEnabled = enabled;
    return this.getCalculatedRoomState(roomId)!;
  }

  public async nextTrack(roomId: string, socketId?: string): Promise<RoomState | null> {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    if (socketId && !this.canControlPlayback(roomId, socketId)) {
      return null;
    }

    let nextTrack = room.queue.shift();

    // If queue is empty, autoplay is enabled, and current track exists -> fetch related track automatically!
    if (!nextTrack && room.autoplayEnabled !== false && room.playback.currentTrack) {
      const related = await youtubeService.getRelatedTrack(room.playback.currentTrack);
      if (related) {
        nextTrack = related;
      }
    }

    if (nextTrack) {
      room.playback = {
        videoId: nextTrack.videoId,
        currentTrack: nextTrack,
        isPlaying: true,
        position: 0,
        updatedAt: Date.now(),
      };
    } else {
      room.playback = {
        videoId: null,
        currentTrack: null,
        isPlaying: false,
        position: 0,
        updatedAt: Date.now(),
      };
    }

    return this.getCalculatedRoomState(roomId)!;
  }
}

export const roomService = new RoomService();
