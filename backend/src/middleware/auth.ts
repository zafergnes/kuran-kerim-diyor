import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../utils/prisma';

// Extend Express Request object to include the user payload
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized: Token is expired or invalid' });
  }

  // Attach decoded user info to the request object
  req.user = decoded;
  next();
};

export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
};

export const checkBanned = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  if (!userId) {
    return next();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, isDeleted: true }
    });

    if (user?.isBanned) {
      return res.status(403).json({ message: 'Forbidden: Your account has been banned' });
    }

    if (!user || user.isDeleted) {
      return res.status(401).json({ message: 'Unauthorized: Account is unavailable' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
