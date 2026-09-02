import { RoomState, RoomUser, PlaylistItem, PlaybackState } from '../types/room.js';
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
      allowGuestControls: false,
      autoplayEnabled: true,
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

    if (user.isHost) {
      room.hostId = socketId;
    }

    return { room: this.getCalculatedRoomState(room.roomId)!, user };
  }

  public leaveRoom(socketId: string): { roomId: string; room?: RoomState; hostChanged: boolean; newHost?: RoomUser } | null {
    for (const [roomId, room] of this.rooms.entries()) {
      const userIndex = room.users.findIndex((u) => u.id === socketId);
      if (userIndex !== -1) {
        const isLeavingHost = room.hostId === socketId;
        room.users.splice(userIndex, 1);

        // If room is empty, delete room
        if (room.users.length === 0) {
          this.rooms.delete(roomId);
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
