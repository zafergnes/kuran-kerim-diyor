import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { VerseChatService, verseChatRequestSchema } from '../services/verse-chat.service';

const feedbackSchema = z.object({
  responseId: z.string().uuid(),
  surahNumber: z.number().int().min(1).max(114),
  ayahNumber: z.number().int().min(1).max(286),
  reason: z.enum(['INACCURATE', 'OFFENSIVE', 'UNSAFE', 'UNSOURCED', 'OTHER']),
  details: z.string().trim().max(500).optional(),
});

export const discussVerse = async (req: Request, res: Response) => {
  try {
    const input = verseChatRequestSchema.parse(req.body);
    const result = await VerseChatService.discuss(input);
    return res.json({ id: randomUUID(), ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request', errors: error.issues });
    }
    if (error instanceof Error && error.message === 'AI_SERVICE_NOT_CONFIGURED') {
      return res.status(503).json({ message: 'AI service is not configured' });
    }
    console.error('[Verse Chat]:', error);
    return res.status(502).json({ message: 'AI response could not be generated' });
  }
};

export const reportVerseChat = async (req: Request, res: Response) => {
  try {
    const input = feedbackSchema.parse(req.body);
    await prisma.aiFeedback.upsert({
      where: { responseId: input.responseId },
      create: { ...input, userId: req.user?.userId },
      update: { reason: input.reason, details: input.details, userId: req.user?.userId },
    });
    return res.status(201).json({ message: 'Feedback received' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid feedback', errors: error.issues });
    }
    console.error('[Verse Chat Feedback]:', error);
    return res.status(500).json({ message: 'Feedback could not be saved' });
  }
};
