import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root .env or server .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
};
