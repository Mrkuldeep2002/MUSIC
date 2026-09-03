import axios from 'axios';
import { config } from '../config.js';
import { YouTubeSearchResult, PlaylistItem } from '../types/room.js';

// Curated high quality mock search fallback list (Complete 25 Songs from Dhurandhar 1 & Dhurandhar The Revenge Official YouTube Music Playlists)
const MOCK_RESULTS: YouTubeSearchResult[] = [
  // Dhurandhar 1 (Album 1)
  {
    videoId: 'WzoSWtDDo1M',
    title: 'Dhurandhar - Title Track',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/WzoSWtDDo1M/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: '_dV23pgH3Ng',
    title: 'Ishq Jalakar - Karvaan (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/_dV23pgH3Ng/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: '-_1sK2TGKBE',
    title: 'Gehra Hua (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/-_1sK2TGKBE/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'DbrnTlzo3rE',
    title: 'Teri Ni Kararan (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/DbrnTlzo3rE/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'IGtIUhNprbk',
    title: 'Run Down The City - Monica (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/IGtIUhNprbk/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'Jxueyl2VMEI',
    title: 'Shararat (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/Jxueyl2VMEI/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'DgdqPbV2fps',
    title: 'Ez-Ez (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/DgdqPbV2fps/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: '84Lc9SYzGSM',
    title: 'Lutt Le Gaya (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/84Lc9SYzGSM/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'CFM3r9TEKXc',
    title: 'Move - Yeh Ishq Ishq (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/CFM3r9TEKXc/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'hzXex0AwK24',
    title: 'Naal Nachna (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/hzXex0AwK24/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'IfJel-as0cg',
    title: 'Ramba Ho (Dhurandhar 1)',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/IfJel-as0cg/hqdefault.jpg',
    duration: '3:30',
  },
  // Dhurandhar 2 (The Revenge)
  {
    videoId: 'x3_DlgoOXrQ',
    title: 'Dhurandhar The Revenge - Aari Aari',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/x3_DlgoOXrQ/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: '0o1tpI7jRsE',
    title: 'Main Aur Tu (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/0o1tpI7jRsE/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'Cc5oZAR4E6Y',
    title: 'Jaan Se Guzarte Hain (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/Cc5oZAR4E6Y/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'BS8il9QTp6c',
    title: 'Aakhri Ishq (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/BS8il9QTp6c/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'N0CsVUst5Ug',
    title: 'Wild Ride (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/N0CsVUst5Ug/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'BuQgRwVJglY',
    title: 'Vaari Jaavan (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/BuQgRwVJglY/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'K7oVZub2KmM',
    title: 'Phir Se (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/K7oVZub2KmM/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'C7xkqKq9Z14',
    title: 'Didi (Sher-E-Baloch) (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/C7xkqKq9Z14/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'siIClkiNHDg',
    title: 'Destiny - Mann Atkeya (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/siIClkiNHDg/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'gw1z1d4QpWs',
    title: 'Rang De Lal (Oye Oye) (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/gw1z1d4QpWs/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'MeG-pMSwRsA',
    title: 'Jaiye Sajana (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/MeG-pMSwRsA/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: '4hXiom9gnhw',
    title: 'Tere Ishq Ne (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/4hXiom9gnhw/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: 'WOrvX3cZj4I',
    title: 'Hum Pyaar Karne Wale (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/WOrvX3cZj4I/hqdefault.jpg',
    duration: '3:30',
  },
  {
    videoId: '-dEfIgb8mp8',
    title: 'Kanhaiyya (From "Dhurandhar The Revenge")',
    channelTitle: 'Shashwat Sachdev',
    thumbnailUrl: 'https://i.ytimg.com/vi/-dEfIgb8mp8/hqdefault.jpg',
    duration: '3:30',
  },
];

