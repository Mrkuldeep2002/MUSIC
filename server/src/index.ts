import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { config } from './config.js';
import youtubeRouter from './routes/youtube.js';
import { setupRoomSocket } from './socket/roomSocket.js';
import { setupChatSocket } from './socket/chatSocket.js';

const app = express();
const httpServer = createServer(app);

// Enable CORS
app.use(
  cors({
    origin: '*', // Allow connections from Vite dev server and mobile clients
    credentials: true,
  })
);

app.use(express.json());

// API Routes
app.use('/api/youtube', youtubeRouter);

// Serve static frontend files from client/dist (Production Single-Server Architecture)
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
app.use(express.static(clientDistPath));

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback non-API routes to index.html for React SPA routing
app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Socket.IO Server Setup
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  setupRoomSocket(io, socket);
  setupChatSocket(io, socket);

  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected (${socket.id}): ${reason}`);
  });
});

httpServer.listen(config.port, () => {
  console.log(`🚀 WeSync Server running on http://localhost:${config.port}`);
});
