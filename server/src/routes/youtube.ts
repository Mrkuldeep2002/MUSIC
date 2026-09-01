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

export default router;
