import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { calculateProductAnalytics } from '../services/product-analytics.service';

const writeAudit = (req: Request, action: string, targetType: string, targetId: string, details?: Record<string, unknown>) =>
  prisma.adminAudit.create({
    data: { adminUserId: req.user!.userId, action, targetType, targetId, details: details as Prisma.InputJsonValue | undefined },
  });

const syncCommentCount = async (ayahId: string) => {
  const commentCount = await prisma.comment.count({ where: { ayahId, isDeleted: false, status: 'APPROVED' } });
  await prisma.ayahStat.upsert({
    where: { ayahId },
    update: { commentCount },
    create: { ayahId, commentCount },
  });
};

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalComments = await prisma.comment.count({ where: { isDeleted: false } });
    const pendingComments = await prisma.comment.count({ where: { status: 'PENDING', isDeleted: false } });
    const approvedComments = await prisma.comment.count({ where: { status: 'APPROVED', isDeleted: false } });
    const removedComments = await prisma.comment.count({ where: { status: 'REMOVED_BY_MODERATOR', isDeleted: false } });
    const totalReports = await prisma.report.count();
    const bannedUsers = await prisma.user.count({ where: { isBanned: true } });

    res.json({
      totalComments,
      pendingComments,
      approvedComments,
      removedComments,
      totalReports,
      bannedUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, invalidReportCount: true }
        },
        comment: {
          include: {
            user: {
              select: { id: true, name: true, email: true, isBanned: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const dismissReport = async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id as string);
    const { penalizeReporter } = req.body;

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (penalizeReporter) {
      await prisma.user.update({
        where: { id: report.userId },
        data: { invalidReportCount: { increment: 1 } }
      });
    }

    await prisma.report.delete({ where: { id: reportId } });
    await writeAudit(req, 'REPORT_DISMISSED', 'Report', String(reportId), { penalizeReporter: !!penalizeReporter });

    res.json({ message: 'Report dismissed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const removeComment = async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id as string);
    const { reason } = req.body;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: 'REMOVED_BY_MODERATOR',
        moderationReason: reason || 'Topluluk Kuralları İhlali'
      }
    });

    await prisma.report.deleteMany({
      where: { commentId }
    });

    await syncCommentCount(comment.ayahId);
    await writeAudit(req, 'COMMENT_REMOVED', 'Comment', String(commentId), { reason: reason || 'Topluluk Kuralları İhlali' });

    res.json({ message: 'Comment removed and reports deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const { isBanned } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: !!isBanned }
    });
    await writeAudit(req, isBanned ? 'USER_BANNED' : 'USER_UNBANNED', 'User', userId);

    res.json({ message: `User status updated successfully. Banned: ${!!isBanned}` });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPendingDeletions = async (req: Request, res: Response) => {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const pendingDeletions = await prisma.user.findMany({
      where: {
        isDeleted: true,
        deletedAt: {
          gt: fourteenDaysAgo
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        deletedAt: true,
      },
      orderBy: {
        deletedAt: 'asc'
      }
    });

    res.json(pendingDeletions);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string || '';
    const filter = req.query.filter as string || '';

    const whereClause: Prisma.UserWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (filter === 'BANNED') {
      whereClause.isBanned = true;
    } else if (filter === 'GUEST') {
      whereClause.isGuest = true;
    } else if (filter === 'REGISTERED') {
      whereClause.isGuest = false;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        isGuest: true,
        isBanned: true,
        role: true,
        invalidReportCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string || '';
    const status = req.query.status as string || '';

    const whereClause: Prisma.CommentWhereInput = {
      isDeleted: false
    };

    if (search) {
      whereClause.text = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      whereClause.status = status;
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, isBanned: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveComment = async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id as string);

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: {
        status: 'APPROVED',
        moderationReason: null
      }
    });

    await syncCommentCount(comment.ayahId);
    await writeAudit(req, 'COMMENT_APPROVED', 'Comment', String(commentId));

    res.json({ message: 'Comment approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProductAnalytics = async (req: Request, res: Response) => {
  try {
    const requestedDays = Number(req.query.days || 30);
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers, registeredUsers, guestUsers, newRegistrations, activeInstalls,
      dailyActiveInstalls, events, progressRows,
    ] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.user.count({ where: { isGuest: false, isDeleted: false } }),
      prisma.user.count({ where: { isGuest: true, isDeleted: false } }),
      prisma.user.count({ where: { isGuest: false, isDeleted: false, createdAt: { gte: since } } }),
      prisma.appEvent.findMany({ where: { createdAt: { gte: since } }, distinct: ['installId'], select: { installId: true } }),
      prisma.appEvent.findMany({ where: { createdAt: { gte: dayStart } }, distinct: ['installId'], select: { installId: true } }),
      prisma.appEvent.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, select: { event: true, installId: true, sessionId: true, screen: true, metadata: true, userId: true, createdAt: true } }),
      prisma.userProgress.findMany({ select: { userId: true, readCounts: true, currentSurah: true, currentAyah: true, completedSurahs: true } }),
    ]);

    const calculated = calculateProductAnalytics(events, progressRows);

    return res.json({
      rangeDays: days,
      users: { total: totalUsers, registered: registeredUsers, guests: guestUsers, newRegistrations },
      activity: {
        dailyActiveInstalls: dailyActiveInstalls.length,
        activeInstalls: activeInstalls.length,
        ...calculated.activity,
      },
      engagement: calculated.engagement,
      funnel: calculated.funnel,
      exitStages: calculated.exitStages,
    });
  } catch (error) {
    console.error('[Admin Analytics]:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAiFeedback = async (_req: Request, res: Response) => {
  try {
    const feedback = await prisma.aiFeedback.findMany({
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return res.json(feedback);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminAudit = async (_req: Request, res: Response) => {
  try {
    const audit = await prisma.adminAudit.findMany({
      include: { admin: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return res.json(audit);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
