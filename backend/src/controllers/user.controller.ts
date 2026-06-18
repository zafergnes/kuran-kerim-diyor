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
    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      }
    });

    res.json({ message: 'Account deletion scheduled. You have 14 days to cancel by logging in.' });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
