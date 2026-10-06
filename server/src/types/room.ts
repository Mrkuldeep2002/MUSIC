export interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
  addedBy: string;
}

export interface RoomUser {
  id: string; // Socket ID or session ID
  userId?: string; // Persistent client ID from localStorage
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export interface PlaybackState {
  videoId: string | null;
  currentTrack?: PlaylistItem | null;
  isPlaying: boolean;
  position: number; // in seconds
  updatedAt: number; // server timestamp in ms
}

export interface RoomState {
  roomId: string;
  hostId: string;
  hostUserId?: string; // Persistent userId of the host
  playback: PlaybackState;
  queue: PlaylistItem[];
  users: RoomUser[];
  allowGuestControls?: boolean;
  autoplayEnabled?: boolean;
  messages?: ChatMessage[];
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  isHost: boolean;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
}
