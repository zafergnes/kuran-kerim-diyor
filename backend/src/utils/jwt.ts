import jwt from 'jsonwebtoken';

const requiredSecret = (name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET') => {
  const value = process.env[name];
  if (!value || value.length < 32 || value.includes('fallback') || value.includes('change_me')) {
    throw new Error(`${name} must be configured with at least 32 random characters`);
  }
  return value;
};

const JWT_SECRET = requiredSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = requiredSecret('JWT_REFRESH_SECRET');

export interface TokenPayload {
  userId: string;
  isGuest: boolean;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });

  return {
    accessToken,
    refreshToken
  };
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};
