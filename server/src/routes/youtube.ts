import { Router, Request, Response } from 'express';
import { youtubeService } from '../services/youtubeService.js';

const router = Router();

router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.json({ results: [] });
      return;
    }

    const results = await youtubeService.searchVideos(query);
    res.json({ results });
  } catch (error: any) {
    console.error('Search router error:', error);
    res.status(500).json({ error: 'Failed to search YouTube' });
  }
});

router.get('/playlist', async (req: Request, res: Response): Promise<void> => {
  try {
    const urlOrId = (req.query.url as string) || (req.query.id as string) || '';
    if (!urlOrId.trim()) {
      res.status(400).json({ error: 'Playlist URL or ID is required' });
      return;
    }

    const items = await youtubeService.fetchPlaylistItems(urlOrId);
    res.json({ items });
  } catch (error: any) {
    console.error('Playlist router error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch YouTube playlist' });
  }
});

export default router;
