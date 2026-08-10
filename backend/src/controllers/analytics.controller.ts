import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const allowedEvents = [
  'APP_OPEN', 'APP_BACKGROUND', 'SCREEN_VIEW',
  'ONBOARDING_VIEW', 'ONBOARDING_COMPLETE', 'ONBOARDING_SKIP',
  'AUTH_LOGIN', 'AUTH_REGISTER', 'AUTH_LOGOUT',
  'READING_PROGRESS', 'AI_CHAT_OPEN', 'AI_CHAT_MESSAGE',
] as const;

const eventSchema = z.object({
  event: z.enum(allowedEvents),
  installId: z.string().uuid(),
  sessionId: z.string().uuid(),
  platform: z.enum(['ios', 'android', 'web', 'unknown']),
  appVersion: z.string().max(30).optional(),
  screen: z.string().trim().max(80).optional(),
  metadata: z.record(z.string(), z.union([z.string().max(120), z.number(), z.boolean(), z.null()])).optional(),
});

const batchSchema = z.object({ events: z.array(eventSchema).min(1).max(20) });

export const ingestEvents = async (req: Request, res: Response) => {
  try {
    const { events } = batchSchema.parse(req.body);
    const userId = req.user?.userId;
    await prisma.appEvent.createMany({
      data: events.map((event) => ({ ...event, userId })),
    });
    return res.status(202).json({ accepted: events.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid analytics payload', errors: error.issues });
    }
    console.error('[Analytics]:', error);
    return res.status(500).json({ message: 'Analytics could not be recorded' });
  }
};
