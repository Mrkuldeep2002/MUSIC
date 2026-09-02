import { YouTubeSearchResult, PlaylistItem } from '../types/room';

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

export async function importYouTubePlaylist(playlistUrlOrId: string): Promise<PlaylistItem[]> {
  if (!playlistUrlOrId.trim()) return [];

  try {
    const response = await fetch(`${BACKEND_URL}/api/youtube/playlist?url=${encodeURIComponent(playlistUrlOrId)}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('API YouTube Playlist Import error:', error);
    throw error;
  }
}
