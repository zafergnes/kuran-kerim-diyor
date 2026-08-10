import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const reportSchema = z.object({
  commentId: z.number().int(),
  reason: z.string().min(1).max(500)
});

export const reportComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { isGuest } = req.user!;

    if (isGuest) {
      return res.status(403).json({ message: 'Guests cannot report comments' });
    }

    const data = reportSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // SHADOW BAN LOGIC: If the user has 3 or more invalid reports, fake the success
    if (user && user.invalidReportCount >= 3) {
      return res.status(200).json({ message: 'Şikayetiniz değerlendirilmek üzere alındı.' });
    }

    const comment = await prisma.comment.findUnique({ where: { id: data.commentId } });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if already reported
    const existingReport = await prisma.report.findUnique({
      where: { userId_commentId: { userId, commentId: data.commentId } }
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this comment' });
    }

    const report = await prisma.report.create({
      data: {
        userId,
        commentId: data.commentId,
        reason: data.reason
      }
    });

    // TODO: Trigger Discord/Telegram webhook here in the future
    // e.g. sendToDiscord(report, comment.text)

    res.status(201).json({ message: 'Şikayetiniz başarıyla iletildi.' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: error.issues });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markReportInvalid = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id as string);

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Increment invalidReportCount for the user who made the report
    await prisma.user.update({
      where: { id: report.userId },
      data: { invalidReportCount: { increment: 1 } }
    });

    // Delete the report so it's resolved
    await prisma.report.delete({ where: { id: reportId } });

    res.json({ message: 'Report marked as invalid and user penalized' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
