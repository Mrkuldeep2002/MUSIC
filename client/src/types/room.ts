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
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export interface PlaybackState {
  videoId: string | null;
  currentTrack?: PlaylistItem | null;
  isPlaying: boolean;
  position: number;
  updatedAt: number;
}

export interface RoomState {
  roomId: string;
  hostId: string;
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
