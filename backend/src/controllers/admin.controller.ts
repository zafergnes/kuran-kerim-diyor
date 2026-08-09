import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

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

    // Decrement Comment Count on AyahStat
    await prisma.ayahStat.update({
      where: { ayahId: comment.ayahId },
      data: { commentCount: { decrement: 1 } }
    }).catch(() => {
      // Ignore if stat record does not exist
    });

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

    const whereClause: any = {};

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

    const whereClause: any = {
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

    if (comment.status === 'REMOVED_BY_MODERATOR') {
      await prisma.ayahStat.update({
        where: { ayahId: comment.ayahId },
        data: { commentCount: { increment: 1 } }
      }).catch(() => {
        // Ignore if stat record does not exist
      });
    }

    res.json({ message: 'Comment approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
