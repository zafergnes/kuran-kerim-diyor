import { Request, Response } from 'express';
import { DailyService } from '../services/daily.service';

export const getDailyContext = async (req: Request, res: Response) => {
  try {
    const lang = (req.query.lang as string) || 'tr';
    const context = await DailyService.getDailyContext(lang);
    res.json(context);
  } catch (error: any) {
    console.error("GET /api/daily-context error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getRandomContext = async (req: Request, res: Response) => {
  try {
    const lang = (req.query.lang as string) || 'tr';
    const category = req.query.category as string;
    
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    const context = await DailyService.getRandomContext(category, lang);
    res.json(context);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getVerseByRef = async (req: Request, res: Response) => {
  try {
    const { surah, ayah } = req.params;
    const lang = (req.query.lang as string) || 'tr';
    const context = await DailyService.getVerseByRef(Number(surah), Number(ayah), lang);
    res.json(context);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
