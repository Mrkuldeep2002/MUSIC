# SyncTune 🎧 - Real-Time Synchronized YouTube Music Listening

SyncTune is a production-quality, real-time synchronized music room application built with React, Vite, TypeScript, Tailwind CSS, Node.js, Express, Socket.IO, and the official YouTube IFrame Player API.

---

## 🌟 Key Features

- 🎧 **Listen Together in Real-Time**: Multiple users can join the same room and hear/watch YouTube music in near real-time synchronization.
- ⚡ **Sub-Second Frame Synchronization**: Authoritative server timestamps track playback position and calculate expected offsets `expectedPosition = position + (currentTime - updatedAt) / 1000`. Drift compensation resyncs playback smoothly without micro-stuttering.
- 👑 **Host Authorization System**: The room creator is designated as host with exclusive rights to play, pause, seek, change tracks, and skip. If the host leaves, host rights automatically transfer to the next connected member.
- 🔍 **In-App YouTube Song Search**: Search YouTube songs directly within the app using YouTube Data API v3, with a built-in mock fallback for testing without an API key.
- 📜 **Music Queue**: Host and guests can add tracks to the queue. Songs transition automatically when the current track ends.
- 💬 **Real-Time Room Chat**: In-room chat with user badges, system notifications, length validation, and anti-spam rate limiting.
- 🔄 **State Recovery & Reconnection**: Refreshing the browser window automatically rejoins the room and restores playback state, position, queue, and user list.
- 🎨 **Modern Dark Aesthetic**: Sleek glassmorphism UI, responsive layouts, toast notifications, and custom dark mode components.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS + Custom CSS Glassmorphism
- **Icons**: Lucide React
- **Player**: Official YouTube IFrame Player API

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Real-time Protocol**: Socket.IO
- **HTTP Client**: Axios (YouTube Data API v3 queries)

---

## 📁 Project Architecture

```
MUSIC/
├── package.json               # Monorepo workspace runner (concurrently)
├── .env.example               # Environment variables schema
├── README.md                  # System documentation & setup guide
├── server/
│   ├── src/
│   │   ├── index.ts           # Express & Socket.IO server entry
│   │   ├── config.ts          # Config loader
│   │   ├── types/room.ts      # Shared TypeScript data models
│   │   ├── services/
│   │   │   ├── roomService.ts # In-memory room store & drift math
│   │   │   └── youtubeService.ts # YouTube API & mock fallback
│   │   ├── socket/
│   │   │   ├── roomSocket.ts  # Room, playback & queue socket events
│   │   │   └── chatSocket.ts  # Chat socket event handler
│   │   └── routes/youtube.ts  # GET /api/youtube/search endpoint
│   └── tests/
│       └── roomService.test.ts # Vitest suite for server logic
└── client/
    ├── src/
    │   ├── App.tsx            # Main application router/view switcher
    │   ├── hooks/
    │   │   ├── useSocket.ts   # Socket connection manager
    │   │   ├── useYouTubePlayer.ts # IFrame player & resync engine
    │   │   └── useRoom.ts     # Room state & actions hook
    │   ├── components/
    │   │   ├── Header.tsx     # Top navbar & invite link generator
    │   │   ├── YouTubePlayer.tsx # Aspect-ratio player & sync overlay
    │   │   ├── PlayerControls.tsx # Host play/pause/seek controls
    │   │   ├── Queue.tsx      # Music queue (Now Playing + Up Next)
    │   │   ├── SearchBar.tsx  # Debounced YouTube search input
    │   │   ├── SearchResults.tsx # Grid of song search results
    │   │   ├── RoomUsers.tsx  # Connected listeners & host crown
    │   │   ├── Chat.tsx       # Real-time room chat
    │   │   └── Toast.tsx      # Toast notifications
    │   ├── pages/
    │   │   ├── Home.tsx       # Landing page & room creator/joiner
    │   │   └── Room.tsx       # Interactive room dashboard
    │   └── services/api.ts    # API client wrapper
```

