import { createHash, randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const categories = ['TECHNICAL', 'CONTENT_CORRECTION', 'PRIVACY', 'ACCOUNT_DELETION', 'SECURITY', 'OTHER'] as const;
const statuses = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'] as const;
const createSchema = z.object({
  email: z.string().trim().email().max(254).optional().or(z.literal('')).transform((value) => value || undefined),
  category: z.enum(categories),
  message: z.string().trim().min(20).max(3000),
  locale: z.enum(['tr', 'en', 'ar', 'de', 'fr', 'es']).default('tr'),
});
const updateSchema = z.object({ status: z.enum(statuses), adminNote: z.string().trim().max(2000).optional() });
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

export const createSupportRequest = async (req: Request, res: Response) => {
  try {
    const input = createSchema.parse(req.body);
    const accessToken = randomBytes(24).toString('base64url');
    const ticket = await prisma.supportRequest.create({ data: { ...input, accessTokenHash: hash(accessToken) } });
    return res.status(201).json({ id: ticket.id, accessToken, status: ticket.status, createdAt: ticket.createdAt });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid support request', errors: error.issues });
    return res.status(500).json({ message: 'Support request could not be created' });
  }
};

export const getSupportRequestStatus = async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const ticket = await prisma.supportRequest.findUnique({ where: { id: req.params.id as string }, select: { accessTokenHash: true, status: true, adminNote: true, createdAt: true, updatedAt: true } });
  if (!ticket || !token || hash(token) !== ticket.accessTokenHash) return res.status(404).json({ message: 'Support request not found' });
  return res.json({ status: ticket.status, adminNote: ticket.adminNote, createdAt: ticket.createdAt, updatedAt: ticket.updatedAt });
};

export const listSupportRequests = async (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' && statuses.includes(req.query.status as typeof statuses[number]) ? req.query.status : undefined;
  return res.json(await prisma.supportRequest.findMany({ where: status ? { status } : undefined, orderBy: { createdAt: 'desc' }, take: 300, select: { id: true, email: true, category: true, message: true, locale: true, status: true, adminNote: true, createdAt: true, updatedAt: true } }));
};

export const updateSupportRequest = async (req: Request, res: Response) => {
  try {
    const input = updateSchema.parse(req.body);
    const ticket = await prisma.supportRequest.update({ where: { id: req.params.id as string }, data: input });
    await prisma.adminAudit.create({ data: { adminUserId: req.user!.userId, action: 'SUPPORT_REQUEST_UPDATED', targetType: 'SupportRequest', targetId: ticket.id, details: { status: ticket.status } } });
    return res.json(ticket);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid update' });
    return res.status(404).json({ message: 'Support request not found' });
  }
};