export class YouTubeService {
  public async searchVideos(query: string): Promise<YouTubeSearchResult[]> {
    if (!query || !query.trim()) {
      return [];
    }

    const apiKey = config.youtubeApiKey;

    if (!apiKey) {
      console.log('ℹ️ YOUTUBE_API_KEY not configured. Returning curated Dhurandhar mock results.');
      return this.filterMockResults(query);
    }

    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          videoEmbeddable: 'true', // Only return videos allowed for embedded players
          videoCategoryId: '10', // Music category preferred
          maxResults: 12,
          key: apiKey,
        },
        timeout: 5000,
      });

      const items = response.data.items || [];
      return items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      }));
    } catch (error: any) {
      console.warn('⚠️ YouTube Data API error or quota limit reached. Falling back to Dhurandhar mock results:', error.message);
      return this.filterMockResults(query);
    }
  }

  public async getRelatedTrack(currentTrack: PlaylistItem): Promise<PlaylistItem | null> {
    if (!currentTrack) return null;

    try {
      const searchQuery = currentTrack.channelTitle || currentTrack.title.split('-')[0] || currentTrack.title;
      const results = await this.searchVideos(`${searchQuery} song`);

      const candidate = results.find((r) => r.videoId !== currentTrack.videoId) || results[0];

      if (!candidate || candidate.videoId === currentTrack.videoId) {
        const otherMock = MOCK_RESULTS.find((m) => m.videoId !== currentTrack.videoId) || MOCK_RESULTS[0];
        return {
          id: `autoplay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          videoId: otherMock.videoId,
          title: otherMock.title,
          channelTitle: otherMock.channelTitle,
          thumbnailUrl: otherMock.thumbnailUrl,
          duration: otherMock.duration,
          addedBy: 'autoplay',
        };
      }

      return {
        id: `autoplay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        videoId: candidate.videoId,
        title: candidate.title,
        channelTitle: candidate.channelTitle,
        thumbnailUrl: candidate.thumbnailUrl,
        duration: candidate.duration,
        addedBy: 'autoplay',
      };
    } catch (err) {
      console.warn('Failed to fetch related track, using fallback:', err);
      const otherMock = MOCK_RESULTS.find((m) => m.videoId !== currentTrack.videoId) || MOCK_RESULTS[0];
      return {
        id: `autoplay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        videoId: otherMock.videoId,
        title: otherMock.title,
        channelTitle: otherMock.channelTitle,
        thumbnailUrl: otherMock.thumbnailUrl,
        duration: otherMock.duration,
        addedBy: 'autoplay',
      };
    }
  }

  public extractVideoId(input: string): string | null {
    if (!input || !input.trim()) return null;
    const trimmed = input.trim();

    // Match query parameter v=
    const vMatch = trimmed.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (vMatch && vMatch[1]) {
      return vMatch[1];
    }

    // Match short url format https://youtu.be/VIDEO_ID
    const shortMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (shortMatch && shortMatch[1]) {
      return shortMatch[1];
    }

    // Match embed url format https://www.youtube.com/embed/VIDEO_ID
    const embedMatch = trimmed.match(/\/embed\/([A-Za-z0-9_-]{11})/);
    if (embedMatch && embedMatch[1]) {
      return embedMatch[1];
    }

    return null;
  }

  public async fetchSingleVideoItem(videoId: string): Promise<PlaylistItem> {
    const apiKey = config.youtubeApiKey;

    if (apiKey) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            part: 'snippet',
            id: videoId,
            key: apiKey,
          },
          timeout: 5000,
        });

        const item = response.data.items?.[0];
        if (item && item.snippet) {
          return {
            id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            videoId: item.id,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle || 'YouTube Music',
            thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            duration: '3:30',
            addedBy: 'user-link',
          };
        }
      } catch (err) {
        console.warn('Failed to fetch video details, using clean default title:', err);
      }
    }

    // Default fast zero-quota fallback if API key is omitted or error occurs
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoId: videoId,
      title: `YouTube Song (${videoId})`,
      channelTitle: 'YouTube Music',
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: '3:30',
      addedBy: 'user-link',
    };
  }

  public async fetchUniversalMedia(input: string): Promise<PlaylistItem[]> {
    if (!input || !input.trim()) return [];

    // Check if input is a Single Video link
    const videoId = this.extractVideoId(input);
    if (videoId) {
      const singleItem = await this.fetchSingleVideoItem(videoId);
      return [singleItem];
    }

    // Check if input is a Playlist link or ID
    const playlistId = this.extractPlaylistId(input);
    if (playlistId) {
      return this.fetchPlaylistItems(input);
    }

    // Otherwise treat input as a query search and return top matching track
    const searchResults = await this.searchVideos(input);
    if (searchResults && searchResults.length > 0) {
      const topMatch = searchResults[0];
      return [
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          videoId: topMatch.videoId,
          title: topMatch.title,
          channelTitle: topMatch.channelTitle,
          thumbnailUrl: topMatch.thumbnailUrl,
          duration: topMatch.duration,
          addedBy: 'search',
        },
      ];
    }

    throw new Error('No matching music, video, or playlist found.');
  }

  public extractPlaylistId(input: string): string | null {
    if (!input || !input.trim()) return null;
    const trimmed = input.trim();

    // Match query parameter list=
    const match = trimmed.match(/[?&]list=([^&]+)/);
    if (match && match[1]) {
      return match[1];
    }

    // Match /playlist?list= or /browse/VL...
    const pathMatch = trimmed.match(/\/playlist\?list=([^&]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    // Raw Playlist ID string (e.g. PL..., RD..., OL...)
    if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes('/')) {
      return trimmed;
    }

    return null;
  }

  public async fetchPlaylistItems(playlistUrlOrId: string): Promise<PlaylistItem[]> {
    const playlistId = this.extractPlaylistId(playlistUrlOrId);
    if (!playlistId) {
      throw new Error('Invalid YouTube or YouTube Music playlist link/ID');
    }

    const apiKey = config.youtubeApiKey;

    if (!apiKey) {
      console.log('ℹ️ YOUTUBE_API_KEY not configured. Returning curated mock playlist items.');
      return this.getMockPlaylistItems();
    }

    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: {
          part: 'snippet',
          playlistId: playlistId,
          maxResults: 50,
          key: apiKey,
        },
        timeout: 6000,
      });

      const items = response.data.items || [];
      const playlistItems: PlaylistItem[] = items
        .filter((item: any) => item.snippet && item.snippet.resourceId && item.snippet.resourceId.videoId)
        .map((item: any, index: number) => ({
          id: `item-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
          videoId: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          channelTitle: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || 'YouTube Music',
          thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
          duration: '3:30',
          addedBy: 'playlist',
        }));

      if (playlistItems.length === 0) {
        return this.getMockPlaylistItems();
      }

      return playlistItems;
    } catch (error: any) {
      console.warn('⚠️ Failed to fetch YouTube playlist from API. Falling back to mock playlist:', error.message);
      return this.getMockPlaylistItems();
    }
  }

  private getMockPlaylistItems(): PlaylistItem[] {
    return MOCK_RESULTS.map((item, index) => ({
      id: `item-mock-${Date.now()}-${index}`,
      videoId: item.videoId,
      title: item.title,
      channelTitle: item.channelTitle,
      thumbnailUrl: item.thumbnailUrl,
      duration: item.duration,
      addedBy: 'playlist',
    }));
  }

  private filterMockResults(query: string): YouTubeSearchResult[] {
    const q = query.toLowerCase().trim();
    const filtered = MOCK_RESULTS.filter(
      (item) => item.title.toLowerCase().includes(q) || item.channelTitle.toLowerCase().includes(q)
    );
    return filtered.length > 0 ? filtered : MOCK_RESULTS;
  }
}

export const youtubeService = new YouTubeService();