---

## 🔑 YouTube Data API Key Setup (Optional for Testing)

The application includes a built-in mock fallback engine. If `YOUTUBE_API_KEY` is omitted, the app will return curated popular tracks for search testing.

To enable live YouTube search results:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and navigate to **APIs & Services** > **Library**.
3. Search for **YouTube Data API v3** and click **Enable**.
4. Navigate to **APIs & Services** > **Credentials** and click **Create Credentials** > **API Key**.
5. Copy the generated API Key and place it in `.env`:

```env
YOUTUBE_API_KEY=your_actual_youtube_api_key_here
PORT=3001
CLIENT_URL=http://localhost:5173
```

---

## 🚀 Quick Start & Local Development

### 1. Install Dependencies
Run the install command from the project root:

```bash
npm run install:all
```

*(Or run `npm install` inside both `server/` and `client/` directories)*

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Run Development Servers
Start both backend (Port 3001) and frontend (Port 5173) concurrently:

```bash
npm run dev
```

Open your browser to: **http://localhost:5173**

---

## 🧪 Running Unit Tests

Run server unit tests covering room creation, host authority, position drift, host migration, and queue logic:

```bash
npm test
```

---

## 🏗️ Production Build

To compile TypeScript and bundle frontend assets for production:

```bash
npm run build
```

Start the production server:

```bash
cd server && npm start
```

---

## 📡 Socket.IO Schema Reference

### Client -> Server Events
| Event | Payload | Description |
| :--- | :--- | :--- |
| `room:create` | `{ userName?: string }` | Request creation of a new room |
| `room:join` | `{ roomId: string, userName?: string }` | Join an existing room |
| `room:leave` | None | Leave current room |
| `player:play` | `{ roomId: string, position?: number }` | [Host Only] Start playback |
| `player:pause` | `{ roomId: string, position?: number }` | [Host Only] Pause playback |
| `player:seek` | `{ roomId: string, position: number }` | [Host Only] Seek to timestamp |
| `player:change-video` | `{ roomId: string, videoId: string, track?: PlaylistItem }` | [Host Only] Load new video |
| `queue:add` | `{ roomId: string, track: PlaylistItem }` | Add track to room queue |
| `queue:remove` | `{ roomId: string, trackId: string }` | Remove track from queue |
| `queue:next` | `{ roomId: string }` | [Host Only] Skip to next track |
| `chat:send` | `{ roomId: string, message: string }` | Send chat message |

### Server -> Client Events
| Event | Payload | Description |
| :--- | :--- | :--- |
| `room:created` | `{ room: RoomState, user: RoomUser }` | Emitted to room creator |
| `room:joined` | `{ room: RoomState, user: RoomUser }` | Emitted to joining user |
| `room:user-joined` | `{ user: RoomUser, room: RoomState }` | Broadcasted when a new user joins |
| `room:user-left` | `{ socketId: string, room: RoomState }` | Broadcasted when a user disconnects |
| `room:host-changed` | `{ newHost: RoomUser, room: RoomState }` | Emitted when host changes |
| `player:state` | `{ playback: PlaybackState, roomId: string }` | Authoritative playback state update |
| `player:video-changed` | `{ videoId: string, track: PlaylistItem }` | Video changed notification |
| `queue:updated` | `{ queue: PlaylistItem[], roomId: string }` | Queue updated notification |
| `chat:message` | `ChatMessage` | Broadcasted chat message |
| `error` | `{ message: string }` | Error feedback notification |

---

## 📜 YouTube Compliance Notice

SyncTune strictly uses YouTube's official supported IFrame Player API. The application does **NOT**:
- Download YouTube audio or video files.
- Extract or proxy media URLs or convert videos to MP3.
- Bypass YouTube restrictions, advertisements, or player controls.
- Provide unauthorized background or audio-only playback.
