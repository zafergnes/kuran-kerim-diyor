import { Request, Response } from 'express';
import { HadithService, normalizeHadithLanguage } from '../services/hadith.service';

export const getDailyHadith = (req: Request, res: Response) => {
  try {
    const lang = normalizeHadithLanguage(req.query.lang);
    const timeZone = typeof req.query.tz === 'string' ? req.query.tz.slice(0, 100) : undefined;
    res.json(HadithService.present(HadithService.getDaily(timeZone), lang));
  } catch (error) {
    console.error('GET /api/hadith/daily error:', error);
    res.status(500).json({ error: 'Daily hadith unavailable' });
  }
};

export const getHadithById = (req: Request, res: Response) => {
  try {
    const hadith = HadithService.getById(String(req.params.id));
    if (!hadith) return res.status(404).json({ error: 'Hadith not found' });
    res.json(HadithService.present(hadith, normalizeHadithLanguage(req.query.lang)));
  } catch (error) {
    console.error('GET /api/hadith/:id error:', error);
    res.status(500).json({ error: 'Hadith unavailable' });
  }
};
