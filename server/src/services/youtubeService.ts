import axios from 'axios';
import { config } from '../config.js';
import { YouTubeSearchResult, PlaylistItem } from '../types/room.js';

// Curated high quality mock search fallback list
const MOCK_RESULTS: YouTubeSearchResult[] = [
  {
    videoId: 'BddP6PYo2gs',
    title: 'Kesariya - Brahmāstra | Ranbir Kapoor | Alia Bhatt | Pritam | Arijit Singh | Amitabh B',
    channelTitle: 'Sony Music India',
    thumbnailUrl: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg',
    duration: '4:28',
  },
  {
    videoId: 'RLzC55ai0eo',
    title: 'Heeriye (Official Video) Jasleen Royal ft Arijit Singh | Dulquer Salmaan | Aditya Sharma',
    channelTitle: 'Jasleen Royal',
    thumbnailUrl: 'https://i.ytimg.com/vi/RLzC55ai0eo/hqdefault.jpg',
    duration: '3:15',
  },
  {
    videoId: 'g6fnFALEseU',
    title: 'Apna Bana Le - Bhediya | Varun Dhawan, Kriti Sanon | Sachin-Jigar, Arijit Singh, Amitabh B',
    channelTitle: 'Zee Music Company',
    thumbnailUrl: 'https://i.ytimg.com/vi/g6fnFALEseU/hqdefault.jpg',
    duration: '4:21',
  },
  {
    videoId: 'gJlXRTI4u7U',
    title: 'Anuv Jain - HUSN (Official Video)',
    channelTitle: 'Anuv Jain',
    thumbnailUrl: 'https://i.ytimg.com/vi/gJlXRTI4u7U/hqdefault.jpg',
    duration: '3:38',
  },
  {
    videoId: 'cUM9s-vI3cE',
    title: 'O Maahi (Full Video) Dunki | Shah Rukh Khan | Taapsee | Pritam | Arijit Singh | Javed I',
    channelTitle: 'T-Series',
    thumbnailUrl: 'https://i.ytimg.com/vi/cUM9s-vI3cE/hqdefault.jpg',
    duration: '3:53',
  },
  {
    videoId: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio 📚 - beats to relax/study to',
    channelTitle: 'Lofi Girl',
    thumbnailUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    duration: 'LIVE',
  },
  {
    videoId: '2v8urP5qA9M',
    title: 'Chaleya - Jawan | Shah Rukh Khan | Nayanthara | Atlee | Anirudh | Arijit Singh | Shilpa',
    channelTitle: 'T-Series',
    thumbnailUrl: 'https://i.ytimg.com/vi/2v8urP5qA9M/hqdefault.jpg',
    duration: '3:20',
  },
  {
    videoId: 'T94PHkuydcw',
    title: 'Tauba Tauba | Bad Newz | Vicky Kaushal | Triptii Dimri | Karan Aujla',
    channelTitle: 'Saregama Music',
    thumbnailUrl: 'https://i.ytimg.com/vi/T94PHkuydcw/hqdefault.jpg',
    duration: '3:27',
  },
];

export class YouTubeService {
  public async searchVideos(query: string): Promise<YouTubeSearchResult[]> {
    if (!query || !query.trim()) {
      return [];
    }

    const apiKey = config.youtubeApiKey;

    if (!apiKey) {
      console.log('ℹ️ YOUTUBE_API_KEY not configured. Returning curated mock results.');
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
      console.warn('⚠️ YouTube Data API error or quota limit reached. Falling back to mock results:', error.message);
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
