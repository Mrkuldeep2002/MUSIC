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

  private filterMockResults(query: string): YouTubeSearchResult[] {
    const q = query.toLowerCase().trim();
    const filtered = MOCK_RESULTS.filter(
      (item) => item.title.toLowerCase().includes(q) || item.channelTitle.toLowerCase().includes(q)
    );
    return filtered.length > 0 ? filtered : MOCK_RESULTS;
  }
}

export const youtubeService = new YouTubeService();
