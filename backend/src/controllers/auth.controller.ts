import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const parsedData = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(parsedData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: parsedData.email,
        password: hashedPassword,
        name: parsedData.name || parsedData.email.split('@')[0],
      },
    });

    const tokens = generateTokens({ userId: user.id, isGuest: false });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: user.isGuest,
        role: user.role,
        isBanned: user.isBanned
      },
      ...tokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.issues });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const login = async (req: Request, res: Response) => {
  try {
    const parsedData = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: parsedData.email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(parsedData.password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let reactivated = false;

    if (user.isDeleted) {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      if (user.deletedAt && user.deletedAt > fourteenDaysAgo) {
        // Reactivate the account
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isDeleted: false,
            deletedAt: null,
            reactivatedAt: new Date()
          }
        });
        reactivated = true;
      } else {
        return res.status(401).json({ message: 'Invalid credentials or deleted account' });
      }
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Forbidden: Your account has been banned' });
    }

    const tokens = generateTokens({ userId: user.id, isGuest: user.isGuest });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: user.isGuest,
        role: user.role,
        isBanned: user.isBanned,
        reactivated
      },
      reactivated,
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const guestLogin = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.create({
      data: {
        email: `guest_${Date.now()}@kuran.local`, // Dummy unique email for guest
        password: await bcrypt.hash(Date.now().toString(), 10), // Random password
        isGuest: true,
      },
    });

    const tokens = generateTokens({ userId: user.id, isGuest: true });

    res.status(201).json({
      message: 'Guest login successful',
      user: { id: user.id, isGuest: true },
      ...tokens,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const tokens = generateTokens({ userId: decoded.userId, isGuest: decoded.isGuest });

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: user.isGuest,
        role: user.role,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
