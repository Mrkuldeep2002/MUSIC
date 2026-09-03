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

  public createRoom(hostSocketId: string, customName?: string): { room: RoomState; user: RoomUser } {
    let roomId = generateRoomId();
    // Ensure uniqueness
    while (this.rooms.has(roomId)) {
      roomId = generateRoomId();
    }

    const userName = customName && customName.trim() ? customName.trim() : `Host ${generateRandomName()}`;
    
    const hostUser: RoomUser = {
      id: hostSocketId,
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

  public joinRoom(roomId: string, socketId: string, customName?: string): { room: RoomState; user: RoomUser } | null {
    const room = this.rooms.get(roomId.toUpperCase());
    if (!room) return null;

    // Clear empty room deletion timeout if user reconnected within grace period (e.g. browser refresh)
    if (this.emptyRoomTimeouts.has(room.roomId)) {
      console.log(`✅ User reconnected to empty room ${room.roomId} within grace period. Cancelling deletion timer.`);
      clearTimeout(this.emptyRoomTimeouts.get(room.roomId)!);
      this.emptyRoomTimeouts.delete(room.roomId);
    }

    // Check if user already in room
    let user = room.users.find((u) => u.id === socketId);
    if (!user) {
      const userName = customName && customName.trim() ? customName.trim() : generateRandomName();
      user = {
        id: socketId,
        name: userName,
        isHost: room.users.length === 0 || room.hostId === socketId,
        joinedAt: Date.now(),
      };
      room.users.push(user);
    }

    if (user.isHost || room.users.length === 1) {
      room.hostId = socketId;
      user.isHost = true;
    }

    return { room: this.getCalculatedRoomState(room.roomId)!, user };
  }

  public leaveRoom(socketId: string): { roomId: string; room?: RoomState; hostChanged: boolean; newHost?: RoomUser } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      const userIndex = room.users.findIndex((u) => u.id === socketId);
      if (userIndex !== -1) {
        const isLeavingHost = room.hostId === socketId;
        room.users.splice(userIndex, 1);

        // If room becomes empty, schedule 2-minute Grace Period before deleting to allow browser refresh recovery
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
          room.users.forEach((u) => {
            u.isHost = u.id === newHost!.id;
          });
          hostChanged = true;
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
