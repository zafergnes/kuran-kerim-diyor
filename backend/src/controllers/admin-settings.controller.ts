import { GoogleGenAI } from '@google/genai';
import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { SystemSettingsService } from '../services/system-settings.service';

const keySchema = z.object({ apiKey: z.string().trim().min(20).max(200) });

const audit = (req: Request, action: string, details?: Record<string, unknown>) => prisma.adminAudit.create({
  data: { adminUserId: req.user!.userId, action, targetType: 'SystemSetting', targetId: 'GEMINI_API_KEY', details: details as Prisma.InputJsonValue | undefined },
});

async function verifyGeminiKey(apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODERATION_MODEL || 'gemini-3.5-flash-lite',
    contents: 'Return only the word OK.',
    config: { maxOutputTokens: 5, temperature: 0 },
  });
  if (!response.text?.trim()) throw new Error('EMPTY_AI_RESPONSE');
}

export const getAiSettings = async (_req: Request, res: Response) => {
  try {
    return res.json(await SystemSettingsService.getGeminiStatus());
  } catch (error) {
    console.error('[Admin AI Settings]:', error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Settings could not be read' });
  }
};

export const updateAiSettings = async (req: Request, res: Response) => {
  try {
    const { apiKey } = keySchema.parse(req.body);
    await verifyGeminiKey(apiKey);
    await SystemSettingsService.setGeminiApiKey(apiKey, req.user!.userId);
    await audit(req, 'GEMINI_KEY_UPDATED', { lastFour: apiKey.slice(-4) });
    return res.json(await SystemSettingsService.getGeminiStatus());
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid API key format' });
    if (error instanceof Error && error.message === 'SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED') {
      return res.status(503).json({ message: 'Server encryption is not configured' });
    }
    console.error('[Admin AI Settings Update]:', error);
    return res.status(400).json({ message: 'Gemini key could not be verified' });
  }
};

export const testAiSettings = async (_req: Request, res: Response) => {
  try {
    const apiKey = await SystemSettingsService.getGeminiApiKey();
    if (!apiKey) return res.status(409).json({ message: 'Gemini key is not configured' });
    await verifyGeminiKey(apiKey);
    return res.json({ ok: true });
  } catch (error) {
    console.error('[Admin AI Settings Test]:', error);
    return res.status(400).json({ message: 'Gemini connection test failed' });
  }
};

export const deleteAiSettings = async (req: Request, res: Response) => {
  try {
    await SystemSettingsService.removeGeminiApiKey();
    await audit(req, 'GEMINI_KEY_REMOVED');
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Gemini key could not be removed' });
  }
};
