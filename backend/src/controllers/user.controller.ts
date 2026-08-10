import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { TokenPayload } from '../utils/jwt';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userPayload = req.user;
    if (!userPayload) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isGuest: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reactivatedAt: true }
    });

    if (user && user.reactivatedAt) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (user.reactivatedAt > oneDayAgo) {
        return res.status(400).json({
          code: 'DELETE_COOLDOWN',
          message: 'Hesabınız yeni aktif edildiği için 24 saat geçmeden tekrar silme talebinde bulunamazsınız.'
        });
      }
    }

    // Soft delete: Mark account as deleted and store the timestamp
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
      prisma.pushDevice.deleteMany({ where: { userId } }),
      prisma.webPushSubscription.deleteMany({ where: { userId } }),
    ]);

    res.json({ message: 'Account deletion scheduled. You have 14 days to cancel by logging in.' });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const progress = await prisma.userProgress.findUnique({
      where: { userId }
    });

    if (!progress) {
      return res.json({
        currentSurah: 1,
        currentAyah: 1,
        completedSurahs: [],
        seenAchievements: [],
        hatimCount: 0,
        readCounts: {}
      });
    }

    res.json({
      currentSurah: progress.currentSurah,
      currentAyah: progress.currentAyah,
      completedSurahs: JSON.parse(progress.completedSurahs || '[]'),
      seenAchievements: JSON.parse(progress.seenAchievements || '[]'),
      hatimCount: progress.hatimCount,
      readCounts: JSON.parse(progress.readCounts || '{}')
    });
  } catch (error) {
    console.error('getProgress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const saveProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      currentSurah,
      currentAyah,
      completedSurahs,
      seenAchievements,
      hatimCount,
      readCounts
    } = req.body;

    const progress = await prisma.userProgress.upsert({
      where: { userId },
      create: {
        userId,
        currentSurah: currentSurah ?? 1,
        currentAyah: currentAyah ?? 1,
        completedSurahs: JSON.stringify(completedSurahs ?? []),
        seenAchievements: JSON.stringify(seenAchievements ?? []),
        hatimCount: hatimCount ?? 0,
        readCounts: JSON.stringify(readCounts ?? {})
      },
      update: {
        currentSurah: currentSurah ?? undefined,
        currentAyah: currentAyah ?? undefined,
        completedSurahs: completedSurahs ? JSON.stringify(completedSurahs) : undefined,
        seenAchievements: seenAchievements ? JSON.stringify(seenAchievements) : undefined,
        hatimCount: hatimCount !== undefined ? hatimCount : undefined,
        readCounts: readCounts ? JSON.stringify(readCounts) : undefined
      }
    });

    res.json({
      currentSurah: progress.currentSurah,
      currentAyah: progress.currentAyah,
      completedSurahs: JSON.parse(progress.completedSurahs),
      seenAchievements: JSON.parse(progress.seenAchievements),
      hatimCount: progress.hatimCount,
      readCounts: JSON.parse(progress.readCounts)
    });
  } catch (error) {
    console.error('saveProgress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const blockUser = async (req: Request, res: Response) => {
  try {
    const blockerId = req.user!.userId;
    const blockedId = req.params.id as string;
    if (blockerId === blockedId) return res.status(400).json({ message: 'You cannot block yourself' });
    const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) return res.status(404).json({ message: 'User not found' });
    await prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
    return res.status(201).json({ message: 'User blocked' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const unblockUser = async (req: Request, res: Response) => {
  try {
    const blockerId = req.user!.userId;
    const blockedId = req.params.id as string;
    await prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
    return res.json({ message: 'User unblocked' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
