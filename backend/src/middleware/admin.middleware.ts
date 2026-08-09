import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export const adminOnly = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isBanned: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Forbidden: Account is banned' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
