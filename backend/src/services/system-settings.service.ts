import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { prisma } from '../utils/prisma';

const GEMINI_KEY_SETTING = 'GEMINI_API_KEY';
let cachedGeminiKey: { value: string | null; expiresAt: number } | null = null;

function encryptionKey() {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY || '';
  if (!/^[a-fA-F0-9]{64}$/.test(raw)) throw new Error('SETTINGS_ENCRYPTION_KEY_NOT_CONFIGURED');
  return Buffer.from(raw, 'hex');
}

export function encryptSetting(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSetting(payload: string) {
  const [version, iv, tag, encrypted] = payload.split(':');
  if (version !== 'v1' || !iv || !tag || !encrypted) throw new Error('INVALID_ENCRYPTED_SETTING');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8');
}

export class SystemSettingsService {
  static async getGeminiApiKey() {
    if (cachedGeminiKey && cachedGeminiKey.expiresAt > Date.now()) return cachedGeminiKey.value;
    const setting = await prisma.systemSetting.findUnique({ where: { key: GEMINI_KEY_SETTING } });
    const value = setting ? decryptSetting(setting.value) : (process.env.GEMINI_API_KEY || null);
    cachedGeminiKey = { value, expiresAt: Date.now() + 60_000 };
    return value;
  }

  static async getGeminiStatus() {
    const key = await this.getGeminiApiKey();
    const setting = await prisma.systemSetting.findUnique({ where: { key: GEMINI_KEY_SETTING }, select: { updatedAt: true } });
    return {
      configured: Boolean(key),
      source: setting ? 'ADMIN_PANEL' : key ? 'ENVIRONMENT' : 'NONE',
      lastFour: key ? key.slice(-4) : null,
      updatedAt: setting?.updatedAt || null,
    };
  }

  static async setGeminiApiKey(value: string, adminUserId: string) {
    await prisma.systemSetting.upsert({
      where: { key: GEMINI_KEY_SETTING },
      create: { key: GEMINI_KEY_SETTING, value: encryptSetting(value), updatedById: adminUserId },
      update: { value: encryptSetting(value), updatedById: adminUserId },
    });
    cachedGeminiKey = { value, expiresAt: Date.now() + 60_000 };
  }

  static async removeGeminiApiKey() {
    await prisma.systemSetting.deleteMany({ where: { key: GEMINI_KEY_SETTING } });
    cachedGeminiKey = null;
  }
}
