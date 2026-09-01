import { YouTubeSearchResult } from '../types/room';

const BACKEND_URL = '';

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(`${BACKEND_URL}/api/youtube/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('API YouTube Search error:', error);
    throw error;
  }
}
